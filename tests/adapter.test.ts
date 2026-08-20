import { describe, expect, it } from "vitest";
import { SpecsfyAdapter, type CommandRunner } from "../src/specsfy/adapter.js";

describe("SpecsfyAdapter", () => {
  it("centraliza comandos públicos sem shell", async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const runner: CommandRunner = async (command, args) => { calls.push({ command, args }); return { stdout: "[]", stderr: "", exitCode: 0 }; };
    const adapter = new SpecsfyAdapter({ command: "fake-specsfy", runner });
    await adapter.doctor("C:/project path"); await adapter.setup("C:/project path", true); await adapter.update("C:/project path"); await adapter.progress("C:/project path"); await adapter.progress("C:/project path", true); await adapter.detectOfficial("C:/project path"); await adapter.addOfficial("C:/project path", ["specsfy-specialist-ui-design"]);
    expect(calls.map(({ args }) => args[0])).toEqual(["doctor", "setup", "update", "progress", "progress", "skills", "skills"]);
    expect(calls[1]!.args).toContain("--force"); expect(calls[3]!.args).not.toContain("--json"); expect(calls[4]!.args).toContain("--json"); expect(calls[6]!.args).toContain("specsfy-specialist-ui-design");
  });
  it("interpreta catálogo JSON", async () => {
    const runner: CommandRunner = async () => ({ stdout: JSON.stringify({ skills: [{ name: "specsfy-specialist-ui-design" }] }), stderr: "", exitCode: 0 });
    expect(await new SpecsfyAdapter({ runner }).officialCatalogNames(".")).toEqual(new Set(["specsfy-specialist-ui-design"]));
  });
});
