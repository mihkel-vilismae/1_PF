// Runs or plans PhotoFrame scheduler worker calls for terminal Demo Mode.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { spawnSync } from 'node:child_process';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { DemoDryRunCommandPlan } from '../orchestration/DemoDryRunCommandPlanner.js';

export interface StageExecutionResult {
  status: 'planned' | 'passed' | 'failed' | 'blocked';
  command: string;
  exitCode: number | null;
  messages: string[];
}

export function runOrPlanRegularStageWorker(
  boundary: RuntimeBoundaryState,
  plan: DemoDryRunCommandPlan,
  manifestPath: string
): StageExecutionResult {
  const command = 'npm run api -- --scheduler regular-stage-worker';
  const execute = process.env.PHOTOFRAME_TERMINAL_DEMO_EXECUTE === '1';
  if (!execute) {
    return {
      status: 'planned',
      command,
      exitCode: null,
      messages: [
        'real worker execution is guarded by PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1',
        'no cron is used; this is a manual terminal-triggered command plan',
        `batch_size=${plan.batchSize}`,
        `manifest=${manifestPath}`
      ]
    };
  }

  const env = {
    ...process.env,
    PF_RUNTIME_MODE: 'demo',
    RUNTIME_MODE: 'demo',
    DEMO_BATCH_SIZE: String(plan.batchSize),
    DEMO_BATCH_MANIFEST_PATH: manifestPath,
    DEMO_DB_PATH: boundary.dbPath,
    DEMO_DOWNLOAD_DIR: boundary.downloadDir,
    DEMO_V2_WORKER_TRUTH_DIR: boundary.workerTruthDir,
    DEMO_SCHEDULER_DIR: boundary.schedulerDir,
    DEMO_RUNTIME_OUTPUT_DIR: boundary.runtimeOutputDir,
    DEMO_QUEUE_OUTPUT_PATH: boundary.queueOutputPath,
    PF_REGULAR_STAGE_WORKER_MAX_STAGES_PER_RUN: '5'
  };
  const result = spawnSync('npm', ['run', 'api', '--', '--scheduler', 'regular-stage-worker'], {
    cwd: boundary.repoRoot,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return {
    status: result.status === 0 ? 'passed' : 'failed',
    command,
    exitCode: result.status,
    messages: [
      `manual real-demo worker exit_code=${result.status ?? 'null'}`,
      ...String(result.stdout ?? '').split(/\r?\n/).filter(Boolean).slice(-4),
      ...String(result.stderr ?? '').split(/\r?\n/).filter(Boolean).slice(-4)
    ]
  };
}
