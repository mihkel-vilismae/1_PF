// Coordinates terminal Q runs for real-demo without using cron.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { MediaRow } from '../state/DemoTerminalState.js';
import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { buildDryRunCommandPlan } from '../orchestration/DemoDryRunCommandPlanner.js';
import type { DemoTruthReadResult } from '../truth/DemoTruthRepository.js';
import { createInitialRealDemoState } from '../state/createInitialRealDemoState.js';
import { writeDemoBatchManifest } from './DemoBatchManifestWriter.js';
import { runOrPlanRegularStageWorker } from './PhotoFrameStageExecutionAdapter.js';
import type { SupportedBatchSize } from './SupportedBatchSize.js';

export interface RealRunInput {
  boundary: RuntimeBoundaryState;
  batchSize: SupportedBatchSize;
  mediaRows: MediaRow[];
  mediaMessages: string[];
  truth: DemoTruthReadResult;
}

export function runRealDemoQ(input: RealRunInput): DemoTerminalState[] {
  const plan = buildDryRunCommandPlan(input.boundary, input.mediaRows, input.batchSize);
  const manifest = writeDemoBatchManifest(input.boundary, input.mediaRows, input.batchSize);
  const stage = runOrPlanRegularStageWorker(input.boundary, plan, manifest.manifestPath);
  const selected = input.mediaRows.slice(0, input.batchSize);
  const lines = [
    `Q pressed: real-demo selected batch_size=${input.batchSize}`,
    `Selection: first ${input.batchSize} generated demo row${input.batchSize === 1 ? '' : 's'}`,
    `Manifest: ${manifest.status} ${manifest.manifestPath}`,
    ...manifest.messages.map((message) => `Manifest: ${message}`),
    `Worker command: ${stage.command}`,
    `Execution: ${stage.status}`,
    ...stage.messages.map((message) => `Execution: ${message}`),
    ...selected.map((row) => `Selected row #${row.rowNumber}: ${row.relativePath ?? row.fileName} gps=${row.gps}`),
    input.batchSize === 1
      ? 'Route: batch_size=1 file-by-file teaching route.'
      : 'Route: batch_size=5 stage-by-stage batch route.',
    'No cron was used by the terminal.'
  ];
  return [
    buildFrame(input, [`Ready to run real-demo Q with batch_size=${input.batchSize}`, ...selected.map((row) => `Will use row #${row.rowNumber}: ${row.relativePath ?? row.fileName}`)]),
    buildFrame(input, lines)
  ];
}

function buildFrame(input: RealRunInput, lines: string[]): DemoTerminalState {
  return createInitialRealDemoState(input.boundary, input.mediaRows, input.mediaMessages, input.truth, lines, input.batchSize);
}
