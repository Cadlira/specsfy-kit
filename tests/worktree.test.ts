import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { getGitContext, readRuntime, writeRuntime } from "../src/git/context.js";
import { loadConfig } from "../src/config/loader.js";
import { resolveProfiles } from "../src/profiles/resolver.js";
import type { RuntimeState } from "../src/core/types.js";

const run = promisify(execFile); const cleanup: string[] = [];
async function git(cwd: string, ...args: string[]): Promise<void> { await run("git", ["-C", cwd, ...args], { windowsHide: true }); }
afterEach(async () => { for (const path of cleanup.splice(0)) await rm(path, { recursive: true, force: true, maxRetries: 3 }); });

describe("Git worktrees", () => {
  it("resolve profiles e runtime de forma isolada", async () => {
    const parent = await mkdtemp(join(tmpdir(), "specsfy-kit-worktree-")); cleanup.push(parent); const main = join(parent, "main"); const modernization = join(parent, "modernization");
    await run("git", ["init", "-b", "main", main], { windowsHide: true }); await git(main, "config", "user.name", "Specsfy Kit Test"); await git(main, "config", "user.email", "test@example.invalid");
    const source = await readFile("fixtures/git-branches-modernization/.specsfy-kit.yml", "utf8"); await writeFile(join(main, ".specsfy-kit.yml"), source); await git(main, "add", ".specsfy-kit.yml"); await git(main, "commit", "-m", "fixture"); await git(main, "branch", "modernizacao/java21"); await git(main, "worktree", "add", modernization, "modernizacao/java21");
    const mainGit = await getGitContext(main); const modernGit = await getGitContext(modernization); expect(mainGit.runtimePath).not.toBe(modernGit.runtimePath);
    expect(resolveProfiles(await loadConfig(main), mainGit.branch)).toMatchObject({ profiles: ["java-legacy"], source: "defaultProfiles" });
    expect(resolveProfiles(await loadConfig(modernization), modernGit.branch)).toMatchObject({ profiles: ["java-modernization"], source: "branch rule" });
    const base = { schemaVersion: 1 as const, worktree: "", matchedRules: [], stack: { project: "", detectedAt: "now", evidence: [], scannedFiles: 0, warnings: [] }, specialists: { kit: [], official: [] }, syncedAt: "now" };
    await writeRuntime(mainGit, { ...base, branch: "main", worktree: main, profiles: ["java-legacy"], profileSource: "defaultProfiles" } satisfies RuntimeState);
    await writeRuntime(modernGit, { ...base, branch: "modernizacao/java21", worktree: modernization, profiles: ["java-modernization"], profileSource: "branch rule" } satisfies RuntimeState);
    expect((await readRuntime(mainGit))?.profiles).toEqual(["java-legacy"]); expect((await readRuntime(modernGit))?.profiles).toEqual(["java-modernization"]);
  }, 15_000);
});
