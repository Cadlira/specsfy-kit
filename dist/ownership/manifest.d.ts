export interface OwnershipRecord {
    source: string;
    sha256: string;
    installedAt: string;
    updatedAt?: string;
}
export interface OwnershipManifest {
    schemaVersion: 1;
    files: Record<string, OwnershipRecord>;
}
export declare const OWNERSHIP_PATH = ".specsfy-kit/ownership.json";
export declare function readOwnership(project: string): Promise<OwnershipManifest>;
export declare function installOwnedDirectory(project: string, source: string, targetRelative: string, force?: boolean): Promise<"installed" | "updated" | "current">;
export declare function ownedDrift(project: string): Promise<string[]>;
