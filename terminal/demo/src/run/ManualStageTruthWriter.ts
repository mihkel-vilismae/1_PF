// Writes DEMO-scoped truth/status events for start_stage_modal manual stage runs.
// No cron or scheduler is installed; these files are terminal-demo evidence only.

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { DemoStageIntent } from '../orchestration/PhotoFrameWorkerCommandContract.js';
import type { ManualStageDbEffectResult } from './ManualStageDbExecutor.js';

export interface ManualStageTruthWriteResult {
  status: 'passed' | 'failed';
  truthPath: string;
  statusPath: string;
  messages: string[];
}

export function writeManualStageTruth(input: { boundary: RuntimeBoundaryState; stage: DemoStageIntent; dbEffect: ManualStageDbEffectResult; executedAt: string }): ManualStageTruthWriteResult {
  try {
    mkdirSync(input.boundary.workerTruthDir, { recursive: true });
    mkdirSync(input.boundary.schedulerDir, { recursive: true });
    const truthPath = path.join(input.boundary.workerTruthDir, 'regular-worker.truth.jsonl');
    const statusPath = path.join(input.boundary.schedulerDir, 'regular-worker.status.json');
    appendFileSync(truthPath, `${JSON.stringify(buildEvent(input))}\n`, 'utf8');
    writeFileSync(statusPath, `${JSON.stringify(buildStatus(input), null, 2)}\n`, 'utf8');
    return { status: 'passed', truthPath, statusPath, messages: [`manual stage truth event written: ${truthPath}`, `manual stage status written: ${statusPath}`] };
  } catch (error) {
    return { status: 'failed', truthPath: '', statusPath: '', messages: [`failed to write manual stage truth/status: ${String(error)}`] };
  }
}

function buildEvent(input: { stage: DemoStageIntent; dbEffect: ManualStageDbEffectResult; executedAt: string }): Record<string, unknown> {
  return {
    worker: 'regular-worker',
    stage: labelForStage(input.stage),
    status: truthStatus(input.dbEffect.status),
    timestamp: input.executedAt,
    message: `start_stage_modal manual ${input.stage} DB effect ${input.dbEffect.status}`,
    counts: input.dbEffect.counts,
    source: 'manual-stage-modal',
    noCron: true
  };
}

function buildStatus(input: { stage: DemoStageIntent; dbEffect: ManualStageDbEffectResult; executedAt: string }): Record<string, unknown> {
  return {
    worker: 'regular-worker',
    status: input.dbEffect.status,
    timestamp: input.executedAt,
    message: `manual start_stage_modal stage=${input.stage}`,
    counts: input.dbEffect.counts,
    source: 'manual-stage-modal',
    noCron: true
  };
}

function labelForStage(stage: DemoStageIntent): string {
  if (stage === 'gps') return 'GPS parser';
  if (stage === 'queue_prepare') return 'Queue';
  return stage === 'index' ? 'Index' : 'Geocode';
}

function truthStatus(status: ManualStageDbEffectResult['status']): 'finished' | 'degraded' | 'error' {
  if (status === 'passed') return 'finished';
  if (status === 'failed') return 'error';
  return 'degraded';
}
