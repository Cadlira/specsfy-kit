import { describe, expect, it } from "vitest";
import { portableInvocation } from "../src/core/subprocess.js";

describe("subprocessos cross-platform", () => {
  it("encaminha shim cmd no Windows sem concatenar argumentos", () => {
    const result = portableInvocation("C:/Program Files/specsfy.cmd", ["doctor", "--project", "C:/project & safe"], "win32"); expect(result.command.toLowerCase()).toMatch(/cmd\.exe$/); expect(result.args.join(" ")).not.toContain("C:/project & safe"); expect(result.args.join(" ")).not.toContain("Program Files"); expect(result.env?.SPECSFY_KIT_TARGET).toBe('"C:/Program Files/specsfy.cmd"'); expect(result.env?.SPECSFY_KIT_ARG_2).toBe('"C:/project & safe"');
  });
  it("mantém executável nativo e argumentos separados", () => expect(portableInvocation("specsfy", ["--version"], "linux")).toEqual({ command: "specsfy", args: ["--version"] }));
  it("usa call para shims npm resolvidos pelo PATH", () => { const result = portableInvocation("npm.cmd", ["--version"], "win32"); expect(result.args.at(-1)).toContain("call %SPECSFY_KIT_TARGET%"); expect(result.env?.SPECSFY_KIT_TARGET).toBe("npm.cmd"); });
});
