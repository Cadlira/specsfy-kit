import { access, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("distribuição Git/npm", () => {
  it("possui bin compilado e assets declarados", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf8")) as { bin: Record<string, string>; scripts: Record<string, string>; files: string[]; engines: { node: string } };
    expect(pkg.bin["specsfy-kit"]).toBe("dist/cli/main.js"); for (const lifecycle of ["preinstall", "install", "postinstall", "prepare", "prepack"]) expect(pkg.scripts[lifecycle]).toBeUndefined(); expect(pkg.files).toContain("specialists"); expect(pkg.engines.node).toBe(">=22.20.0");
    await expect(access(pkg.bin["specsfy-kit"]!)).resolves.toBeUndefined(); expect(await readFile(pkg.bin["specsfy-kit"]!, "utf8")).toMatch(/^#!\/usr\/bin\/env node/);
  });
});
