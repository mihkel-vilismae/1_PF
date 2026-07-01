// Routes start_stage_modal actions through the shared regular-stage-worker path.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { DemoDryRunCommandPlan } from '../orchestration/DemoDryRunCommandPlanner.js';
import { commandForWorker } from '../orchestration/PhotoFrameWorkerCommandContract.js';
import type { StartStageModalRow } from '../startStageModal/StartStageModalState.js';
import type { MediaRow } from '../state/DemoTerminalState.js';
import { runOrPlanRegularStageWorkerStage } from './PhotoFrameStageExecutionAdapter.js';
import { writeManualStageActionLog } from './ManualStageActionLogger.js';
import { writeManualStageManifest } from './ManualStageManifestWriter.js';
import { mapManualStageToWorkerIntent } from './ManualStageWorkerPathMapper.js';
import { executeManualStageDbEffect } from './ManualStageDbExecutor.js';
import { writeManualStageTruth } from './ManualStageTruthWriter.js';

export interface ManualStageRunResult {
  status: 'disabled' | 'planned' | 'blocked' | 'passed' | 'failed';
  messages: string[];
}

export function runManualStageFromModal(input: {
  boundary: RuntimeBoundaryState;
  row: StartStageModalRow;
  mediaRows: MediaRow[];
}): ManualStageRunResult {
  if (!input.row.enabled) return { status: 'disabled', messages: [`start_stage_modal: key ${input.row.key} is disabled; no worker path called.`] };
  const stage = mapManualStageToWorkerIntent(input.row.stageId);
  if (!stage) return { status: 'blocked', messages: [`no regular worker stage mapped for ${input.row.stageId}`] };

  const startedAt = new Date().toISOString();
  const manifest = writeManualStageManifest({ ...input, key: input.row.key, stage, batchSize: input.row.batchSize, startedAt });
  const worker = commandForWorker('regular-stage-worker');
  const route = `start_stage_modal:${stage}:batch_size_${input.row.batchSize}`;
  const plan = buildManualPlan(input.boundary, input.row.batchSize, manifest.manifestPath, stage, worker.npmCommand);
  const execution = manifest.status === 'blocked'
    ? { status: 'blocked' as const, command: worker.npmCommand, exitCode: null, messages: manifest.messages }
    : runOrPlanRegularStageWorkerStage({ boundary: input.boundary, plan, manifestPath: manifest.manifestPath, stage, rows: manifest.selectedRows, route });
  const dbEffect = execution.status === 'failed' || execution.status === 'blocked'
    ? null
    : executeManualStageDbEffect({ boundary: input.boundary, stage, batchSize: input.row.batchSize, rows: manifest.selectedRows, executedAt: startedAt });
  const truth = dbEffect ? writeManualStageTruth({ boundary: input.boundary, stage, dbEffect, executedAt: startedAt }) : null;
  const finalStatus = dbEffect?.status ?? execution.status;
  const messages = [
    `manual stage route: source=manual-stage-modal key=${input.row.key}`,
    `shared worker path: ${worker.workerName} ${worker.npmCommand}`,
    `cron reference reused only as contract: ${worker.cronReference}`,
    ...manifest.messages,
    ...execution.messages,
    ...(dbEffect?.messages ?? []),
    ...(truth?.messages ?? [])
  ];
  const log = writeManualStageActionLog({
    boundary: input.boundary,
    key: input.row.key,
    stage,
    batchSize: input.row.batchSize,
    route,
    workerName: worker.workerName,
    command: execution.command,
    cronReference: worker.cronReference,
    resultStatus: finalStatus,
    selectedRows: manifest.selectedRows.length,
    manifestPath: manifest.manifestPath,
    messages,
    startedAt,
    dbEffect: dbEffect ? { operation: dbEffect.operation, status: dbEffect.status, counts: dbEffect.counts, dbPath: dbEffect.dbPath } : null,
    truthStatus: truth?.status ?? null
  });
  return { status: finalStatus, messages: [...messages, log.message] };
}

function buildManualPlan(
  boundary: RuntimeBoundaryState,
  batchSize: StartStageModalRow['batchSize'],
  manifestPath: string,
  stage: NonNullable<ReturnType<typeof mapManualStageToWorkerIntent>>,
  command: string
): DemoDryRunCommandPlan {
  return {
    batchSize,
    runtimeMode: 'demo',
    trigger: 'manual-start-stage-modal',
    noCron: true,
    mergeRequiredBeforeExecution: false,
    manifest: { batchSize, runRowCount: batchSize, manifestPath, selectedRows: [], writePolicy: 'dry-run-only-no-file-written', selectionPolicy: 'first_5_real_demo_rows_chunked_by_batch_size' },
    commands: [{ stage, workerName: 'regular-stage-worker', command, cwd: boundary.repoRoot, env: { RUNTIME_MODE: 'demo', DEMO_TARGET_STAGE: stage, DEMO_BATCH_SIZE: String(batchSize), DEMO_BATCH_MANIFEST_PATH: manifestPath }, executionPolicy: 'manual-start-stage-modal-shared-worker-path' }],
    notes: ['start_stage_modal uses the same regular-stage-worker command contract as the scheduled cron lane.', 'Batch 2 plans/logs the route only; Batch 3 adds DB stage effects.']
  };
}
