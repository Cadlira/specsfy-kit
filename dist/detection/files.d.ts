export interface ScanResult {
    files: string[];
    count: number;
    truncated: boolean;
}
export declare function scanProject(project: string, maxDepth?: number, maxEntries?: number): Promise<ScanResult>;
