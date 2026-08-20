import { opendir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const IGNORED = new Set([".git", "node_modules", "target", "build", "dist", "coverage", "out", ".idea", ".gradle"]);
const INTERESTING = /^(pom\.xml|package\.json|build\.gradle(?:\.kts)?|settings\.gradle(?:\.kts)?|mvnw(?:\.cmd)?|gradlew(?:\.bat)?|serverless\.(?:yml|yaml|ts|js)|\.nvmrc|\.node-version|quasar\.config\.[^.]+|vue\.config\.[^.]+|vite\.config\.[^.]+|tsconfig\.json)$/;

export interface ScanResult { files: string[]; count: number; truncated: boolean }

export async function scanProject(project: string, maxDepth = 5, maxEntries = 5000): Promise<ScanResult> {
  const root = resolve(project); const files: string[] = []; let count = 0; let truncated = false;
  const visit = async (directory: string, depth: number): Promise<void> => {
    if (depth > maxDepth || truncated) return;
    let handle;
    try { handle = await opendir(directory); } catch { return; }
    for await (const entry of handle) {
      count += 1;
      if (count > maxEntries) { truncated = true; break; }
      if (entry.isDirectory()) {
        if (!IGNORED.has(entry.name)) await visit(join(directory, entry.name), depth + 1);
      } else if (entry.isFile() && INTERESTING.test(entry.name)) files.push(join(directory, entry.name));
    }
  };
  await visit(root, 0);
  files.sort((a, b) => relative(root, a).localeCompare(relative(root, b)));
  return { files, count, truncated };
}
