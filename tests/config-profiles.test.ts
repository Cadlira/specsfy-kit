import { describe, expect, it } from "vitest";
import YAML from "yaml";
import { parseConfig } from "../src/config/schema.js";
import { resolveProfiles, resolveSpecialists, validateProfiles } from "../src/profiles/resolver.js";
import type { StackReport } from "../src/core/types.js";

const config = parseConfig(YAML.parse(`schemaVersion: 1\ndefaultProfiles: [java-legacy]\nbranchProfiles:\n  - pattern: modernizacao/**\n    replace: [java-modernization]\n  - pattern: frontend/**\n    add: [vue-quasar]\noverrides:\n  addSpecialists: []\n  removeSpecialists: []\n`));
const stack: StackReport = { project: ".", detectedAt: "now", scannedFiles: 1, warnings: [], evidence: [{ technology: "maven", version: "present", confidence: "high", source: "pom.xml" }, { technology: "typescript", version: "5", confidence: "high", source: "package.json" }] };

describe("config e profiles", () => {
  it("valida schema", () => expect(config.defaultProfiles).toEqual(["java-legacy"]));
  it("rejeita schema desconhecido", () => expect(() => parseConfig({ schemaVersion: 2 })).toThrow("schemaVersion"));
  it("usa defaults em main", () => expect(resolveProfiles(config, "main")).toMatchObject({ profiles: ["java-legacy"], source: "defaultProfiles" }));
  it("replace substitui defaults", () => expect(resolveProfiles(config, "modernizacao/java21")).toMatchObject({ profiles: ["java-modernization"], source: "branch rule", matchedRules: ["modernizacao/**"] }));
  it("add compõe profiles", () => expect(resolveProfiles(config, "frontend/painel").profiles).toEqual(["java-legacy", "vue-quasar"]));
  it("CLI vence regra de branch", () => expect(resolveProfiles(config, "modernizacao/java21", ["java-legacy"]).source).toBe("cli override"));
  it("rejeita conflitos", () => expect(() => validateProfiles(["java-legacy", "java-modernization"])).toThrow("conflitantes"));
  it("permite conflito somente com override explícito", () => expect(validateProfiles(["java-legacy", "java-modernization"], true)).toHaveLength(2));
  it("deduplica specialists e preserva origem", () => {
    const resolved = resolveSpecialists(["java-modernization", "vue-quasar"], stack, config);
    expect(new Set(resolved.kit.map(({ name }) => name)).size).toBe(resolved.kit.length);
    expect(resolved.official.map(({ name }) => name)).toContain("specsfy-specialist-typescript");
  });
});
