import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ownedDrift } from "../src/ownership/manifest.js";
import { installKitSpecialists } from "../src/specialists/installer.js";

const cleanup: string[] = [];
afterEach(async () => { for (const path of cleanup.splice(0)) await rm(path, { recursive: true, force: true }); });

describe("ownership", () => {
  it("protege specialist kit-owned alterado", async () => {
    const project = await mkdtemp(join(tmpdir(), "specsfy-kit-owner-")); cleanup.push(project); const resolution = { kit: [{ name: "specsfy-specialist-java", profiles: ["java-legacy"] }], official: [] };
    await installKitSpecialists(project, resolution); const skill = join(project, ".agents", "skills", "specsfy-specialist-java", "SKILL.md"); await writeFile(skill, `${await readFile(skill, "utf8")}\nmanual\n`);
    expect(await ownedDrift(project)).toContain(".agents/skills/specsfy-specialist-java"); await expect(installKitSpecialists(project, resolution)).rejects.toThrow("alterações locais"); await expect(installKitSpecialists(project, resolution, true)).resolves.toBeDefined();
  });
});
