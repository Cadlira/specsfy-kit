import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { detectTestPlan, executeTestPlan, type TestCommandExecutor, type TestPlan, type TestRunner } from "../src/testing/runner.js";

const cleanup: string[] = [];
const fixture = (name: string): string => resolve("fixtures", name);

afterEach(async () => { await Promise.all(cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true }))); });

describe("runner de testes", () => {
  it("detecta Maven e transforma verify sem interpolar argumentos", async () => {
    const plan = await detectTestPlan(fixture("java8-legacy"), { platform: "win32", verify: true, runnerArgs: ["-Dtest=User Service"] });
    expect(plan.mode).toBe("verify");
    expect(plan.runners).toHaveLength(1);
    expect(plan.runners[0]).toMatchObject({ kind: "maven", command: "mvn.cmd", args: ["verify", "-Dtest=User Service"], source: "pom.xml" });
  });

  it("prioriza wrapper versionado acima de um módulo", async () => {
    const root = await temporaryProject();
    await writeFile(join(root, "mvnw.cmd"), "@echo off\r\n", "utf8");
    await mkdir(join(root, "service"));
    await writeFile(join(root, "service", "pom.xml"), "<project/>", "utf8");
    const plan = await detectTestPlan(root, { platform: "win32" });
    expect(plan.runners[0]?.command).toBe(join(root, "mvnw.cmd"));
  });

  it("executa uma vez o agregador Maven e inclui o frontend do monorepo", async () => {
    const plan = await detectTestPlan(fixture("java-vue-monorepo"), { platform: "linux" });
    expect(plan.runners.map(({ kind, source }) => `${kind}:${source}`)).toEqual(["maven:pom.xml", "npm:frontend/package.json"]);
  });

  it("detecta Gradle multi-module uma única vez", async () => {
    const plan = await detectTestPlan(fixture("gradle-java"), { platform: "linux", verify: true });
    expect(plan.runners).toHaveLength(1);
    expect(plan.runners[0]).toMatchObject({ kind: "gradle", args: ["check"] });
  });

  it("respeita packageManager e argumentos de script", async () => {
    const root = await temporaryProject();
    await writeFile(join(root, "package.json"), JSON.stringify({ packageManager: "pnpm@10.0.0", scripts: { test: "vitest" } }), "utf8");
    const plan = await detectTestPlan(root, { platform: "win32", runnerArgs: ["--runInBand"] });
    expect(plan.runners[0]).toMatchObject({ kind: "pnpm", command: "pnpm.cmd", args: ["test", "--", "--runInBand"] });
  });

  it("não duplica pacotes cobertos por um workspace com script de teste", async () => {
    const root = await temporaryProject();
    await writeFile(join(root, "package.json"), JSON.stringify({ workspaces: ["packages/*"], scripts: { test: "npm -ws test" } }), "utf8");
    await mkdir(join(root, "packages", "api"), { recursive: true });
    await writeFile(join(root, "packages", "api", "package.json"), JSON.stringify({ scripts: { test: "node --test" } }), "utf8");
    const plan = await detectTestPlan(root, { platform: "linux" });
    expect(plan.runners.map(({ source }) => source)).toEqual(["package.json"]);
  });

  it("agrega resultados, continua após falha e preserva o exit code", async () => {
    const runners = [fakeRunner("maven", 0), fakeRunner("npm", 1)];
    const plan: TestPlan = { project: ".", mode: "test", runners, warnings: [] };
    const called: string[] = [];
    const executor: TestCommandExecutor = async (runner, stdout, stderr) => {
      called.push(runner.id); stdout(`${runner.id} out`); stderr(`${runner.id} err`);
      return { exitCode: runner.id.endsWith("1") ? 1 : 0, durationMs: 10, stdout: "captured out", stderr: "captured err" };
    };
    const execution = await executeTestPlan(plan, { captureOnly: true, executor });
    expect(called).toEqual(["maven:0", "npm:1"]);
    expect(execution.ok).toBe(false);
    expect(execution.results.map(({ exitCode }) => exitCode)).toEqual([0, 1]);
  });

  it("dry-run não chama o executor", async () => {
    const plan: TestPlan = { project: ".", mode: "test", runners: [fakeRunner("npm", 0)], warnings: [] };
    const executor: TestCommandExecutor = async () => { throw new Error("não deveria executar"); };
    await expect(executeTestPlan(plan, { dryRun: true, executor })).resolves.toMatchObject({ ok: true, dryRun: true, results: [] });
  });

  it("retorna aviso quando não há script ou build suportado", async () => {
    const root = await temporaryProject();
    await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { build: "tsc" } }), "utf8");
    const plan = await detectTestPlan(root);
    expect(plan.runners).toEqual([]);
    expect(plan.warnings).toContain("nenhum runner de teste suportado foi detectado");
  });
});

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "specsfy-kit-test-runner-")); cleanup.push(root); return root;
}

function fakeRunner(kind: "maven" | "npm", index: number): TestRunner {
  return { id: `${kind}:${index}`, kind, label: kind, cwd: ".", command: kind, args: ["test"], display: `${kind} test`, source: `${index}` };
}
