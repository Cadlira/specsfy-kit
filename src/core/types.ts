export type Confidence = "high" | "medium" | "low";

export interface Evidence {
  technology: string;
  version: string;
  confidence: Confidence;
  source: string;
  path?: string;
  details?: Record<string, string | boolean | number>;
}

export interface StackReport {
  project: string;
  detectedAt: string;
  evidence: Evidence[];
  scannedFiles: number;
  warnings: string[];
}

export interface BranchRule {
  pattern: string;
  replace?: string[];
  add?: string[];
}

export interface KitConfig {
  schemaVersion: 1;
  defaultProfiles: string[];
  branchProfiles: BranchRule[];
  overrides: { addSpecialists: string[]; removeSpecialists: string[] };
}

export interface ProfileDefinition {
  name: string;
  description: string;
  intent: string;
  dependencies: string[];
  conflicts: string[];
  specialists: string[];
  conditionalSpecialists: Array<{ specialist: string; technology: string }>;
  officialSpecialists: string[];
}

export interface ProfileResolution {
  profiles: string[];
  source: "cli override" | "branch rule" | "defaultProfiles";
  matchedRules: string[];
}

export interface SpecialistResolution {
  kit: Array<{ name: string; profiles: string[] }>;
  official: Array<{ name: string; profiles: string[] }>;
}

export interface GitContext {
  branch: string;
  worktree: string;
  repositoryRoot: string;
  commonGitDir: string;
  runtimePath: string;
}

export interface RuntimeState {
  schemaVersion: 1;
  branch: string;
  worktree: string;
  profiles: string[];
  profileSource: string;
  matchedRules: string[];
  stack: StackReport;
  specialists: SpecialistResolution;
  syncedAt: string;
}

export interface KitLock {
  schemaVersion: 1;
  kitVersion: string;
  specsfyVersion: string;
  baselineProfiles: string[];
  stack: StackReport;
  specialists: SpecialistResolution;
  generatedAt: string;
}
