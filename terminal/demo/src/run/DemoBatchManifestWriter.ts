// Writes demo-safe terminal batch manifests for future worker execution.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { MediaRow } from '../state/DemoTerminalState.js';
import { buildDemoBatchManifestPlan } from '../orchestration/DemoBatchManifestPlan.js';
import type { SupportedBatchSize } from './SupportedBatchSize.js';
import { verifyDemoManifestPath } from './DemoManifestSafety.js';

export interface ManifestWriteResult {
  status: 'written' | 'blocked';
  manifestPath: string;
  selectedRows: number;
  messages: string[];
}

export function writeDemoBatchManifest(
  boundary: RuntimeBoundaryState,
  mediaRows: MediaRow[],
  batchSize: SupportedBatchSize
): ManifestWriteResult {
  const plan = buildDemoBatchManifestPlan(boundary, mediaRows, batchSize);
  const safety = verifyDemoManifestPath(boundary, plan.manifestPath);
  if (!safety.safe) {
    return { status: 'blocked', manifestPath: plan.manifestPath, selectedRows: plan.selectedRows.length, messages: [safety.reason] };
  }

  const payload = {
    schemaVersion: 1,
    source: 'terminal-demo-real-run-controller',
    runtimeMode: 'demo',
    batchSize,
    selectionPolicy: plan.selectionPolicy,
    rows: plan.selectedRows,
    createdAt: new Date().toISOString(),
    safety: safety.reason
  };
  mkdirSync(path.dirname(plan.manifestPath), { recursive: true });
  writeFileSync(plan.manifestPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return {
    status: 'written',
    manifestPath: plan.manifestPath,
    selectedRows: plan.selectedRows.length,
    messages: [`wrote demo manifest: ${plan.manifestPath}`, `selected_rows=${plan.selectedRows.length}`]
  };
}
