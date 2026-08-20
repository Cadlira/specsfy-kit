import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

export interface OwnershipRecord { source: string; sha256: string; installedAt: string; updatedAt?: string }
export interface OwnershipManifest { schemaVersion: 1; files: Record<string, OwnershipRecord> }

export const OWNERSHIP_PATH = ".specsfy-kit/ownership.json";

async function hashPath(path: string): Promise<string> {
  const digest = createHash("sha256");
  const visit = async (current: string): Promise<void> => {
    const info = await stat(current);
    if (info.isDirectory()) {
      for (const name of (await readdir(current)).sort()) { digest.update(name); digest.update("\0"); await visit(join(current, name)); }
    } else digest.update(await readFile(current));
  };
  await visit(path); return digest.digest("hex");
}

export async function readOwnership(project: string): Promise<OwnershipManifest> {
  try { return JSON.parse(await readFile(join(resolve(project), OWNERSHIP_PATH), "utf8")) as OwnershipManifest; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { schemaVersion: 1, files: {} }; throw error; }
}

export async function installOwnedDirectory(project: string, source: string, targetRelative: string, force = false): Promise<"installed" | "updated" | "current"> {
  const root = resolve(project); const target = join(root, targetRelative); const manifest = await readOwnership(root); const expected = await hashPath(source); const record = manifest.files[targetRelative];
  let action: "installed" | "updated" | "current" = "installed";
  try {
    const current = await hashPath(target);
    if (current === expected) action = "current";
    else {
      if (!force && (!record || record.sha256 !== current)) throw new Error(`${target} possui alterações locais; use --force após revisar o drift`);
      action = "updated"; await rm(target, { recursive: true, force: true }); await cp(source, target, { recursive: true });
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") { await mkdir(dirname(target), { recursive: true }); await cp(source, target, { recursive: true }); }
    else throw error;
  }
  const now = new Date().toISOString();
  manifest.files[targetRelative] = { source: relative(root, source).replaceAll("\\", "/"), sha256: expected, installedAt: record?.installedAt ?? now, ...(action === "updated" ? { updatedAt: now } : {}) };
  await mkdir(dirname(join(root, OWNERSHIP_PATH)), { recursive: true }); await writeFile(join(root, OWNERSHIP_PATH), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return action;
}

export async function ownedDrift(project: string): Promise<string[]> {
  const root = resolve(project); const manifest = await readOwnership(root); const drift: string[] = [];
  for (const [path, record] of Object.entries(manifest.files)) {
    try { if ((await hashPath(join(root, path))) !== record.sha256) drift.push(path); }
    catch { drift.push(path); }
  }
  return drift;
}
