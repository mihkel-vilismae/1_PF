/*
 * Resolves scheduler/status/lock directories for worker entrypoints.
 * Demo Mode must not write the real runtime_data/scheduler directory.
 */
import path from 'node:path';

const DEFAULT_SCHEDULER_DIR = path.join('runtime_data', 'scheduler');
const DEFAULT_DEMO_SCHEDULER_DIR = path.join('runtime_data', 'scheduler', 'demo');

export function resolveSchedulerRuntimeDirectory(repoRoot: string, env: NodeJS.ProcessEnv = process.env): string {
  const mode = String(env.PF_RUNTIME_MODE ?? env.RUNTIME_MODE ?? '').trim().toLowerCase();
  const configured = mode === 'demo'
    ? env.DEMO_SCHEDULER_DIR || DEFAULT_DEMO_SCHEDULER_DIR
    : DEFAULT_SCHEDULER_DIR;
  return path.isAbsolute(configured) ? configured : path.resolve(repoRoot, configured);
}
