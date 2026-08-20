import type { KitConfig } from "../core/types.js";
export declare const CONFIG_NAME = ".specsfy-kit.yml";
export declare function loadConfig(project: string): Promise<KitConfig>;
export declare function serializeConfig(config: KitConfig): string;
export declare function writeConfig(project: string, config: KitConfig, force?: boolean): Promise<string>;
