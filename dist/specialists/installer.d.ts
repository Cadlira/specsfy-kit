import type { SpecialistResolution } from "../core/types.js";
import type { SpecsfyAdapter } from "../specsfy/adapter.js";
export declare function installKitSpecialists(project: string, resolution: SpecialistResolution, force?: boolean): Promise<string[]>;
export declare function installOfficialSpecialists(project: string, resolution: SpecialistResolution, adapter: SpecsfyAdapter, force?: boolean): Promise<{
    installed: string[];
    unavailable: string[];
}>;
