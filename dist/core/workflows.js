import { access, readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { VERSION } from "./version.js";
import { loadConfig, writeConfig } from "../config/loader.js";
import { lockDrift, readLock, writeLock } from "../config/lock.js";
import { detectStack } from "../detection/detector.js";
import { getGitContextOrStandalone, readRuntime, writeRuntime } from "../git/context.js";
import { ownedDrift } from "../ownership/manifest.js";
import { configuredProfiles, resolveProfiles, resolveSpecialists } from "../profiles/resolver.js";
import { installKitSpecialists, installOfficialSpecialists } from "../specialists/installer.js";
import { SpecsfyAdapter } from "../specsfy/adapter.js";
export async function calculateRuntime(project, cliProfiles = [], force = false) {
    const root = resolve(project);
    const config = await loadConfig(root);
    const git = await getGitContextOrStandalone(root);
    const stack = await detectStack(root);
    const resolution = resolveProfiles(config, git.branch, cliProfiles, force);
    const specialists = resolveSpecialists(resolution.profiles, stack, config);
    return {
        runtime: { schemaVersion: 1, branch: git.branch, worktree: git.worktree, profiles: resolution.profiles, profileSource: resolution.source, matchedRules: resolution.matchedRules, stack, specialists, syncedAt: new Date().toISOString() },
        configuredSpecialists: resolveSpecialists(configuredProfiles(config), stack, config),
    };
}
export async function syncProject(project, options = {}) {
    const root = resolve(project);
    const git = await getGitContextOrStandalone(root);
    const calculated = await calculateRuntime(root, options.profiles ?? [], options.force ?? false);
    if (options.dryRun)
        return { runtime: calculated.runtime, operations: ["would install/reconcile kit specialists", "would install available official specialists", `would write runtime ${git.runtimePath}`], unavailableOfficial: [] };
    const operations = await installKitSpecialists(root, calculated.configuredSpecialists, options.force);
    const official = await installOfficialSpecialists(root, calculated.configuredSpecialists, options.adapter ?? new SpecsfyAdapter(), options.force);
    operations.push(...official.installed.map((name) => `official:${name}`));
    await writeRuntime(git, calculated.runtime);
    operations.push(`runtime:${git.runtimePath}`);
    return { runtime: calculated.runtime, operations, unavailableOfficial: official.unavailable };
}
export async function initProject(project, options) {
    const root = resolve(project);
    const stack = await detectStack(root);
    const config = { schemaVersion: 1, defaultProfiles: options.defaultProfiles, branchProfiles: [], overrides: { addSpecialists: [], removeSpecialists: [] } };
    const git = await getGitContextOrStandalone(root);
    const selected = resolveProfiles(config, git.branch, options.defaultProfiles, options.force);
    const specialists = resolveSpecialists(selected.profiles, stack, config);
    if (options.dryRun) {
        const runtime = { schemaVersion: 1, branch: git.branch, worktree: git.worktree, profiles: selected.profiles, profileSource: "cli override", matchedRules: [], stack, specialists, syncedAt: new Date().toISOString() };
        return { config, runtime, operations: ["would create .specsfy-kit.yml", "would run specsfy doctor", "would run specsfy setup", "would install/reconcile specialists", "would create .specsfy-kit.lock.json"], unavailableOfficial: [] };
    }
    await writeConfig(root, config, options.force);
    const adapter = options.adapter ?? new SpecsfyAdapter();
    await adapter.doctor(root);
    await adapter.setup(root, options.force);
    const synced = await syncProject(root, { profiles: options.defaultProfiles, force: options.force, adapter });
    const lock = await createLock(root, config, stack, specialists, adapter);
    await writeLock(root, lock);
    return { config, lock, ...synced, operations: ["created:.specsfy-kit.yml", "specsfy:doctor", "specsfy:setup", ...synced.operations, "created:.specsfy-kit.lock.json"] };
}
async function createLock(project, config, stack, specialists, adapter, queryVersion = true) {
    let specsfyVersion = "unknown";
    if (queryVersion)
        try {
            specsfyVersion = await adapter.version(project);
        }
        catch { /* reported by doctor/status */ }
    return { schemaVersion: 1, kitVersion: VERSION, specsfyVersion, baselineProfiles: config.defaultProfiles, stack, specialists, generatedAt: new Date().toISOString() };
}
async function installedNames(project) {
    const names = new Set();
    try {
        for (const entry of await readdir(join(project, ".agents", "skills"), { withFileTypes: true }))
            if (entry.isDirectory())
                names.add(entry.name);
    }
    catch { /* absent */ }
    for (const lockName of ["skills-lock.json", join(".specsfy", "skills-lock.json")]) {
        try {
            const lock = JSON.parse(await readFile(join(project, lockName), "utf8"));
            for (const name of Object.keys(lock.skills ?? {}))
                names.add(name);
        }
        catch { /* absent or foreign */ }
    }
    return [...names].sort();
}
export async function projectStatus(project, adapter = new SpecsfyAdapter()) {
    const root = resolve(project);
    const config = await loadConfig(root);
    const git = await getGitContextOrStandalone(root);
    const calculated = await calculateRuntime(root);
    const previous = await readLock(root);
    const runtime = await readRuntime(git);
    let specsfyVersion = "unavailable";
    try {
        specsfyVersion = await adapter.version(root);
    }
    catch { /* status remains read-only */ }
    const currentLock = await createLock(root, config, calculated.runtime.stack, resolveSpecialists(config.defaultProfiles, calculated.runtime.stack, config), adapter, false);
    const installed = await installedNames(root);
    const expected = [...calculated.runtime.specialists.kit, ...calculated.runtime.specialists.official].map(({ name }) => name).sort();
    return { kitVersion: VERSION, specsfyVersion, config: ".specsfy-kit.yml", defaultProfiles: config.defaultProfiles, branch: git.branch, worktree: git.worktree, matchedRules: calculated.runtime.matchedRules, profiles: calculated.runtime.profiles, profileSource: calculated.runtime.profileSource, stack: calculated.runtime.stack, expectedSpecialists: expected, installedSpecialists: installed, missingSpecialists: expected.filter((name) => !installed.includes(name)), drift: { lock: lockDrift(currentLock, previous), ownership: await ownedDrift(root), runtimeStale: !runtime || runtime.branch !== git.branch || JSON.stringify(runtime.profiles) !== JSON.stringify(calculated.runtime.profiles) }, warnings: calculated.runtime.stack.warnings };
}
export async function updateProject(project, options = {}) {
    const root = resolve(project);
    const adapter = options.adapter ?? new SpecsfyAdapter();
    if (options.dryRun)
        return { ...(await syncProject(root, options)), lock: await createLock(root, await loadConfig(root), await detectStack(root), (await calculateRuntime(root)).configuredSpecialists, adapter, false) };
    if (options.upgradeSpecsfy)
        await adapter.upgrade(root);
    await adapter.update(root, options.force);
    const synced = await syncProject(root, { ...options, adapter });
    const config = await loadConfig(root);
    const stack = await detectStack(root);
    const lock = await createLock(root, config, stack, resolveSpecialists(config.defaultProfiles, stack, config), adapter);
    await writeLock(root, lock);
    return { ...synced, lock, operations: ["specsfy:update", ...synced.operations, "updated:.specsfy-kit.lock.json"] };
}
export async function assertProjectReadable(project) { try {
    await access(resolve(project));
    return true;
}
catch {
    return false;
} }
//# sourceMappingURL=workflows.js.map