import { chmod, readFile, writeFile } from "node:fs/promises";
const cli = new URL("../dist/cli/main.js", import.meta.url);
const content = await readFile(cli, "utf8");
if (!content.startsWith("#!/usr/bin/env node")) {
  await writeFile(cli, `#!/usr/bin/env node\n${content}`, "utf8");
}
if (process.platform !== "win32") await chmod(cli, 0o755);
