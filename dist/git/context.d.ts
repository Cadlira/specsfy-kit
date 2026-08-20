import type { GitContext, RuntimeState } from "../core/types.js";
export declare function getGitContext(project: string): Promise<GitContext>;
export declare function getGitContextOrStandalone(project: string): Promise<GitContext>;
export declare function writeRuntime(context: GitContext, state: RuntimeState): Promise<void>;
export declare function readRuntime(context: GitContext): Promise<RuntimeState | undefined>;
