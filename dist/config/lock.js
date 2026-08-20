import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
export const LOCK_NAME = ".specsfy-kit.lock.json";
export async function readLock(project) {
    try {
        const value = JSON.parse(await readFile(join(resolve(project), LOCK_NAME), "utf8"));
        if (value.schemaVersion !== 1)
            throw new Error("lock possui schemaVersion incompatível");
        return value;
    }
    catch (error) {
        if (error.code === "ENOENT")
            return undefined;
        throw error;
    }
}
export async function writeLock(project, lock) {
    const path = join(resolve(project), LOCK_NAME);
    await writeFile(path, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
    return path;
}
export function lockDrift(current, previous) {
    if (!previous)
        return ["lock ausente"];
    const drift = [];
    if (JSON.stringify(current.baselineProfiles) !== JSON.stringify(previous.baselineProfiles))
        drift.push("profiles");
    const snapshot = (lock) => JSON.stringify(lock.stack.evidence.map(({ technology, version, source }) => ({ technology, version, source })));
    if (snapshot(current) !== snapshot(previous))
        drift.push("stack");
    if (JSON.stringify(current.specialists) !== JSON.stringify(previous.specialists))
        drift.push("specialists");
    return drift;
}
//# sourceMappingURL=lock.js.map