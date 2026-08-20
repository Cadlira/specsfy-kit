export function printJson(value) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }
export function stackLines(evidence) { return evidence.map((entry) => `  ${entry.technology.padEnd(24)} ${entry.version.padEnd(16)} ${entry.source}`); }
export function printRuntime(runtime, operations = [], unavailable = []) {
    console.log(`Branch: ${runtime.branch}`);
    console.log(`Worktree: ${runtime.worktree}`);
    console.log(`Active profiles: ${runtime.profiles.join(", ")}`);
    console.log(`Source: ${runtime.profileSource}${runtime.matchedRules.length ? ` ${runtime.matchedRules.join(", ")}` : ""}`);
    console.log("Detected stack:");
    console.log(stackLines(runtime.stack.evidence).join("\n") || "  none");
    console.log(`Kit specialists: ${runtime.specialists.kit.map(({ name }) => name).join(", ") || "none"}`);
    console.log(`Official specialists: ${runtime.specialists.official.map(({ name }) => name).join(", ") || "none"}`);
    if (operations.length)
        console.log(`Operations: ${operations.join(", ")}`);
    if (unavailable.length)
        console.log(`Unavailable official specialists: ${unavailable.join(", ")}`);
}
//# sourceMappingURL=output.js.map