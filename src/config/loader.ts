import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import YAML from "yaml";
import type { KitConfig } from "../core/types.js";
import { parseConfig } from "./schema.js";

export const CONFIG_NAME = ".specsfy-kit.yml";

export async function loadConfig(project: string): Promise<KitConfig> {
  const path = join(resolve(project), CONFIG_NAME);
  try {
    return parseConfig(YAML.parse(await readFile(path, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`${CONFIG_NAME} não encontrado em ${resolve(project)}; execute specsfy-kit init`);
    }
    throw error;
  }
}

export function serializeConfig(config: KitConfig): string {
  return YAML.stringify(config, { lineWidth: 0 });
}

export async function writeConfig(project: string, config: KitConfig, force = false): Promise<string> {
  const path = join(resolve(project), CONFIG_NAME);
  await writeFile(path, serializeConfig(config), { encoding: "utf8", flag: force ? "w" : "wx" });
  return path;
}
