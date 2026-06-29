// Builds real-demo Q route frame plans without fabricating worker success.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoStageIntent } from '../orchestration/PhotoFrameWorkerCommandContract.js';
import type { DemoDryRunCommandPlan } from '../orchestration/DemoDryRunCommandPlanner.js';
import type { PlannedManifestRow } from '../orchestration/DemoBatchManifestPlan.js';
import type { ManifestWriteResult } from './DemoBatchManifestWriter.js';
import { runOrPlanRegularStageWorkerStage, type StageExecutionResult } from './PhotoFrameStageExecutionAdapter.js';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { SupportedBatchSize } from './SupportedBatchSize.js';

export interface RealDemoRouteFramePlan {
  title: string;
  lines: string[];
}

const stageOrder: DemoStageIntent[] = ['index', 'gps', 'geocode', 'queue_prepare'];
const maxRunRows = 5;

export function buildRealDemoRouteFrames(input: {
  boundary: RuntimeBoundaryState;
  plan: DemoDryRunCommandPlan;
  manifest: ManifestWriteResult;
  batchSize: SupportedBatchSize;
}): RealDemoRouteFramePlan[] {
  const selectedRows = input.plan.manifest.selectedRows.slice(0, maxRunRows);
  const route = input.batchSize === 1 ? 'batch_size_1_file_by_file' : 'batch_size_5_stage_batch';
  const frames: RealDemoRouteFramePlan[] = [
    {
      title: 'ready',
      lines: [
        `Ready to run real-demo Q with batch_size=${input.batchSize}`,
        `Route: ${route}`,
        `Rows in run manifest: ${selectedRows.length}`,
        ...selectedRows.map((row) => `Will use row #${row.rowNumber}: ${row.relativePath} gps=${row.gps}`)
      ]
    },
    {
      title: 'manifest',
      lines: [
        `Manifest: ${input.manifest.status} ${input.manifest.manifestPath}`,
        ...input.manifest.messages.map((message) => `Manifest: ${message}`),
        `Manifest guard: DEMO_RUNTIME_OUTPUT_DIR only`,
        'No cron was used by the terminal.'
      ]
    }
  ];

  if (input.batchSize === 1) {
    for (const row of selectedRows) {
      for (const stage of stageOrder) frames.push(buildStageFrame(input, route, stage, [row]));
    }
  } else {
    for (const stage of stageOrder) frames.push(buildStageFrame(input, route, stage, selectedRows));
  }

  frames.push(buildFinalFrame(input, selectedRows, route));
  return frames;
}

function buildStageFrame(
  input: { boundary: RuntimeBoundaryState; plan: DemoDryRunCommandPlan; manifest: ManifestWriteResult; batchSize: SupportedBatchSize },
  route: 'batch_size_1_file_by_file' | 'batch_size_5_stage_batch',
  stage: DemoStageIntent,
  rows: PlannedManifestRow[]
): RealDemoRouteFramePlan {
  const result = runOrPlanRegularStageWorkerStage({
    boundary: input.boundary,
    plan: input.plan,
    manifestPath: input.manifest.manifestPath,
    stage,
    rows,
    route
  });
  return {
    title: `${stage}:${rows.map((row) => row.rowNumber).join(',')}`,
    lines: stageLines(stage, rows, route, result)
  };
}

function stageLines(
  stage: DemoStageIntent,
  rows: PlannedManifestRow[],
  route: string,
  result: StageExecutionResult
): string[] {
  return [
    `Q route: ${route}`,
    `Stage snapshot: ${stage}`,
    `Rows: ${rows.map((row) => `#${row.rowNumber} ${row.relativePath} gps=${row.gps}`).join(' | ')}`,
    `Worker command: ${result.command}`,
    `Execution: ${result.status}`,
    ...result.messages.map((message) => `Execution: ${message}`),
    'Snapshot refresh: media/truth/status re-read for this terminal frame.',
    'No fake worker success is written by the terminal.'
  ];
}

function buildFinalFrame(
  input: { batchSize: SupportedBatchSize },
  rows: PlannedManifestRow[],
  route: string
): RealDemoRouteFramePlan {
  const validRows = rows.filter((row) => row.gps === 'valid');
  const problemRows = rows.filter((row) => row.gps !== 'valid');
  return {
    title: 'finished',
    lines: [
      `Q finished guarded route for batch_size=${input.batchSize}`,
      `Route: ${route}`,
      `Rows considered: ${rows.length}`,
      `Expected eligible from discovered fixture metadata: ${validRows.map((row) => `#${row.rowNumber}`).join(', ') || 'none'}`,
      `Expected not eligible from discovered fixture metadata: ${problemRows.map((row) => `#${row.rowNumber}`).join(', ') || 'none'}`,
      'Actual queue/truth result must come from DEMO truth/queue readers; terminal does not fabricate success.',
      'No cron was used by the terminal.'
    ]
  };
}
