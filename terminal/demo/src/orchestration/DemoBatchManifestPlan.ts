// Builds dry-run command and manifest plans for future real-demo execution.
// Keep this file focused so future slices can stay below the 300 LOC target.

import path from 'node:path';
import type { DemoRuntimePaths } from '../config/runtimeTypes.js';
import type { MediaRow } from '../state/DemoTerminalState.js';

export type SupportedDryRunBatchSize = 1 | 5;

export interface PlannedManifestRow {
  rowNumber: number;
  relativePath: string;
  fileName: string;
  type: MediaRow['type'];
  gps: MediaRow['gps'];
}

export interface DemoBatchManifestPlan {
  batchSize: SupportedDryRunBatchSize;
  runRowCount: number;
  manifestPath: string;
  selectedRows: PlannedManifestRow[];
  writePolicy: 'dry-run-only-no-file-written';
  selectionPolicy: 'first_5_real_demo_rows_chunked_by_batch_size';
}

export function buildDemoBatchManifestPlan(
  paths: Pick<DemoRuntimePaths, 'runtimeOutputDir'>,
  mediaRows: MediaRow[],
  batchSize: SupportedDryRunBatchSize
): DemoBatchManifestPlan {
  const runRowCount = Math.min(5, mediaRows.length);
  const selectedRows = mediaRows.slice(0, runRowCount).map((row) => ({
    rowNumber: row.rowNumber,
    relativePath: row.relativePath ?? row.fileName,
    fileName: row.fileName,
    type: row.type,
    gps: row.gps
  }));

  return {
    batchSize,
    runRowCount,
    manifestPath: path.join(paths.runtimeOutputDir, `terminal_demo_batch_size_${batchSize}.manifest.json`),
    selectedRows,
    writePolicy: 'dry-run-only-no-file-written',
    selectionPolicy: 'first_5_real_demo_rows_chunked_by_batch_size'
  };
}
