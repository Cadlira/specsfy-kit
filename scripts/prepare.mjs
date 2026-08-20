import { access } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const compiler = join(root, "node_modules", "typescript", "bin", "tsc");
const builtCli = join(root, "dist", "cli", "main.js");

async function exists(path) {
  return access(path).then(() => true).catch(() => false);
}

if (await exists(compiler)) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("npm_execpath ausente; não foi possível executar o build de prepare");
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmCli, "run", "build"], { cwd: root, stdio: "inherit", windowsHide: true });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) process.exit(exitCode);
} else if (await exists(builtCli)) {
  process.stdout.write("specsfy-kit: usando dist versionado para instalação Git global\n");
} else {
  throw new Error("TypeScript e dist/cli/main.js ausentes; execute npm install antes de empacotar");
}
