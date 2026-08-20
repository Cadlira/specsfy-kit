import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import type { GitContext, RuntimeState } from "../core/types.js";

const execFileAsync = promisify(execFile);

async function git(project: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", ["-C", resolve(project), ...args], { encoding: "utf8", windowsHide: true });
  return stdout.trim();
}

export async function getGitContext(project: string): Promise<GitContext> {
  const worktree = await git(project, ["rev-parse", "--show-toplevel"]);
  const branch = (await git(project, ["branch", "--show-current"])) || "DETACHED";
  const commonGitDir = resolve(worktree, await git(project, ["rev-parse", "--git-common-dir"]));
  const runtimePath = resolve(worktree, await git(project, ["rev-parse", "--git-path", "specsfy-kit/runtime.json"]));
  return { branch, worktree, repositoryRoot: worktree, commonGitDir, runtimePath };
}

export async function getGitContextOrStandalone(project: string): Promise<GitContext> {
  try { return await getGitContext(project); } catch {
    const worktree = resolve(project);
    return { branch: "NO_GIT", worktree, repositoryRoot: worktree, commonGitDir: "", runtimePath: resolve(worktree, ".specsfy-kit.runtime.json") };
  }
}

export async function writeRuntime(context: GitContext, state: RuntimeState): Promise<void> {
  await mkdir(dirname(context.runtimePath), { recursive: true });
  await writeFile(context.runtimePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function readRuntime(context: GitContext): Promise<RuntimeState | undefined> {
  try { return JSON.parse(await readFile(context.runtimePath, "utf8")) as RuntimeState; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
}
