import type { Evidence, RuntimeState } from "../core/types.js";
export declare function printJson(value: unknown): void;
export declare function stackLines(evidence: Evidence[]): string[];
export declare function printRuntime(runtime: RuntimeState, operations?: string[], unavailable?: string[]): void;
