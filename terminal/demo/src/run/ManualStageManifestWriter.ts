// Writes start_stage_modal manifests into DEMO_RUNTIME_OUTPUT_DIR.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import { buildDemoBatchManifestPlan, type PlannedManifestRow } from '../orchestration/DemoBatchManifestPlan.js';
import type { DemoStageIntent } from '../orchestration/PhotoFrameWorkerCommandContract.js';
import type { ManualStageBatchSize, ManualStageKey } from '../startStageModal/StartStageModalState.js';
import type { MediaRow } from '../state/DemoTerminalState.js';
import { verifyDemoManifestPath } from './DemoManifestSafety.js';

export interface ManualStageManifestResult {
  status: 'written' | 'blocked';
  manifestPath: string;
  selectedRows: PlannedManifestRow[];
  messages: string[];
}

export function writeManualStageManifest(input: {
  boundary: RuntimeBoundaryState;
  mediaRows: MediaRow[];
  batchSize: ManualStageBatchSize;
  key: ManualStageKey;
  stage: DemoStageIntent;
  startedAt: string;
}): ManualStageManifestResult {
  const plan = buildDemoBatchManifestPlan(input.boundary, input.mediaRows, input.batchSize);
  const manifestPath = path.join(input.boundary.runtimeOutputDir, `start_stage_modal_${input.stage}_batch_${input.batchSize}.manifest.json`);
  const safety = verifyDemoManifestPath(input.boundary, manifestPath);
  if (!safety.safe) return { status: 'blocked', manifestPath, selectedRows: [], messages: [safety.reason] };

  const payload = {
    schemaVersion: 1,
    source: 'start_stage_modal',
    runtimeMode: 'demo',
    noCron: true,
    key: input.key,
    stage: input.stage,
    batchSize: input.batchSize,
    runRowCount: plan.runRowCount,
    selectionPolicy: plan.selectionPolicy,
    rows: plan.selectedRows,
    createdAt: input.startedAt,
    safety: safety.reason
  };
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return {
    status: 'written',
    manifestPath,
    selectedRows: plan.selectedRows,
    messages: [`manual stage manifest written: ${manifestPath}`, `selected_rows=${plan.selectedRows.length}`]
  };
}
