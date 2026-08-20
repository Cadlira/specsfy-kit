import { execFile } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { promisify } from "node:util";
import { portableInvocation } from "../core/subprocess.js";

const execFileAsync = promisify(execFile);

export interface RunResult { stdout: string; stderr: string; exitCode: number }
export type CommandRunner = (command: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv }) => Promise<RunResult>;

async function compatibleEnvironment(base: NodeJS.ProcessEnv): Promise<{ env: NodeJS.ProcessEnv; cleanup: () => Promise<void> }> {
  if (process.platform !== "win32") return { env: base, cleanup: async () => undefined };

  // Specsfy 0.8.1 procura literalmente `<diretório>/git`, sem aplicar PATHEXT.
  // O sentinela satisfaz o diagnóstico; a execução posterior de `git` continua
  // sendo resolvida pelo Windows para o `git.exe` real nos demais itens do PATH.
  const directory = await mkdtemp(join(tmpdir(), "specsfy-kit-path-"));
  await writeFile(join(directory, "git"), "", "utf8");
  const pathEntry = Object.entries(base).find(([key]) => key.toLowerCase() === "path")?.[1] ?? "";
  const pathDirectories = pathEntry.split(delimiter).filter(Boolean);
  const filteredDirectories: string[] = [];
  for (const candidate of pathDirectories) {
    const exposesExtensionlessSkills = await access(join(candidate, "skills")).then(() => true).catch(() => false);
    if (!exposesExtensionlessSkills) filteredDirectories.push(candidate);
  }
  const env = Object.fromEntries(Object.entries(base).filter(([key]) => key.toLowerCase() !== "path"));
  env.PATH = [directory, ...filteredDirectories].join(delimiter);
  return { env, cleanup: () => rm(directory, { recursive: true, force: true }).then(() => undefined) };
}

const defaultRunner: CommandRunner = async (command, args, options) => {
  const invocation = portableInvocation(command, args);
  const compatible = await compatibleEnvironment({ ...options.env, ...invocation.env });
  try {
    try {
      const result = await execFileAsync(invocation.command, invocation.args, { cwd: options.cwd, env: compatible.env, encoding: "utf8", windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
      return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
    } catch (error) {
      const failed = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
      if (failed.code === "ENOENT") throw new Error(`executável Specsfy não encontrado: ${command}`);
      return { stdout: failed.stdout ?? "", stderr: failed.stderr ?? failed.message, exitCode: typeof failed.code === "number" ? failed.code : 1 };
    }
  } finally {
    await compatible.cleanup().catch(() => undefined);
  }
};

function collectNames(value: unknown, names = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) collectNames(item, names);
  else if (value && typeof value === "object") {
    const object = value as Record<string, unknown>; if (typeof object.name === "string") names.add(object.name);
    for (const child of Object.values(object)) collectNames(child, names);
  }
  return names;
}

export class SpecsfyAdapter {
  readonly command: string;
  readonly runner: CommandRunner;
  constructor(options: { command?: string; runner?: CommandRunner } = {}) {
    this.command = options.command ?? process.env.SPECSFY_BIN ?? (process.platform === "win32" ? "specsfy.cmd" : "specsfy");
    this.runner = options.runner ?? defaultRunner;
  }

  buildArgs(operation: "version" | "doctor" | "setup" | "update" | "upgrade" | "skills-list" | "skills-detect" | "skills-add", project: string, names: string[] = [], force = false): string[] {
    switch (operation) {
      case "version": return ["--version"];
      case "doctor": return ["doctor", "--project", project, "--json"];
      case "setup": return ["setup", "--project", project, ...(force ? ["--force"] : [])];
      case "update": return ["update", "--project", project, ...(force ? ["--force"] : []), "--json"];
      case "upgrade": return ["upgrade", "--json"];
      case "skills-list": return ["skills", "list", "--json"];
      case "skills-detect": return ["skills", "detect", "--project", project, "--json"];
      case "skills-add": return ["skills", "add", ...names, "--project", project, ...(force ? ["--force"] : [])];
    }
  }

  async run(operation: Parameters<SpecsfyAdapter["buildArgs"]>[0], project: string, options: { names?: string[]; force?: boolean; env?: NodeJS.ProcessEnv } = {}): Promise<RunResult> {
    const result = await this.runner(this.command, this.buildArgs(operation, project, options.names ?? [], options.force ?? false), { cwd: project, env: { ...process.env, ...options.env } });
    if (result.exitCode !== 0) throw new Error(`specsfy ${operation} falhou (${result.exitCode}): ${result.stderr.trim()}`);
    return result;
  }

  async version(project: string): Promise<string> { return (await this.run("version", project)).stdout.trim(); }
  async doctor(project: string): Promise<RunResult> { return this.run("doctor", project); }
  async setup(project: string, force = false): Promise<RunResult> { return this.run("setup", project, { force }); }
  async update(project: string, force = false): Promise<RunResult> { return this.run("update", project, { force }); }
  async upgrade(project: string): Promise<RunResult> { return this.run("upgrade", project); }
  async detectOfficial(project: string): Promise<RunResult> { return this.run("skills-detect", project); }
  async officialCatalogNames(project: string): Promise<Set<string>> {
    const output = (await this.run("skills-list", project)).stdout;
    try { return collectNames(JSON.parse(output)); } catch { return new Set([...output.matchAll(/specsfy-specialist-[\w-]+/g)].map((match) => match[0])); }
  }
  async addOfficial(project: string, names: string[], force = false): Promise<RunResult | undefined> {
    if (!names.length) return undefined; return this.run("skills-add", project, { names, force });
  }
}
