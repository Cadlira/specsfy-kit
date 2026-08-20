import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROFILE_DEFINITIONS } from "../src/profiles/definitions.js";

describe("specialists distribuídos", () => {
  it("publica os 11 Agent Skills válidos", async () => {
    const directories = (await readdir("specialists", { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort(); expect(directories).toHaveLength(11);
    for (const name of directories) { const skill = await readFile(join("specialists", name, "SKILL.md"), "utf8"); expect(skill.startsWith("---\n")).toBe(true); expect(skill).toContain(`name: ${name}`); expect(skill).toMatch(/description: .+/); expect(await readFile(join("specialists", name, "agents", "openai.yaml"), "utf8")).toContain("default_prompt:"); }
  });
  it("todo specialist kit declarado por profile possui diretório", async () => {
    const directories = new Set(await readdir("specialists")); for (const profile of PROFILE_DEFINITIONS) for (const name of [...profile.specialists, ...profile.conditionalSpecialists.map(({ specialist }) => specialist)]) expect(directories.has(`specsfy-specialist-${name}`)).toBe(true);
  });
});
