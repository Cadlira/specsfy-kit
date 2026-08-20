export interface RunResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
export type CommandRunner = (command: string, args: string[], options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
}) => Promise<RunResult>;
export declare class SpecsfyAdapter {
    readonly command: string;
    readonly runner: CommandRunner;
    constructor(options?: {
        command?: string;
        runner?: CommandRunner;
    });
    buildArgs(operation: "version" | "doctor" | "setup" | "update" | "upgrade" | "skills-list" | "skills-detect" | "skills-add", project: string, names?: string[], force?: boolean): string[];
    run(operation: Parameters<SpecsfyAdapter["buildArgs"]>[0], project: string, options?: {
        names?: string[];
        force?: boolean;
        env?: NodeJS.ProcessEnv;
    }): Promise<RunResult>;
    version(project: string): Promise<string>;
    doctor(project: string): Promise<RunResult>;
    setup(project: string, force?: boolean): Promise<RunResult>;
    update(project: string, force?: boolean): Promise<RunResult>;
    upgrade(project: string): Promise<RunResult>;
    detectOfficial(project: string): Promise<RunResult>;
    officialCatalogNames(project: string): Promise<Set<string>>;
    addOfficial(project: string, names: string[], force?: boolean): Promise<RunResult | undefined>;
}
