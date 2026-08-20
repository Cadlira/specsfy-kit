import { access, cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { initProject, updateProject } from "../src/core/workflows.js";
import { SpecsfyAdapter, type CommandRunner } from "../src/specsfy/adapter.js";

const cleanup: string[] = [];
afterEach(async () => { for (const path of cleanup.splice(0)) await rm(path, { recursive: true, force: true }); });

describe("init integrado com Specsfy fake", () => {
  it("persiste profile antes de doctor/setup e cria lock", async () => {
    const project = await mkdtemp(join(tmpdir(), "specsfy-kit-init-")); cleanup.push(project); await cp(resolve("fixtures/java21-spring4-hibernate4"), project, { recursive: true }); const calls: string[][] = [];
    const runner: CommandRunner = async (_command, args, options) => {
      calls.push(args); if (["doctor", "setup"].includes(args[0]!)) expect(await readFile(join(options.cwd, ".specsfy-kit.yml"), "utf8")).toContain("java-modernization");
      if (args[0] === "--version") return { stdout: "0.8.1\n", stderr: "", exitCode: 0 };
      if (args[0] === "skills" && args[1] === "list") return { stdout: JSON.stringify([{ name: "specsfy-specialist-software-architecture" }]), stderr: "", exitCode: 0 };
      return { stdout: "{}", stderr: "", exitCode: 0 };
    };
    const result = await initProject(project, { defaultProfiles: ["java-modernization"], adapter: new SpecsfyAdapter({ command: "fake", runner }) });
    expect(calls.map((args) => args.slice(0, 2).join(" "))).toEqual(["doctor --project", "setup --project", "skills list", "skills add", "--version"]); expect(result.lock?.specsfyVersion).toBe("0.8.1"); await expect(access(join(project, ".specsfy-kit.lock.json"))).resolves.toBeUndefined();
  });
  it("dry-run não escreve nem chama executável", async () => {
    const project = await mkdtemp(join(tmpdir(), "specsfy-kit-dry-")); cleanup.push(project); await cp(resolve("fixtures/vue-quasar"), project, { recursive: true }); let called = false;
    const runner: CommandRunner = async () => { called = true; return { stdout: "", stderr: "", exitCode: 0 }; };
    const result = await initProject(project, { defaultProfiles: ["vue-quasar"], dryRun: true, adapter: new SpecsfyAdapter({ runner }) }); expect(result.operations[0]).toContain("would create"); expect(called).toBe(false); await expect(access(join(project, ".specsfy-kit.yml"))).rejects.toBeDefined();
  });
  it("update dry-run também não chama executável", async () => {
    const project = await mkdtemp(join(tmpdir(), "specsfy-kit-update-dry-")); cleanup.push(project); await cp(resolve("fixtures/java8-legacy"), project, { recursive: true }); await cp(resolve("fixtures/git-branches-modernization/.specsfy-kit.yml"), join(project, ".specsfy-kit.yml")); let called = false;
    const runner: CommandRunner = async () => { called = true; return { stdout: "", stderr: "", exitCode: 0 }; };
    await updateProject(project, { dryRun: true, adapter: new SpecsfyAdapter({ runner }) }); expect(called).toBe(false);
  });
});
