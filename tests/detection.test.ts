import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { detectStack } from "../src/detection/detector.js";

const fixture = (name: string): string => resolve("fixtures", name);
const technologies = async (name: string): Promise<Map<string, string>> => new Map((await detectStack(fixture(name))).evidence.map((item) => [item.technology, item.version]));

describe("detecção de stack", () => {
  it("detecta Java 8 legado, Spring 4 e Hibernate 4", async () => { const found = await technologies("java8-legacy"); expect(found.get("java")).toBe("1.8"); expect(found.get("spring-framework")).toBe("4.2.9.RELEASE"); expect(found.get("hibernate")).toBe("4.3.11.Final"); });
  it("não confunde Java 21 + Spring 4 com Boot", async () => { const found = await technologies("java21-spring4-hibernate4"); expect(found.get("java")).toBe("21"); expect(found.get("spring-framework")).toBe("4.3.30.RELEASE"); expect(found.has("spring-boot")).toBe(false); });
  it("detecta Spring Boot somente por evidência", async () => expect((await technologies("spring-boot-service")).get("spring-boot")).toBe("3.4.2"));
  it("detecta Vue, Quasar, TypeScript e Vite", async () => { const found = await technologies("vue-quasar"); for (const name of ["vue", "quasar", "typescript", "vite"]) expect(found.has(name)).toBe(true); });
  it("detecta Serverless, AWS e Lambda", async () => { const found = await technologies("serverless-node"); for (const name of ["serverless-framework", "aws", "aws-lambda", "node"]) expect(found.has(name)).toBe(true); });
  it("detecta monorepo Java e Vue", async () => { const report = await detectStack(fixture("java-vue-monorepo")); expect(report.evidence.some((item) => item.technology === "maven-multi-module")).toBe(true); expect(report.evidence.some((item) => item.technology === "vue")).toBe(true); });
  it("detecta Gradle multi-module, Boot e Hibernate", async () => { const found = await technologies("gradle-java"); expect(found.get("gradle")).toBe("present"); expect(found.get("gradle-multi-module")).toBe("present"); expect(found.get("spring-boot")).toBe("3.4.2"); expect(found.get("hibernate")).toBe("6.6.5.Final"); });
});
