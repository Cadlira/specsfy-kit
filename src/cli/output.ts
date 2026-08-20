import type { Evidence, RuntimeState } from "../core/types.js";

export function printJson(value: unknown): void { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }
export function stackLines(evidence: Evidence[]): string[] { return evidence.map((entry) => `  ${entry.technology.padEnd(24)} ${entry.version.padEnd(16)} ${entry.source}`); }
export function printRuntime(runtime: RuntimeState, operations: string[] = [], unavailable: string[] = []): void {
  console.log(`Branch: ${runtime.branch}`); console.log(`Worktree: ${runtime.worktree}`); console.log(`Active profiles: ${runtime.profiles.join(", ")}`);
  console.log(`Source: ${runtime.profileSource}${runtime.matchedRules.length ? ` ${runtime.matchedRules.join(", ")}` : ""}`); console.log("Detected stack:"); console.log(stackLines(runtime.stack.evidence).join("\n") || "  none");
  console.log(`Kit specialists: ${runtime.specialists.kit.map(({ name }) => name).join(", ") || "none"}`); console.log(`Official specialists: ${runtime.specialists.official.map(({ name }) => name).join(", ") || "none"}`);
  if (operations.length) console.log(`Operations: ${operations.join(", ")}`); if (unavailable.length) console.log(`Unavailable official specialists: ${unavailable.join(", ")}`);
}
