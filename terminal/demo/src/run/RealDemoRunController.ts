// Coordinates terminal Q runs for real-demo without using cron.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { MediaRow, PlaybackQueueRow } from '../state/DemoTerminalState.js';
import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { buildDryRunCommandPlan } from '../orchestration/DemoDryRunCommandPlanner.js';
import type { DemoTruthReadResult } from '../truth/DemoTruthRepository.js';
import { createInitialRealDemoState } from '../state/createInitialRealDemoState.js';
import { writeDemoBatchManifest } from './DemoBatchManifestWriter.js';
import type { SupportedBatchSize } from './SupportedBatchSize.js';
import { buildRealDemoRouteFrames } from './RealDemoRoutePlanner.js';

export interface RealRunInput {
  boundary: RuntimeBoundaryState;
  batchSize: SupportedBatchSize;
  mediaRows: MediaRow[];
  mediaMessages: string[];
  truth: DemoTruthReadResult;
  queueRows: PlaybackQueueRow[];
  queueMessages: string[];
  refresh?: () => { mediaRows: MediaRow[]; mediaMessages: string[]; truth: DemoTruthReadResult; queueRows: PlaybackQueueRow[]; queueMessages: string[] };
}

export function runRealDemoQ(input: RealRunInput): DemoTerminalState[] {
  const plan = buildDryRunCommandPlan(input.boundary, input.mediaRows, input.batchSize);
  const manifest = writeDemoBatchManifest(input.boundary, input.mediaRows, input.batchSize);
  const framePlans = buildRealDemoRouteFrames({ boundary: input.boundary, plan, manifest, batchSize: input.batchSize });
  return framePlans.map((framePlan) => {
    const fresh = input.refresh?.() ?? input;
    return buildFrame(input, fresh, [`Frame: ${framePlan.title}`, ...framePlan.lines]);
  });
}

function buildFrame(
  input: RealRunInput,
  fresh: { mediaRows: MediaRow[]; mediaMessages: string[]; truth: DemoTruthReadResult; queueRows: PlaybackQueueRow[]; queueMessages: string[] },
  lines: string[]
): DemoTerminalState {
  return createInitialRealDemoState(
    input.boundary,
    fresh.mediaRows,
    fresh.mediaMessages,
    fresh.truth,
    lines,
    input.batchSize,
    fresh.queueRows,
    fresh.queueMessages
  );
}
