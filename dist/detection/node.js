import { readFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
function cleanVersion(value) { return typeof value === "string" ? value.replace(/^[~^<>=\s]*/, "") || "unknown" : "unknown"; }
function add(result, technology, version, source, confidence = "high", details) {
    const item = { technology, version, source, path: source, confidence };
    if (details)
        item.details = details;
    result.push(item);
}
export async function detectNode(files, root) {
    const result = [];
    for (const path of files.filter((file) => basename(file) === "package.json")) {
        const source = relative(root, path).replaceAll("\\", "/");
        let pkg;
        try {
            pkg = JSON.parse(await readFile(path, "utf8"));
        }
        catch {
            continue;
        }
        const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
        const engines = pkg.engines ?? {};
        add(result, "node", cleanVersion(engines.node), source, engines.node ? "high" : "medium");
        const recognized = [["vue", "vue"], ["quasar", "@quasar/extras"], ["quasar", "quasar"], ["typescript", "typescript"], ["vite", "vite"], ["serverless-framework", "serverless"], ["vitest", "vitest"], ["jest", "jest"]];
        for (const [technology, dependency] of recognized)
            if (dependency in deps && !result.some((entry) => entry.technology === technology && entry.path === source))
                add(result, technology, cleanVersion(deps[dependency]), source);
        if (files.some((file) => dirname(file) === dirname(path) && /^quasar\.config\./.test(basename(file))) && !result.some((entry) => entry.technology === "quasar" && entry.path === source))
            add(result, "quasar", cleanVersion(deps.quasar), source, "medium");
        if (pkg.workspaces)
            add(result, "node-workspaces", "present", source);
    }
    for (const path of files.filter((file) => /^serverless\.(?:yml|yaml|ts|js)$/.test(basename(file)))) {
        const source = relative(root, path).replaceAll("\\", "/");
        const body = await readFile(path, "utf8");
        if (!result.some((entry) => entry.technology === "serverless-framework" && dirname(join(root, entry.path ?? "")) === dirname(path)))
            add(result, "serverless-framework", "unknown", source, "medium");
        const provider = /provider\s*:\s*(?:\r?\n\s+name\s*:\s*)?aws\b/i.test(body) || /name\s*:\s*['\"]aws['\"]/i.test(body);
        if (provider) {
            add(result, "aws", "present", source);
            add(result, "aws-lambda", "present", source, "high", { provider: "aws" });
        }
    }
    for (const path of files.filter((file) => [".nvmrc", ".node-version"].includes(basename(file)))) {
        const source = relative(root, path).replaceAll("\\", "/");
        add(result, "node", (await readFile(path, "utf8")).trim().replace(/^v/, ""), source);
    }
    return result;
}
//# sourceMappingURL=node.js.map