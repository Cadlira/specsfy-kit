import { access, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { SpecialistResolution } from "../core/types.js";
import { installOwnedDirectory } from "../ownership/manifest.js";
import type { SpecsfyAdapter } from "../specsfy/adapter.js";

const ASSET_ROOT = resolve(fileURLToPath(new URL("../../specialists", import.meta.url)));
const START = "<!-- specsfy-kit:context:start -->"; const END = "<!-- specsfy-kit:context:end -->";

export async function installKitSpecialists(project: string, resolution: SpecialistResolution, force = false): Promise<string[]> {
  const changed: string[] = [];
  for (const { name } of resolution.kit) {
    const source = join(ASSET_ROOT, name); await access(join(source, "SKILL.md"));
    const target = `.agents/skills/${name}`; const action = await installOwnedDirectory(project, source, target, force); if (action !== "current") changed.push(target);
  }
  await ensureAgentContext(project, force); return changed;
}

export async function installOfficialSpecialists(project: string, resolution: SpecialistResolution, adapter: SpecsfyAdapter, force = false): Promise<{ installed: string[]; unavailable: string[] }> {
  const desired = resolution.official.map(({ name }) => name); let available: Set<string>;
  try { available = await adapter.officialCatalogNames(project); } catch { return { installed: [], unavailable: desired }; }
  const installed = desired.filter((name) => available.has(name)); const unavailable = desired.filter((name) => !available.has(name));
  await adapter.addOfficial(project, installed, force); return { installed, unavailable };
}

async function ensureAgentContext(project: string, force: boolean): Promise<void> {
  const path = join(project, "AGENTS.md"); const block = `${START}\n## Contexto ativo do specsfy-kit\n\nAntes de aplicar specialists em trabalho governado pelo Specsfy, execute \`specsfy-kit status --json\` na raiz do worktree. O resultado runtime define os profiles ativos; não infira intenção somente pela stack.\n${END}`;
  let current = ""; try { current = await readFile(path, "utf8"); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const pattern = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  if (pattern.test(current)) {
    if (current.match(pattern)?.[0] === block) return;
    if (!force) throw new Error(`${basename(path)} contém bloco specsfy-kit alterado; use --force após revisar`);
    current = current.replace(pattern, block);
  } else current = `${current.trimEnd()}${current ? "\n\n" : ""}${block}\n`;
  await writeFile(path, current, "utf8");
}
