import { execFile } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { promisify } from "node:util";
import { portableInvocation } from "../core/subprocess.js";
const execFileAsync = promisify(execFile);
async function compatibleEnvironment(base) {
    if (process.platform !== "win32")
        return { env: base, cleanup: async () => undefined };
    // Specsfy 0.8.1 procura literalmente `<diretório>/git`, sem aplicar PATHEXT.
    // O sentinela satisfaz o diagnóstico; a execução posterior de `git` continua
    // sendo resolvida pelo Windows para o `git.exe` real nos demais itens do PATH.
    const directory = await mkdtemp(join(tmpdir(), "specsfy-kit-path-"));
    await writeFile(join(directory, "git"), "", "utf8");
    const pathEntry = Object.entries(base).find(([key]) => key.toLowerCase() === "path")?.[1] ?? "";
    const pathDirectories = pathEntry.split(delimiter).filter(Boolean);
    const filteredDirectories = [];
    for (const candidate of pathDirectories) {
        const exposesExtensionlessSkills = await access(join(candidate, "skills")).then(() => true).catch(() => false);
        if (!exposesExtensionlessSkills)
            filteredDirectories.push(candidate);
    }
    const env = Object.fromEntries(Object.entries(base).filter(([key]) => key.toLowerCase() !== "path"));
    env.PATH = [directory, ...filteredDirectories].join(delimiter);
    return { env, cleanup: () => rm(directory, { recursive: true, force: true }).then(() => undefined) };
}
const defaultRunner = async (command, args, options) => {
    const invocation = portableInvocation(command, args);
    const compatible = await compatibleEnvironment({ ...options.env, ...invocation.env });
    try {
        try {
            const result = await execFileAsync(invocation.command, invocation.args, { cwd: options.cwd, env: compatible.env, encoding: "utf8", windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
            return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
        }
        catch (error) {
            const failed = error;
            if (failed.code === "ENOENT")
                throw new Error(`executável Specsfy não encontrado: ${command}`);
            return { stdout: failed.stdout ?? "", stderr: failed.stderr ?? failed.message, exitCode: typeof failed.code === "number" ? failed.code : 1 };
        }
    }
    finally {
        await compatible.cleanup().catch(() => undefined);
    }
};
function collectNames(value, names = new Set()) {
    if (Array.isArray(value))
        for (const item of value)
            collectNames(item, names);
    else if (value && typeof value === "object") {
        const object = value;
        if (typeof object.name === "string")
            names.add(object.name);
        for (const child of Object.values(object))
            collectNames(child, names);
    }
    return names;
}
export class SpecsfyAdapter {
    command;
    runner;
    constructor(options = {}) {
        this.command = options.command ?? process.env.SPECSFY_BIN ?? (process.platform === "win32" ? "specsfy.cmd" : "specsfy");
        this.runner = options.runner ?? defaultRunner;
    }
    buildArgs(operation, project, names = [], force = false) {
        switch (operation) {
            case "version": return ["--version"];
            case "doctor": return ["doctor", "--project", project, "--json"];
            case "setup": return ["setup", "--project", project, ...(force ? ["--force"] : [])];
            case "update": return ["update", "--project", project, ...(force ? ["--force"] : []), "--json"];
            case "upgrade": return ["upgrade", "--json"];
            case "progress": return ["progress", "--project", project];
            case "skills-list": return ["skills", "list", "--json"];
            case "skills-detect": return ["skills", "detect", "--project", project, "--json"];
            case "skills-add": return ["skills", "add", ...names, "--project", project, ...(force ? ["--force"] : [])];
        }
    }
    async run(operation, project, options = {}) {
        const args = this.buildArgs(operation, project, options.names ?? [], options.force ?? false);
        if (options.json && !args.includes("--json"))
            args.push("--json");
        const result = await this.runner(this.command, args, { cwd: project, env: { ...process.env, ...options.env } });
        if (result.exitCode !== 0)
            throw new Error(`specsfy ${operation} falhou (${result.exitCode}): ${result.stderr.trim()}`);
        return result;
    }
    async version(project) { return (await this.run("version", project)).stdout.trim(); }
    async doctor(project) { return this.run("doctor", project); }
    async setup(project, force = false) { return this.run("setup", project, { force }); }
    async update(project, force = false) { return this.run("update", project, { force }); }
    async upgrade(project) { return this.run("upgrade", project); }
    async progress(project, json = false) { return this.run("progress", project, { json }); }
    async detectOfficial(project) { return this.run("skills-detect", project); }
    async officialCatalogNames(project) {
        const output = (await this.run("skills-list", project)).stdout;
        try {
            return collectNames(JSON.parse(output));
        }
        catch {
            return new Set([...output.matchAll(/specsfy-specialist-[\w-]+/g)].map((match) => match[0]));
        }
    }
    async addOfficial(project, names, force = false) {
        if (!names.length)
            return undefined;
        return this.run("skills-add", project, { names, force });
    }
}
//# sourceMappingURL=adapter.js.map