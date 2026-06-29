// Plans guarded PhotoFrame scheduler worker calls for terminal Demo Mode.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { spawnSync } from 'node:child_process';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { DemoDryRunCommandPlan } from '../orchestration/DemoDryRunCommandPlanner.js';
import type { DemoStageIntent } from '../orchestration/PhotoFrameWorkerCommandContract.js';
import type { PlannedManifestRow } from '../orchestration/DemoBatchManifestPlan.js';

export interface StageExecutionResult {
  status: 'planned' | 'passed' | 'failed' | 'blocked';
  command: string;
  exitCode: number | null;
  messages: string[];
}

export interface StageExecutionInput {
  boundary: RuntimeBoundaryState;
  plan: DemoDryRunCommandPlan;
  manifestPath: string;
  stage: DemoStageIntent;
  rows: PlannedManifestRow[];
  route: 'batch_size_1_file_by_file' | 'batch_size_5_stage_batch';
}

const regularWorkerCommand = 'npm run api -- --scheduler regular-stage-worker';

export function runOrPlanRegularStageWorkerStage(input: StageExecutionInput): StageExecutionResult {
  const execute = process.env.PHOTOFRAME_TERMINAL_DEMO_EXECUTE === '1';
  const noCronGuard = verifyNoCronCommand(regularWorkerCommand);
  if (!noCronGuard.safe) {
    return { status: 'blocked', command: regularWorkerCommand, exitCode: null, messages: [noCronGuard.reason] };
  }

  const baseMessages = [
    'no cron is used; this is a manual terminal-triggered command plan',
    `route=${input.route}`,
    `stage=${input.stage}`,
    `batch_size=${input.plan.batchSize}`,
    `manifest=${input.manifestPath}`,
    `rows=${input.rows.map((row) => row.rowNumber).join(',') || 'none'}`
  ];

  if (!execute) {
    return {
      status: 'planned',
      command: regularWorkerCommand,
      exitCode: null,
      messages: ['real worker execution is guarded by PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1', ...baseMessages]
    };
  }

  if (process.env.PHOTOFRAME_TERMINAL_DEMO_ACK_WORKER_DEMO_SCHEDULER_SAFE !== '1') {
    return {
      status: 'blocked',
      command: regularWorkerCommand,
      exitCode: null,
      messages: [
        'blocked: regular-stage-worker scheduler/status output is not yet proven DEMO-isolated',
        'set PHOTOFRAME_TERMINAL_DEMO_ACK_WORKER_DEMO_SCHEDULER_SAFE=1 only after Group 6 path-isolation proof exists',
        ...baseMessages
      ]
    };
  }

  const env = buildDemoWorkerEnv(input);
  const result = spawnSync('npm', ['run', 'api', '--', '--scheduler', 'regular-stage-worker'], {
    cwd: input.boundary.repoRoot,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return {
    status: result.status === 0 ? 'passed' : 'failed',
    command: regularWorkerCommand,
    exitCode: result.status,
    messages: [
      `manual real-demo worker exit_code=${result.status ?? 'null'}`,
      ...baseMessages,
      ...String(result.stdout ?? '').split(/\r?\n/).filter(Boolean).slice(-4),
      ...String(result.stderr ?? '').split(/\r?\n/).filter(Boolean).slice(-4)
    ]
  };
}

function buildDemoWorkerEnv(input: StageExecutionInput): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PF_RUNTIME_MODE: 'demo',
    RUNTIME_MODE: 'demo',
    DEMO_BATCH_SIZE: String(input.plan.batchSize),
    DEMO_TARGET_STAGE: input.stage,
    DEMO_TARGET_ROWS: input.rows.map((row) => row.relativePath).join(','),
    DEMO_BATCH_MANIFEST_PATH: input.manifestPath,
    DEMO_DB_PATH: input.boundary.dbPath,
    DEMO_DOWNLOAD_DIR: input.boundary.downloadDir,
    DEMO_V2_WORKER_TRUTH_DIR: input.boundary.workerTruthDir,
    DEMO_SCHEDULER_DIR: input.boundary.schedulerDir,
    DEMO_RUNTIME_OUTPUT_DIR: input.boundary.runtimeOutputDir,
    DEMO_QUEUE_OUTPUT_PATH: input.boundary.queueOutputPath,
    PF_REGULAR_STAGE_WORKER_MAX_STAGES_PER_RUN: '5'
  };
}

function verifyNoCronCommand(command: string): { safe: boolean; reason: string } {
  if (/\b(cron|crontab)\b/i.test(command)) return { safe: false, reason: `blocked cron-like command: ${command}` };
  return { safe: true, reason: 'command is manual/no-cron' };
}
