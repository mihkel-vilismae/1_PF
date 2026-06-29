// Resolves terminal Demo Mode runtime configuration and path boundaries.
// Keep this file focused so future slices can stay below the 300 LOC target.

import path from 'node:path';
import type { DemoRuntimePaths } from './runtimeTypes.js';
import { readEnvPath, resolveAgainstRepoRoot } from './pathUtils.js';

export const DEFAULT_DEMO_DB_PATH = 'runtime_data/demo/demo.sqlite';
export const DEFAULT_DEMO_DOWNLOAD_DIR = 'runtime_data/demo/downloaded_files';
export const DEFAULT_DEMO_WORKER_TRUTH_DIR = 'runtime_data/v2_worker_truth/demo';
export const DEFAULT_DEMO_SCHEDULER_DIR = 'runtime_data/scheduler/demo';
export const DEFAULT_DEMO_LOG_DIR = 'runtime_data/logs/demo';
export const DEFAULT_DEMO_RUNTIME_OUTPUT_DIR = 'runtime_data/demo/outputs';
export const DEFAULT_DEMO_QUEUE_OUTPUT_PATH = 'runtime_data/demo/outputs/display_queue.json';

export function resolveDemoRuntimePaths(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): DemoRuntimePaths {
  const repoRoot = path.resolve(readEnvPath(env, 'PHOTOFRAME_REPO_ROOT') ?? readEnvPath(env, 'PF_REPO_ROOT') ?? cwd);

  return {
    repoRoot,
    dbPath: resolveAgainstRepoRoot(repoRoot, readEnvPath(env, 'DEMO_DB_PATH') ?? DEFAULT_DEMO_DB_PATH),
    downloadDir: resolveAgainstRepoRoot(repoRoot, readEnvPath(env, 'DEMO_DOWNLOAD_DIR') ?? DEFAULT_DEMO_DOWNLOAD_DIR),
    workerTruthDir: resolveAgainstRepoRoot(repoRoot, readEnvPath(env, 'DEMO_V2_WORKER_TRUTH_DIR') ?? DEFAULT_DEMO_WORKER_TRUTH_DIR),
    schedulerDir: resolveAgainstRepoRoot(repoRoot, readEnvPath(env, 'DEMO_SCHEDULER_DIR') ?? DEFAULT_DEMO_SCHEDULER_DIR),
    logDir: resolveAgainstRepoRoot(repoRoot, readEnvPath(env, 'DEMO_LOG_DIR') ?? DEFAULT_DEMO_LOG_DIR),
    runtimeOutputDir: resolveAgainstRepoRoot(repoRoot, readEnvPath(env, 'DEMO_RUNTIME_OUTPUT_DIR') ?? DEFAULT_DEMO_RUNTIME_OUTPUT_DIR),
    queueOutputPath: resolveAgainstRepoRoot(repoRoot, readEnvPath(env, 'DEMO_QUEUE_OUTPUT_PATH') ?? DEFAULT_DEMO_QUEUE_OUTPUT_PATH)
  };
}
