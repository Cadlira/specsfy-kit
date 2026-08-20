import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { CONFIG_NAME, loadConfig } from "../config/loader.js";
import { readLock } from "../config/lock.js";
import { getGitContextOrStandalone } from "../git/context.js";
import { validateProfiles } from "../profiles/resolver.js";
import { SpecsfyAdapter } from "../specsfy/adapter.js";
import { MINIMUM_NODE } from "./version.js";
import { portableInvocation } from "./subprocess.js";
const execFileAsync = promisify(execFile);
async function command(name, args) {
    const invocation = portableInvocation(name, args);
    try {
        const { stdout } = await execFileAsync(invocation.command, invocation.args, { encoding: "utf8", windowsHide: true, env: { ...process.env, ...invocation.env } });
        return { name, ok: true, detail: stdout.trim().split(/\r?\n/)[0] ?? "ok" };
    }
    catch (error) {
        return { name, ok: false, detail: error.message };
    }
}
function versionParts(value) { return value.replace(/^v/, "").split(".").map((part) => Number.parseInt(part, 10) || 0); }
function atLeast(value, minimum) { const a = versionParts(value); const b = versionParts(minimum); for (let i = 0; i < 3; i += 1) {
    if ((a[i] ?? 0) !== (b[i] ?? 0))
        return (a[i] ?? 0) > (b[i] ?? 0);
} return true; }
export async function doctorProject(project, adapter = new SpecsfyAdapter()) {
    const root = resolve(project);
    const checks = [await command(process.execPath, ["--version"]), await command(process.platform === "win32" ? "npm.cmd" : "npm", ["--version"]), await command("git", ["--version"])];
    checks[0] = { name: "node", ok: checks[0].ok && atLeast(checks[0].detail, MINIMUM_NODE), detail: `${checks[0].detail}; mínimo ${MINIMUM_NODE}` };
    checks[1].name = "npm";
    checks[2].name = "git";
    try {
        checks.push({ name: "specsfy", ok: true, detail: await adapter.version(root) });
    }
    catch (error) {
        checks.push({ name: "specsfy", ok: false, detail: error.message });
    }
    try {
        const config = await loadConfig(root);
        validateProfiles(config.defaultProfiles);
        checks.push({ name: "config", ok: true, detail: CONFIG_NAME });
    }
    catch (error) {
        checks.push({ name: "config", ok: false, detail: error.message });
    }
    try {
        const lock = await readLock(root);
        checks.push({ name: "lock", ok: Boolean(lock), detail: lock ? "schemaVersion 1" : "ausente" });
    }
    catch (error) {
        checks.push({ name: "lock", ok: false, detail: error.message });
    }
    const git = await getGitContextOrStandalone(root);
    checks.push({ name: "project", ok: true, detail: git.worktree });
    return checks;
}
//# sourceMappingURL=doctor.js.map