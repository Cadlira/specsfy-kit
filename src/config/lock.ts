import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { KitLock } from "../core/types.js";

export const LOCK_NAME = ".specsfy-kit.lock.json";

export async function readLock(project: string): Promise<KitLock | undefined> {
  try {
    const value = JSON.parse(await readFile(join(resolve(project), LOCK_NAME), "utf8")) as KitLock;
    if (value.schemaVersion !== 1) throw new Error("lock possui schemaVersion incompatível");
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export async function writeLock(project: string, lock: KitLock): Promise<string> {
  const path = join(resolve(project), LOCK_NAME);
  await writeFile(path, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
  return path;
}

export function lockDrift(current: KitLock, previous: KitLock | undefined): string[] {
  if (!previous) return ["lock ausente"];
  const drift: string[] = [];
  if (JSON.stringify(current.baselineProfiles) !== JSON.stringify(previous.baselineProfiles)) drift.push("profiles");
  const snapshot = (lock: KitLock): string => JSON.stringify(lock.stack.evidence.map(({ technology, version, source }) => ({ technology, version, source })));
  if (snapshot(current) !== snapshot(previous)) drift.push("stack");
  if (JSON.stringify(current.specialists) !== JSON.stringify(previous.specialists)) drift.push("specialists");
  return drift;
}
