// Persists start_stage_modal manual stage evidence in the shared button-action log.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { DemoStageIntent, SchedulerWorkerName } from '../orchestration/PhotoFrameWorkerCommandContract.js';
import type { ManualStageBatchSize, ManualStageKey } from '../startStageModal/StartStageModalState.js';

export interface ManualStageActionLogResult {
  status: 'written' | 'skipped';
  logPath: string;
  message: string;
}

export function writeManualStageActionLog(input: {
  boundary: RuntimeBoundaryState;
  key: ManualStageKey;
  stage: DemoStageIntent;
  batchSize: ManualStageBatchSize;
  route: string;
  workerName: SchedulerWorkerName;
  command: string;
  cronReference: string;
  resultStatus: string;
  selectedRows: number;
  manifestPath: string;
  messages: string[];
  startedAt: string;
  dbEffect?: { operation: string; status: string; counts: Record<string, number>; dbPath: string } | null;
  truthStatus?: string | null;
}): ManualStageActionLogResult {
  const logPath = join(input.boundary.logDir, 'terminal-button-actions.jsonl');
  try {
    mkdirSync(input.boundary.logDir, { recursive: true });
    appendFileSync(logPath, `${JSON.stringify({
      timestamp: new Date().toISOString(),
      startedAt: input.startedAt,
      button: input.key,
      action: 'start_stage_modal_manual_stage',
      source: 'manual-stage-modal',
      elementId: 'start_stage_modal',
      status: input.resultStatus,
      stage: input.stage,
      batchSize: input.batchSize,
      route: input.route,
      workerName: input.workerName,
      command: input.command,
      cronReference: input.cronReference,
      selectedRows: input.selectedRows,
      manifestPath: input.manifestPath,
      dbEffect: input.dbEffect ?? null,
      truthStatus: input.truthStatus ?? null,
      noCron: true,
      messages: input.messages
    })}\n`, 'utf8');
    return { status: 'written', logPath, message: `manual stage action event written: ${logPath}` };
  } catch (error) {
    return { status: 'skipped', logPath, message: `manual stage action event log skipped: ${String(error)}` };
  }
}
