import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
async function git(project, args) {
    const { stdout } = await execFileAsync("git", ["-C", resolve(project), ...args], { encoding: "utf8", windowsHide: true });
    return stdout.trim();
}
export async function getGitContext(project) {
    const worktree = await git(project, ["rev-parse", "--show-toplevel"]);
    const branch = (await git(project, ["branch", "--show-current"])) || "DETACHED";
    const commonGitDir = resolve(worktree, await git(project, ["rev-parse", "--git-common-dir"]));
    const runtimePath = resolve(worktree, await git(project, ["rev-parse", "--git-path", "specsfy-kit/runtime.json"]));
    return { branch, worktree, repositoryRoot: worktree, commonGitDir, runtimePath };
}
export async function getGitContextOrStandalone(project) {
    try {
        return await getGitContext(project);
    }
    catch {
        const worktree = resolve(project);
        return { branch: "NO_GIT", worktree, repositoryRoot: worktree, commonGitDir: "", runtimePath: resolve(worktree, ".specsfy-kit.runtime.json") };
    }
}
export async function writeRuntime(context, state) {
    await mkdir(dirname(context.runtimePath), { recursive: true });
    await writeFile(context.runtimePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
export async function readRuntime(context) {
    try {
        return JSON.parse(await readFile(context.runtimePath, "utf8"));
    }
    catch (error) {
        if (error.code === "ENOENT")
            return undefined;
        throw error;
    }
}
//# sourceMappingURL=context.js.map