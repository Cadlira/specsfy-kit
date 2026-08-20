import { resolve } from "node:path";
import type { Evidence, StackReport } from "../core/types.js";
import { scanProject } from "./files.js";
import { detectJava } from "./java.js";
import { detectNode } from "./node.js";

function bestEvidence(entries: Evidence[]): Evidence[] {
  const rank = { high: 3, medium: 2, low: 1 } as const; const map = new Map<string, Evidence>();
  for (const entry of entries) {
    const key = `${entry.technology}\0${entry.path ?? entry.source}`; const current = map.get(key);
    if (!current || rank[entry.confidence] > rank[current.confidence] || (current.version === "unknown" && entry.version !== "unknown")) map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => a.technology.localeCompare(b.technology) || a.source.localeCompare(b.source));
}

export async function detectStack(project: string): Promise<StackReport> {
  const root = resolve(project); const scan = await scanProject(root);
  const evidence = bestEvidence([...(await detectJava(scan.files, root)), ...(await detectNode(scan.files, root))]);
  const warnings: string[] = []; if (scan.truncated) warnings.push("scan limitado a 5000 entradas"); if (!evidence.length) warnings.push("nenhuma stack suportada detectada");
  return { project: root, detectedAt: new Date().toISOString(), evidence, scannedFiles: scan.count, warnings };
}
