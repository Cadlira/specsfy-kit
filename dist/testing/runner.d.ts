export type TestRunnerKind = "maven" | "gradle" | "npm" | "pnpm" | "yarn" | "bun";
export interface TestRunner {
    id: string;
    kind: TestRunnerKind;
    label: string;
    cwd: string;
    command: string;
    args: string[];
    display: string;
    source: string;
}
export interface TestPlan {
    project: string;
    mode: "test" | "verify";
    runners: TestRunner[];
    warnings: string[];
}
export interface TestRunnerResult {
    runner: TestRunner;
    exitCode: number;
    durationMs: number;
    stdout: string;
    stderr: string;
}
export interface TestExecution {
    plan: TestPlan;
    results: TestRunnerResult[];
    ok: boolean;
    dryRun: boolean;
}
export interface DetectTestOptions {
    verify?: boolean;
    runnerArgs?: string[];
    kinds?: TestRunnerKind[];
    platform?: NodeJS.Platform;
}
export interface ExecuteTestOptions {
    dryRun?: boolean;
    captureOnly?: boolean;
    emitStdout?: (chunk: string) => void;
    emitStderr?: (chunk: string) => void;
    executor?: TestCommandExecutor;
}
export type TestCommandExecutor = (runner: TestRunner, emitStdout: (chunk: string) => void, emitStderr: (chunk: string) => void) => Promise<{
    exitCode: number;
    durationMs: number;
    stdout: string;
    stderr: string;
}>;
export declare function detectTestPlan(project: string, options?: DetectTestOptions): Promise<TestPlan>;
export declare function executeTestPlan(plan: TestPlan, options?: ExecuteTestOptions): Promise<TestExecution>;
