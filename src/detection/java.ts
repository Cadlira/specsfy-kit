import { readFile } from "node:fs/promises";
import { basename, relative } from "node:path";
import type { Evidence } from "../core/types.js";

function tag(xml: string, name: string): string | undefined {
  return xml.match(new RegExp(`<${name}>\\s*([^<]+?)\\s*</${name}>`, "i"))?.[1]?.trim();
}

function properties(xml: string): Map<string, string> {
  const map = new Map<string, string>();
  const block = xml.match(/<properties>([\s\S]*?)<\/properties>/i)?.[1] ?? "";
  for (const match of block.matchAll(/<([\w.-]+)>\s*([^<]+?)\s*<\/\1>/g)) map.set(match[1]!, match[2]!.trim());
  return map;
}

function resolveVersion(value: string | undefined, props: Map<string, string>): string {
  if (!value) return "unknown";
  const key = value.match(/^\$\{([^}]+)}$/)?.[1];
  return key ? props.get(key) ?? "unknown" : value;
}

function dependencyVersion(xml: string, artifact: string, props: Map<string, string>): string | undefined {
  const blocks = [...xml.matchAll(/<dependency>([\s\S]*?)<\/dependency>/gi)].map((match) => match[1]!);
  const block = blocks.find((candidate) => tag(candidate, "artifactId") === artifact);
  return block ? resolveVersion(tag(block, "version"), props) : undefined;
}

function push(result: Evidence[], technology: string, version: string, source: string, path: string, confidence: Evidence["confidence"] = "high"): void {
  result.push({ technology, version, source, path, confidence });
}

export async function detectJava(files: string[], root: string): Promise<Evidence[]> {
  const result: Evidence[] = [];
  const pomFiles = files.filter((file) => basename(file) === "pom.xml");
  for (const path of pomFiles) {
    const xml = await readFile(path, "utf8"); const props = properties(xml); const source = relative(root, path).replaceAll("\\", "/");
    const compiler = resolveVersion(tag(xml, "maven.compiler.release") ?? tag(xml, "maven.compiler.source") ?? tag(xml, "maven.compiler.target") ?? tag(xml, "java.version"), props);
    push(result, "java", compiler, source, source, compiler === "unknown" ? "medium" : "high");
    push(result, "maven", tag(xml, "modelVersion") ? "present" : "unknown", source, source);
    if (/<modules>/i.test(xml)) push(result, "maven-multi-module", "present", source, source);
    const parentArtifact = xml.match(/<parent>[\s\S]*?<artifactId>\s*([^<]+)<\/artifactId>[\s\S]*?<\/parent>/i)?.[1]?.trim();
    const parentVersion = xml.match(/<parent>[\s\S]*?<version>\s*([^<]+)<\/version>[\s\S]*?<\/parent>/i)?.[1]?.trim();
    const bootDependency = /<artifactId>\s*spring-boot(?:-starter-[^<]+|-dependencies)?\s*<\/artifactId>/i.test(xml);
    if (parentArtifact === "spring-boot-starter-parent" || bootDependency) {
      const value = parentArtifact === "spring-boot-starter-parent" ? parentVersion : tag(xml, "spring-boot.version");
      push(result, "spring-boot", resolveVersion(value, props), source, source, value ? "high" : "medium");
    }
    const spring = dependencyVersion(xml, "spring-core", props) ?? dependencyVersion(xml, "spring-context", props) ?? resolveVersion(tag(xml, "spring.version") ?? tag(xml, "spring-framework.version"), props);
    if (spring !== "unknown" || /org\.springframework|<artifactId>\s*spring-(?:core|context|mvc|webmvc)/i.test(xml)) push(result, "spring-framework", spring, source, source, spring === "unknown" ? "medium" : "high");
    const hibernate = dependencyVersion(xml, "hibernate-core", props) ?? resolveVersion(tag(xml, "hibernate.version"), props);
    if (hibernate !== "unknown" || /<artifactId>\s*hibernate-core\s*<\/artifactId>/i.test(xml)) push(result, "hibernate", hibernate, source, source, hibernate === "unknown" ? "medium" : "high");
    for (const [technology, artifact] of [["junit", "junit"], ["mockito", "mockito-core"], ["assertj", "assertj-core"]] as const) {
      const version = dependencyVersion(xml, artifact, props); if (version) push(result, technology, version, source, source);
    }
  }
  for (const path of files.filter((file) => /build\.gradle(?:\.kts)?$/.test(file))) {
    const body = await readFile(path, "utf8"); const source = relative(root, path).replaceAll("\\", "/");
    const java = body.match(/(?:sourceCompatibility|targetCompatibility)\s*(?:=\s*)?(?:JavaVersion\.VERSION_)?['\"]?([\d_.]+)/)?.[1]?.replaceAll("_", ".") ?? "unknown";
    push(result, "java", java, source, source, java === "unknown" ? "medium" : "high"); push(result, "gradle", "present", source, source);
    const boot = body.match(/org\.springframework\.boot['\"]?\s*version\s*['\"]([^'\"]+)/)?.[1]; if (boot) push(result, "spring-boot", boot, source, source);
    const spring = body.match(/org\.springframework:spring-(?:core|context|webmvc):([^'\"\s)]+)/)?.[1]; if (spring) push(result, "spring-framework", spring, source, source);
    const hibernate = body.match(/org\.hibernate(?:\.orm)?:hibernate-core:([^'\"\s)]+)/)?.[1]; if (hibernate) push(result, "hibernate", hibernate, source, source);
  }
  for (const path of files.filter((file) => /settings\.gradle(?:\.kts)?$/.test(file))) {
    const body = await readFile(path, "utf8"); const source = relative(root, path).replaceAll("\\", "/");
    if (/\binclude\s*(?:\(|\s)/.test(body)) push(result, "gradle-multi-module", "present", source, source);
  }
  return result;
}
