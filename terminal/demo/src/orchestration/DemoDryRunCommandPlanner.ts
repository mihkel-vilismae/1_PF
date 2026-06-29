// Builds dry-run command and manifest plans for future real-demo execution.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { MediaRow } from '../state/DemoTerminalState.js';
import { buildDemoBatchManifestPlan, type DemoBatchManifestPlan, type SupportedDryRunBatchSize } from './DemoBatchManifestPlan.js';
import { commandForWorker, regularStageIntents, type DemoStageIntent, type WorkerCommandContract } from './PhotoFrameWorkerCommandContract.js';

export interface PlannedStageCommand {
  stage: DemoStageIntent;
  workerName: WorkerCommandContract['workerName'];
  command: string;
  cwd: string;
  env: Record<string, string>;
  executionPolicy: 'dry-run-plan-only';
}

export interface DemoDryRunCommandPlan {
  batchSize: SupportedDryRunBatchSize;
  runtimeMode: 'demo';
  trigger: 'manual-user-triggered-terminal-q';
  noCron: true;
  mergeRequiredBeforeExecution: true;
  manifest: DemoBatchManifestPlan;
  commands: PlannedStageCommand[];
  notes: string[];
}

export function buildDryRunCommandPlans(boundary: RuntimeBoundaryState, mediaRows: MediaRow[]): DemoDryRunCommandPlan[] {
  return [1, 5].map((size) => buildDryRunCommandPlan(boundary, mediaRows, size as SupportedDryRunBatchSize));
}

export function buildDryRunCommandPlan(
  boundary: RuntimeBoundaryState,
  mediaRows: MediaRow[],
  batchSize: SupportedDryRunBatchSize
): DemoDryRunCommandPlan {
  const regularWorker = commandForWorker('regular-stage-worker');
  const manifest = buildDemoBatchManifestPlan(boundary, mediaRows, batchSize);
  const baseEnv = {
    RUNTIME_MODE: 'demo',
    DEMO_BATCH_SIZE: String(batchSize),
    DEMO_BATCH_MANIFEST_PATH: manifest.manifestPath,
    DEMO_DB_PATH: boundary.dbPath,
    DEMO_DOWNLOAD_DIR: boundary.downloadDir,
    DEMO_V2_WORKER_TRUTH_DIR: boundary.workerTruthDir,
    DEMO_SCHEDULER_DIR: boundary.schedulerDir,
    DEMO_RUNTIME_OUTPUT_DIR: boundary.runtimeOutputDir,
    DEMO_QUEUE_OUTPUT_PATH: boundary.queueOutputPath
  };

  return {
    batchSize,
    runtimeMode: 'demo',
    trigger: 'manual-user-triggered-terminal-q',
    noCron: true,
    mergeRequiredBeforeExecution: true,
    manifest,
    commands: regularStageIntents.map((stage) => ({
      stage,
      workerName: regularWorker.workerName,
      command: regularWorker.npmCommand,
      cwd: boundary.repoRoot,
      env: { ...baseEnv, DEMO_TARGET_STAGE: stage },
      executionPolicy: 'dry-run-plan-only'
    })),
    notes: [
      'Group 3B-FINISH writes DEMO-owned manifests and plans/guards manual worker stages.',
      'Default cron calls use the same scheduler worker names, but terminal real-demo must stay manual/no-cron.',
      'Worker execution stays guarded and blocked until demo scheduler isolation is proven.'
    ]
  };
}

export function formatDryRunPlanLines(plans: DemoDryRunCommandPlan[]): string[] {
  return plans.flatMap((plan) => [
    `Dry-run plan: batch_size=${plan.batchSize} run_rows=${plan.manifest.selectedRows.length} no_cron=${plan.noCron}`,
    `Manifest plan: ${plan.manifest.manifestPath} (${plan.manifest.writePolicy})`,
    `Worker command: ${plan.commands[0]?.command ?? 'none'}`,
    `Stage intents: ${plan.commands.map((command) => command.stage).join(' -> ')}`,
    `Merge required before execution: ${plan.mergeRequiredBeforeExecution}`
  ]);
}
