import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import YAML from "yaml";
import { parseConfig } from "./schema.js";
export const CONFIG_NAME = ".specsfy-kit.yml";
export async function loadConfig(project) {
    const path = join(resolve(project), CONFIG_NAME);
    try {
        return parseConfig(YAML.parse(await readFile(path, "utf8")));
    }
    catch (error) {
        if (error.code === "ENOENT") {
            throw new Error(`${CONFIG_NAME} não encontrado em ${resolve(project)}; execute specsfy-kit init`);
        }
        throw error;
    }
}
export function serializeConfig(config) {
    return YAML.stringify(config, { lineWidth: 0 });
}
export async function writeConfig(project, config, force = false) {
    const path = join(resolve(project), CONFIG_NAME);
    await writeFile(path, serializeConfig(config), { encoding: "utf8", flag: force ? "w" : "wx" });
    return path;
}
//# sourceMappingURL=loader.js.map