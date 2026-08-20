import { minimatch } from "minimatch";
import type { KitConfig, ProfileResolution, SpecialistResolution, StackReport } from "../core/types.js";
import { PROFILES } from "./definitions.js";

function unique(values: string[]): string[] { return [...new Set(values)]; }

export function validateProfiles(names: string[], allowConflicts = false): string[] {
  const result: string[] = [];
  const active = new Set<string>();
  const visit = (name: string): void => {
    if (active.has(name)) throw new Error(`dependência circular de profile: ${name}`);
    if (result.includes(name)) return;
    const profile = PROFILES.get(name);
    if (!profile) throw new Error(`profile desconhecido: ${name}`);
    active.add(name);
    for (const dependency of profile.dependencies) visit(dependency);
    active.delete(name);
    result.push(name);
  };
  for (const name of unique(names)) visit(name);
  if (!allowConflicts) {
    for (const name of result) {
      const profile = PROFILES.get(name)!;
      const conflicts = profile.conflicts.filter((conflict) => result.includes(conflict));
      if (conflicts.length) throw new Error(`profiles conflitantes: ${name} e ${conflicts.join(", ")}; use --force somente após revisar a intenção`);
    }
  }
  return result;
}

export function resolveProfiles(config: KitConfig, branch: string, cliProfiles: string[] = [], allowConflicts = false): ProfileResolution {
  if (cliProfiles.length) return { profiles: validateProfiles(cliProfiles, allowConflicts), source: "cli override", matchedRules: [] };
  let profiles = [...config.defaultProfiles];
  const matchedRules: string[] = [];
  for (const rule of config.branchProfiles) {
    if (!minimatch(branch, rule.pattern, { dot: true })) continue;
    matchedRules.push(rule.pattern);
    if (rule.replace) profiles = [...rule.replace];
    if (rule.add) profiles = unique([...profiles, ...rule.add]);
  }
  return {
    profiles: validateProfiles(profiles, allowConflicts),
    source: matchedRules.length ? "branch rule" : "defaultProfiles",
    matchedRules,
  };
}

export function configuredProfiles(config: KitConfig): string[] {
  const names = [...config.defaultProfiles];
  for (const rule of config.branchProfiles) names.push(...(rule.add ?? []), ...(rule.replace ?? []));
  return validateProfiles(unique(names), true);
}

export function resolveSpecialists(profileNames: string[], stack: StackReport, config?: KitConfig): SpecialistResolution {
  const found = new Set(stack.evidence.map((entry) => entry.technology));
  const kit = new Map<string, Set<string>>();
  const official = new Map<string, Set<string>>();
  const add = (target: Map<string, Set<string>>, name: string, profile: string): void => {
    const profiles = target.get(name) ?? new Set<string>(); profiles.add(profile); target.set(name, profiles);
  };
  for (const profileName of validateProfiles(profileNames, true)) {
    const profile = PROFILES.get(profileName)!;
    for (const name of profile.specialists) add(kit, `specsfy-specialist-${name}`, profileName);
    for (const conditional of profile.conditionalSpecialists) if (found.has(conditional.technology)) add(kit, `specsfy-specialist-${conditional.specialist}`, profileName);
    for (const name of profile.officialSpecialists) {
      if (name === "specsfy-specialist-typescript" && !found.has("typescript")) continue;
      add(official, name, profileName);
    }
  }
  for (const name of config?.overrides.addSpecialists ?? []) add(kit, name.startsWith("specsfy-") ? name : `specsfy-specialist-${name}`, "override");
  for (const name of config?.overrides.removeSpecialists ?? []) {
    const full = name.startsWith("specsfy-") ? name : `specsfy-specialist-${name}`; kit.delete(full); official.delete(full);
  }
  const values = (map: Map<string, Set<string>>): Array<{ name: string; profiles: string[] }> => [...map].sort(([a], [b]) => a.localeCompare(b)).map(([name, profiles]) => ({ name, profiles: [...profiles].sort() }));
  return { kit: values(kit), official: values(official) };
}

export function suggestProfiles(stack: StackReport): Array<{ profile: string; reason: string }> {
  const has = (technology: string): boolean => stack.evidence.some((entry) => entry.technology === technology);
  const version = (technology: string): string | undefined => stack.evidence.find((entry) => entry.technology === technology)?.version;
  const suggestions: Array<{ profile: string; reason: string }> = [];
  if (has("spring-boot")) suggestions.push({ profile: "spring-boot-service", reason: "Spring Boot foi detectado explicitamente." });
  else if (has("java")) {
    const modernJava = Number.parseInt(version("java") ?? "0", 10) >= 17;
    const legacyFramework = /^[1-5](\.|$)/.test(version("spring-framework") ?? "") || /^[1-5](\.|$)/.test(version("hibernate") ?? "");
    if (modernJava && legacyFramework) suggestions.push({ profile: "java-modernization", reason: "Java moderno com Spring/Hibernate legado; confirme a intenção de modernização." });
    suggestions.push({ profile: "java-legacy", reason: "Java sem Spring Boot exige escolha explícita entre manutenção e modernização." });
  }
  if (has("vue") || has("quasar")) suggestions.push({ profile: "vue-quasar", reason: "Vue ou Quasar foi detectado." });
  if (has("serverless-framework")) suggestions.push({ profile: "serverless-node", reason: "Serverless Framework foi detectado." });
  return suggestions;
}
