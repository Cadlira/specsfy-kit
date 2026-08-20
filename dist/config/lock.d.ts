import type { KitLock } from "../core/types.js";
export declare const LOCK_NAME = ".specsfy-kit.lock.json";
export declare function readLock(project: string): Promise<KitLock | undefined>;
export declare function writeLock(project: string, lock: KitLock): Promise<string>;
export declare function lockDrift(current: KitLock, previous: KitLock | undefined): string[];
