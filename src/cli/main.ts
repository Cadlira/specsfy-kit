import { createInterface } from "node:readline/promises";
import { resolve } from "node:path";
import { Command, Option } from "commander";
import { detectStack } from "../detection/detector.js";
import { doctorProject } from "../core/doctor.js";
import { initProject, projectStatus, syncProject, updateProject } from "../core/workflows.js";
import { VERSION } from "../core/version.js";
import { PROFILE_DEFINITIONS, PROFILES } from "../profiles/definitions.js";
import { resolveSpecialists, suggestProfiles, validateProfiles } from "../profiles/resolver.js";
import { detectTestPlan, executeTestPlan, type TestRunnerKind } from "../testing/runner.js";
import { SpecsfyAdapter } from "../specsfy/adapter.js";
import { printJson, printRuntime, stackLines } from "./output.js";

interface CommonOptions { project: string; json?: boolean; dryRun?: boolean; force?: boolean; profile?: string[] }
const collect = (value: string, previous: string[]): string[] => [...previous, value];
const projectOption = (): Option => new Option("--project <path>", "raiz do projeto").default(".");
const profileOption = (): Option => new Option("-p, --profile <name>", "profile explícito; repetível").argParser(collect).default([]);

async function selectProfiles(project: string): Promise<string[]> {
  const stack = await detectStack(project); const suggestions = suggestProfiles(stack);
  console.log("Detected stack:\n" + (stackLines(stack.evidence).join("\n") || "  none")); console.log("\nSuggested profiles:");
  for (const item of suggestions) console.log(`  ${item.profile}: ${item.reason}`);
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("ambiente não interativo requer ao menos um --profile explícito");
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try { const answer = await prompt.question("\nProfiles (separados por vírgula): "); return validateProfiles(answer.split(",").map((item) => item.trim()).filter(Boolean)); }
  finally { prompt.close(); }
}

async function confirm(): Promise<boolean> {
  if (!process.stdin.isTTY) return false; const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try { return !/^n/i.test((await prompt.question("Proceed? Y/n ")).trim()); } finally { prompt.close(); }
}

const program = new Command();
program.name("specsfy-kit").description("Profiles e specialists externos para o Specsfy oficial").version(VERSION);

program.command("detect").description("detecta a stack sem escrever arquivos").addOption(projectOption()).option("--json", "saída JSON estável").action(async (options: CommonOptions) => {
  const report = await detectStack(resolve(options.project)); if (options.json) printJson(report); else { console.log(`Project: ${report.project}`); console.log(stackLines(report.evidence).join("\n") || "No supported stack detected."); for (const warning of report.warnings) console.log(`Warning: ${warning}`); }
});

program.command("init").description("seleciona profiles antes de orquestrar o setup oficial").addOption(projectOption()).addOption(profileOption()).option("--dry-run", "planeja sem escrever nem executar Specsfy").option("--json", "saída JSON estável").option("--yes", "não solicita confirmação").option("--force", "substitui somente artefatos gerenciados após validação").action(async (options: CommonOptions & { yes?: boolean }) => {
  const project = resolve(options.project); const profiles = options.profile?.length ? validateProfiles(options.profile, options.force) : await selectProfiles(project); const stack = await detectStack(project); const specialists = resolveSpecialists(profiles, stack);
  if (!options.json) { console.log(`Selected profiles: ${profiles.join(", ")}`); console.log(`Resolved kit specialists: ${specialists.kit.map(({ name }) => name).join(", ")}`); console.log("Operations: config → specsfy doctor → specsfy setup → specialists → lock"); }
  if (!options.yes && !options.dryRun && !(await confirm())) throw new Error("operação cancelada; use --yes em automação");
  const result = await initProject(project, { defaultProfiles: profiles, dryRun: options.dryRun, force: options.force }); if (options.json) printJson(result); else printRuntime(result.runtime, result.operations, result.unavailableOfficial);
});

program.command("sync").description("resolve branch/worktree e reconcilia assets sem novo init").addOption(projectOption()).addOption(profileOption()).option("--dry-run", "planeja sem escrever").option("--json", "saída JSON estável").option("--force", "aceita conflitos e substitui assets kit-owned alterados").action(async (options: CommonOptions) => {
  const result = await syncProject(resolve(options.project), { profiles: options.profile, dryRun: options.dryRun, force: options.force }); if (options.json) printJson(result); else printRuntime(result.runtime, result.operations, result.unavailableOfficial);
});

program.command("status").description("mostra profiles ativos, stack, specialists e drift").addOption(projectOption()).option("--json", "saída JSON estável").action(async (options: CommonOptions) => {
  const status = await projectStatus(resolve(options.project)); if (options.json) printJson(status); else {
    console.log(`specsfy-kit: ${String(status.kitVersion)} | Specsfy: ${String(status.specsfyVersion)}`); console.log(`Branch: ${String(status.branch)}`); console.log(`Worktree: ${String(status.worktree)}`); console.log(`Active profiles: ${(status.profiles as string[]).join(", ")}`); console.log(`Source: ${String(status.profileSource)} ${((status.matchedRules as string[]) ?? []).join(", ")}`.trim()); console.log(`Missing specialists: ${(status.missingSpecialists as string[]).join(", ") || "none"}`); console.log(`Drift: ${JSON.stringify(status.drift)}`);
  }
});

program.command("doctor").description("verifica pré-requisitos sem instalar nada").addOption(projectOption()).option("--json", "saída JSON estável").action(async (options: CommonOptions) => {
  const checks = await doctorProject(resolve(options.project)); if (options.json) printJson({ checks, ok: checks.every(({ ok }) => ok) }); else for (const check of checks) console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}: ${check.detail}`); if (checks.some(({ ok }) => !ok)) process.exitCode = 1;
});

program.command("progress").description("exibe o progresso oficial das specs").addOption(projectOption()).option("--json", "saída JSON oficial estável").action(async (options: CommonOptions) => {
  const result = await new SpecsfyAdapter().progress(resolve(options.project), options.json ?? false);
  if (result.stdout) process.stdout.write(result.stdout.endsWith("\n") ? result.stdout : `${result.stdout}\n`);
  if (result.stderr) process.stderr.write(result.stderr.endsWith("\n") ? result.stderr : `${result.stderr}\n`);
});

program.command("test")
  .description("detecta e executa os testes nativos da stack")
  .addOption(projectOption())
  .option("--verify", "executa Maven verify ou Gradle check")
  .option("--runner <kind>", "limita a maven, gradle, npm, pnpm, yarn ou bun", collect, [])
  .option("--dry-run", "mostra o plano sem executar testes")
  .option("--json", "saída JSON estável; captura a saída dos runners")
  .argument("[runnerArgs...]", "argumentos repassados após -- ao runner")
  .action(async (runnerArgs: string[], options: CommonOptions & { verify?: boolean; runner?: string[] }) => {
    const allowed = new Set<TestRunnerKind>(["maven", "gradle", "npm", "pnpm", "yarn", "bun"]);
    const kinds = options.runner?.map((kind) => {
      if (!allowed.has(kind as TestRunnerKind)) throw new Error(`runner desconhecido: ${kind}`);
      return kind as TestRunnerKind;
    });
    const plan = await detectTestPlan(resolve(options.project), { verify: options.verify ?? false, runnerArgs, kinds: kinds ?? [] });
    if (!plan.runners.length) throw new Error(plan.warnings.at(-1) ?? "nenhum runner de teste suportado foi detectado");
    if (!options.json) {
      console.log(`Test plan: ${plan.runners.length} runner(s), mode ${plan.mode}`);
      for (const runner of plan.runners) console.log(`  ${runner.label} [${runner.source}]\n    ${runner.display}`);
    }
    const result = await executeTestPlan(plan, { dryRun: options.dryRun ?? false, captureOnly: options.json ?? false });
    if (options.json) printJson(result);
    else if (!options.dryRun) {
      for (const item of result.results) console.log(`${item.exitCode === 0 ? "PASS" : "FAIL"} ${item.runner.id} (${Math.round(item.durationMs)} ms)`);
    }
    if (!result.ok) process.exitCode = 1;
  });

program.command("update").description("atualiza assets oficiais e extensões do kit").addOption(projectOption()).addOption(profileOption()).option("--dry-run", "planeja sem escrever").option("--json", "saída JSON estável").option("--force", "substitui assets gerenciados alterados").option("--upgrade-specsfy", "atualiza explicitamente o CLI global oficial").action(async (options: CommonOptions & { upgradeSpecsfy?: boolean }) => {
  const result = await updateProject(resolve(options.project), { profiles: options.profile, dryRun: options.dryRun, force: options.force, upgradeSpecsfy: options.upgradeSpecsfy }); if (options.json) printJson(result); else printRuntime(result.runtime, result.operations, result.unavailableOfficial);
});

const profiles = program.command("profiles").description("consulta profiles orientados a intenção");
profiles.command("list").description("lista profiles disponíveis").option("--json", "saída JSON estável").action((options: { json?: boolean }) => { if (options.json) printJson(PROFILE_DEFINITIONS); else for (const profile of PROFILE_DEFINITIONS) console.log(`${profile.name.padEnd(24)} ${profile.description}`); });
profiles.command("show").description("detalha um profile").argument("<profile>").option("--json", "saída JSON estável").action((name: string, options: { json?: boolean }) => { const profile = PROFILES.get(name); if (!profile) throw new Error(`profile desconhecido: ${name}`); if (options.json) printJson(profile); else { console.log(`${profile.name}: ${profile.description}`); console.log(`Intent: ${profile.intent}`); console.log(`Conflicts: ${profile.conflicts.join(", ") || "none"}`); console.log(`Specialists: ${profile.specialists.join(", ")}`); } });

try {
  await program.parseAsync(process.argv);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error); process.stderr.write(`specsfy-kit: ${message}\n`); process.exitCode = 1;
}
