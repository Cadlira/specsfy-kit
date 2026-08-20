import type { KitConfig, ProfileResolution, SpecialistResolution, StackReport } from "../core/types.js";
export declare function validateProfiles(names: string[], allowConflicts?: boolean): string[];
export declare function resolveProfiles(config: KitConfig, branch: string, cliProfiles?: string[], allowConflicts?: boolean): ProfileResolution;
export declare function configuredProfiles(config: KitConfig): string[];
export declare function resolveSpecialists(profileNames: string[], stack: StackReport, config?: KitConfig): SpecialistResolution;
export declare function suggestProfiles(stack: StackReport): Array<{
    profile: string;
    reason: string;
}>;
