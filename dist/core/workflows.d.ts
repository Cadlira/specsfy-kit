import type { KitConfig, KitLock, RuntimeState, SpecialistResolution } from "./types.js";
import { SpecsfyAdapter } from "../specsfy/adapter.js";
export interface SyncOptions {
    profiles?: string[] | undefined;
    dryRun?: boolean | undefined;
    force?: boolean | undefined;
    adapter?: SpecsfyAdapter | undefined;
}
export interface SyncResult {
    runtime: RuntimeState;
    operations: string[];
    unavailableOfficial: string[];
}
export declare function calculateRuntime(project: string, cliProfiles?: string[], force?: boolean): Promise<{
    runtime: RuntimeState;
    configuredSpecialists: SpecialistResolution;
}>;
export declare function syncProject(project: string, options?: SyncOptions): Promise<SyncResult>;
export interface InitOptions extends SyncOptions {
    defaultProfiles: string[];
}
export declare function initProject(project: string, options: InitOptions): Promise<SyncResult & {
    config: KitConfig;
    lock?: KitLock;
}>;
export declare function projectStatus(project: string, adapter?: SpecsfyAdapter): Promise<Record<string, unknown>>;
export declare function updateProject(project: string, options?: SyncOptions & {
    upgradeSpecsfy?: boolean | undefined;
}): Promise<SyncResult & {
    lock: KitLock;
}>;
export declare function assertProjectReadable(project: string): Promise<boolean>;
