import { resolve } from "node:path";
import { scanProject } from "./files.js";
import { detectJava } from "./java.js";
import { detectNode } from "./node.js";
function bestEvidence(entries) {
    const rank = { high: 3, medium: 2, low: 1 };
    const map = new Map();
    for (const entry of entries) {
        const key = `${entry.technology}\0${entry.path ?? entry.source}`;
        const current = map.get(key);
        if (!current || rank[entry.confidence] > rank[current.confidence] || (current.version === "unknown" && entry.version !== "unknown"))
            map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => a.technology.localeCompare(b.technology) || a.source.localeCompare(b.source));
}
export async function detectStack(project) {
    const root = resolve(project);
    const scan = await scanProject(root);
    const evidence = bestEvidence([...(await detectJava(scan.files, root)), ...(await detectNode(scan.files, root))]);
    const warnings = [];
    if (scan.truncated)
        warnings.push("scan limitado a 5000 entradas");
    if (!evidence.length)
        warnings.push("nenhuma stack suportada detectada");
    return { project: root, detectedAt: new Date().toISOString(), evidence, scannedFiles: scan.count, warnings };
}
//# sourceMappingURL=detector.js.map