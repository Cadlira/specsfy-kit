import { spawn } from "node:child_process";
import { access, readFile, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { portableInvocation } from "../core/subprocess.js";
import { scanProject } from "../detection/files.js";

export type TestRunnerKind = "maven" | "gradle" | "npm" | "pnpm" | "yarn" | "bun";

export interface TestRunner {
  id: string;
  kind: TestRunnerKind;
  label: string;
  cwd: string;
  command: string;
  args: string[];
  display: string;
  source: string;
}

export interface TestPlan {
  project: string;
  mode: "test" | "verify";
  runners: TestRunner[];
  warnings: string[];
}

export interface TestRunnerResult {
  runner: TestRunner;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export interface TestExecution {
  plan: TestPlan;
  results: TestRunnerResult[];
  ok: boolean;
  dryRun: boolean;
}

export interface DetectTestOptions {
  verify?: boolean;
  runnerArgs?: string[];
  kinds?: TestRunnerKind[];
  platform?: NodeJS.Platform;
}

export interface ExecuteTestOptions {
  dryRun?: boolean;
  captureOnly?: boolean;
  emitStdout?: (chunk: string) => void;
  emitStderr?: (chunk: string) => void;
  executor?: TestCommandExecutor;
}

export type TestCommandExecutor = (
  runner: TestRunner,
  emitStdout: (chunk: string) => void,
  emitStderr: (chunk: string) => void,
) => Promise<{ exitCode: number; durationMs: number; stdout: string; stderr: string }>;

interface PackageManifest {
  packageManager?: unknown;
  scripts?: Record<string, unknown>;
  workspaces?: unknown;
}

const runnerRank: Record<TestRunnerKind, number> = { maven: 1, gradle: 2, npm: 3, pnpm: 3, yarn: 3, bun: 3 };

export async function detectTestPlan(project: string, options: DetectTestOptions = {}): Promise<TestPlan> {
  const root = resolve(project);
  await assertDirectory(root);
  const scan = await scanProject(root);
  const platform = options.platform ?? process.platform;
  const extra = options.runnerArgs ?? [];
  const runners = [
    ...(await detectMaven(root, scan.files, platform, options.verify ?? false, extra)),
    ...(await detectGradle(root, scan.files, platform, options.verify ?? false, extra)),
    ...(await detectNode(root, scan.files, platform, extra)),
  ].filter((runner) => !options.kinds?.length || options.kinds.includes(runner.kind));

  runners.sort((left, right) => runnerRank[left.kind] - runnerRank[right.kind] || left.cwd.localeCompare(right.cwd));
  const warnings: string[] = [];
  if (scan.truncated) warnings.push("scan limitado a 5000 entradas");
  if (!runners.length) warnings.push("nenhum runner de teste suportado foi detectado");
  return { project: root, mode: options.verify ? "verify" : "test", runners, warnings };
}

export async function executeTestPlan(plan: TestPlan, options: ExecuteTestOptions = {}): Promise<TestExecution> {
  if (options.dryRun) return { plan, results: [], ok: plan.runners.length > 0, dryRun: true };
  if (!plan.runners.length) return { plan, results: [], ok: false, dryRun: false };
  const results: TestRunnerResult[] = [];
  const emitStdout = options.captureOnly ? (): void => undefined : (options.emitStdout ?? ((chunk): void => { process.stdout.write(chunk); }));
  const emitStderr = options.captureOnly ? (): void => undefined : (options.emitStderr ?? ((chunk): void => { process.stderr.write(chunk); }));
  const executor = options.executor ?? spawnTestCommand;

  for (const runner of plan.runners) {
    try {
      const result = await executor(runner, emitStdout, emitStderr);
      results.push({ runner, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      emitStderr(`${message}\n`);
      results.push({ runner, exitCode: 1, durationMs: 0, stdout: "", stderr: message });
    }
  }
  return { plan, results, ok: results.length > 0 && results.every(({ exitCode }) => exitCode === 0), dryRun: false };
}

async function detectMaven(root: string, files: string[], platform: NodeJS.Platform, verify: boolean, extra: string[]): Promise<TestRunner[]> {
  const poms = files.filter((file) => basename(file).toLowerCase() === "pom.xml");
  const aggregators = new Set<string>();
  for (const pom of poms) {
    if (/<modules(?:\s[^>]*)?>[\s\S]*?<module(?:\s[^>]*)?>/i.test(await safeRead(pom))) aggregators.add(dirname(pom));
  }
  const candidates = uniqueDirectories(poms.map(dirname)).filter((directory) => !hasOwningAncestor(directory, aggregators));
  return Promise.all(candidates.map(async (cwd) => {
    const wrapper = await findWrapper(cwd, root, platform === "win32" ? ["mvnw.cmd", "mvnw"] : ["mvnw"]);
    const command = wrapper ?? (platform === "win32" ? "mvn.cmd" : "mvn");
    const args = [verify ? "verify" : "test", ...extra];
    return createRunner("maven", "Maven", cwd, command, args, relative(root, join(cwd, "pom.xml")) || "pom.xml");
  }));
}

async function detectGradle(root: string, files: string[], platform: NodeJS.Platform, verify: boolean, extra: string[]): Promise<TestRunner[]> {
  const settingFiles = files.filter((file) => /^settings\.gradle(?:\.kts)?$/i.test(basename(file)));
  const settings = settingFiles.map(dirname);
  const builds = files.filter((file) => /^build\.gradle(?:\.kts)?$/i.test(basename(file))).map(dirname);
  const roots = new Set(uniqueDirectories(settings));
  for (const directory of uniqueDirectories(builds)) {
    if (!hasOwningAncestorOrSelf(directory, roots)) roots.add(directory);
  }
  return Promise.all([...roots].map(async (cwd) => {
    const wrapper = await findWrapper(cwd, root, platform === "win32" ? ["gradlew.bat", "gradlew"] : ["gradlew"]);
    const command = wrapper ?? (platform === "win32" ? "gradle.bat" : "gradle");
    const args = [verify ? "check" : "test", ...extra];
    const source = basename(settingFiles.find((file) => dirname(file) === cwd) ?? files.find((file) => dirname(file) === cwd && /^build\.gradle(?:\.kts)?$/i.test(basename(file))) ?? "build.gradle");
    return createRunner("gradle", "Gradle", cwd, command, args, relative(root, join(cwd, source)) || source);
  }));
}

async function detectNode(root: string, files: string[], platform: NodeJS.Platform, extra: string[]): Promise<TestRunner[]> {
  const packages: Array<{ cwd: string; manifest: PackageManifest }> = [];
  for (const path of files.filter((file) => basename(file).toLowerCase() === "package.json")) {
    const manifest = await readPackage(path);
    if (typeof manifest.scripts?.test === "string" && manifest.scripts.test.trim()) packages.push({ cwd: dirname(path), manifest });
  }
  const workspaceOwners = new Set(packages.filter(({ manifest }) => hasWorkspaces(manifest.workspaces)).map(({ cwd }) => cwd));
  return Promise.all(packages
    .filter(({ cwd }) => !hasOwningAncestor(cwd, workspaceOwners))
    .map(async ({ cwd, manifest }) => {
      const kind = await nodeRunnerKind(cwd, root, manifest);
      const command = nodeCommand(kind, platform);
      const args = nodeArguments(kind, extra);
      return createRunner(kind, nodeLabel(kind), cwd, command, args, relative(root, join(cwd, "package.json")) || "package.json");
    }));
}

function createRunner(kind: TestRunnerKind, label: string, cwd: string, command: string, args: string[], source: string): TestRunner {
  return {
    id: `${kind}:${source.replaceAll("\\", "/")}`,
    kind,
    label,
    cwd,
    command,
    args,
    display: [command, ...args].map(displayArgument).join(" "),
    source: source.replaceAll("\\", "/"),
  };
}

async function spawnTestCommand(runner: TestRunner, emitStdout: (chunk: string) => void, emitStderr: (chunk: string) => void): Promise<{ exitCode: number; durationMs: number; stdout: string; stderr: string }> {
  const invocation = portableInvocation(runner.command, runner.args);
  const startedAt = performance.now();
  return new Promise((resolvePromise, reject) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(invocation.command, invocation.args, {
      cwd: runner.cwd,
      env: { ...process.env, NO_COLOR: process.env.NO_COLOR ?? "1", ...invocation.env },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    child.stdout.on("data", (data: Buffer) => { const chunk = data.toString(); stdout += chunk; emitStdout(chunk); });
    child.stderr.on("data", (data: Buffer) => { const chunk = data.toString(); stderr += chunk; emitStderr(chunk); });
    child.once("error", reject);
    child.once("close", (code) => resolvePromise({ exitCode: code ?? 1, durationMs: performance.now() - startedAt, stdout, stderr }));
  });
}

async function findWrapper(start: string, root: string, names: string[]): Promise<string | undefined> {
  let current = start;
  while (isWithin(root, current)) {
    for (const name of names) {
      const candidate = join(current, name);
      if (await exists(candidate)) return candidate;
    }
    if (current === root) break;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return undefined;
}

async function nodeRunnerKind(cwd: string, root: string, manifest: PackageManifest): Promise<Extract<TestRunnerKind, "npm" | "pnpm" | "yarn" | "bun">> {
  const declared = typeof manifest.packageManager === "string" ? manifest.packageManager.split("@")[0] : undefined;
  if (declared === "pnpm" || declared === "yarn" || declared === "bun" || declared === "npm") return declared;
  let current = cwd;
  while (isWithin(root, current)) {
    if (await exists(join(current, "pnpm-lock.yaml"))) return "pnpm";
    if (await exists(join(current, "yarn.lock"))) return "yarn";
    if (await exists(join(current, "bun.lock")) || await exists(join(current, "bun.lockb"))) return "bun";
    if (await exists(join(current, "package-lock.json")) || current === root) return "npm";
    current = dirname(current);
  }
  return "npm";
}

function nodeCommand(kind: Extract<TestRunnerKind, "npm" | "pnpm" | "yarn" | "bun">, platform: NodeJS.Platform): string {
  if (kind === "bun") return platform === "win32" ? "bun.exe" : "bun";
  return platform === "win32" ? `${kind}.cmd` : kind;
}

function nodeArguments(kind: Extract<TestRunnerKind, "npm" | "pnpm" | "yarn" | "bun">, extra: string[]): string[] {
  if (!extra.length) return ["test"];
  return kind === "npm" || kind === "pnpm" ? ["test", "--", ...extra] : ["test", ...extra];
}

function nodeLabel(kind: Extract<TestRunnerKind, "npm" | "pnpm" | "yarn" | "bun">): string {
  return `${kind === "npm" ? "npm" : kind[0]?.toUpperCase()}${kind === "npm" ? "" : kind.slice(1)} script test`;
}

async function readPackage(path: string): Promise<PackageManifest> {
  try {
    const value: unknown = JSON.parse(await readFile(path, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("raiz deve ser um objeto");
    return value as PackageManifest;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`package.json inválido em ${path}: ${message}`);
  }
}

function hasWorkspaces(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value && typeof value === "object" && "packages" in value && Array.isArray((value as { packages?: unknown }).packages));
}

function uniqueDirectories(values: string[]): string[] {
  return [...new Set(values.map((value) => resolve(value)))].sort((left, right) => left.localeCompare(right));
}

function hasOwningAncestor(directory: string, owners: Set<string>): boolean {
  return [...owners].some((owner) => owner !== directory && isWithin(owner, directory));
}

function hasOwningAncestorOrSelf(directory: string, owners: Set<string>): boolean {
  return [...owners].some((owner) => isWithin(owner, directory));
}

function isWithin(parent: string, child: string): boolean {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}

function displayArgument(value: string): string {
  return /[\s"']/u.test(value) ? JSON.stringify(value) : value;
}

async function safeRead(path: string): Promise<string> {
  try { return await readFile(path, "utf8"); } catch { return ""; }
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function assertDirectory(path: string): Promise<void> {
  try { if (!(await stat(path)).isDirectory()) throw new Error("não é diretório"); } catch { throw new Error(`projeto não encontrado: ${path}`); }
}
