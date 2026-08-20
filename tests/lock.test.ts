import { describe, expect, it } from "vitest";
import { lockDrift } from "../src/config/lock.js";
import type { KitLock } from "../src/core/types.js";

const lock: KitLock = { schemaVersion: 1, kitVersion: "0.1.0", specsfyVersion: "0.8.1", baselineProfiles: ["java-legacy"], generatedAt: "now", specialists: { kit: [], official: [] }, stack: { project: ".", detectedAt: "now", evidence: [], scannedFiles: 0, warnings: [] } };
describe("lock", () => {
  it("é estável para timestamps", () => expect(lockDrift({ ...lock, generatedAt: "later" }, lock)).toEqual([]));
  it("detecta profile drift", () => expect(lockDrift({ ...lock, baselineProfiles: ["java-modernization"] }, lock)).toContain("profiles"));
  it("detecta lock ausente", () => expect(lockDrift(lock, undefined)).toEqual(["lock ausente"]));
});
