// Persists manual Q button/action evidence for operator debugging.
// This is demo-scoped JSONL only; it does not install or trigger cron.

import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { QCreatedQueueResult } from './RealDemoDbQueueProducer.js';
import type { QTruthWriteResult } from './RealDemoQTruthWriter.js';
import type { SupportedBatchSize } from './SupportedBatchSize.js';

export interface QActionLogResult {
  status: 'written' | 'skipped';
  logPath: string;
  message: string;
}

export function writeQButtonActionLog(input: {
  boundary: RuntimeBoundaryState;
  qResult: QCreatedQueueResult;
  qTruth: QTruthWriteResult;
  route: string;
  batchSize: SupportedBatchSize;
  selectedRows: number;
  startedAt: string;
}): QActionLogResult {
  const logPath = join(input.boundary.logDir, 'terminal-button-actions.jsonl');
  try {
    mkdirSync(input.boundary.logDir, { recursive: true });
    const event = {
      timestamp: new Date().toISOString(),
      startedAt: input.startedAt,
      button: 'Q',
      action: 'real_demo_batch',
      status: finalStatus(input.qResult),
      batchSize: input.batchSize,
      route: input.route,
      selectedRows: input.selectedRows,
      queue: {
        insertedRows: input.qResult.insertedQueueRows,
        updatedRows: input.qResult.updatedQueueRows,
        readyRows: input.qResult.readyQueueRows,
        sourceLabel: input.qResult.sourceLabel
      },
      stages: {
        index: 'finished',
        gps: stageStatus(input.qResult.metadataAddress.gpsProcessed, input.qResult.metadataAddress.gpsSuccess, input.qResult.metadataAddress.gpsFailure),
        geocode: stageStatus(input.qResult.metadataAddress.geocodeProcessed, input.qResult.metadataAddress.geocodeSuccess, input.qResult.metadataAddress.geocodeFailure),
        queue: input.qResult.readyQueueRows > 0 ? 'finished' : 'blocked'
      },
      metadataAddress: input.qResult.metadataAddress,
      truthStatus: input.qTruth.status,
      truthEvents: input.qTruth.eventCount,
      noCron: true,
      messages: [...input.qResult.messages, ...input.qTruth.messages]
    };
    appendFileSync(logPath, `${JSON.stringify(event)}\n`, 'utf8');
    return { status: 'written', logPath, message: `Q action event written: ${logPath}` };
  } catch (error) {
    return { status: 'skipped', logPath, message: `Q action event log skipped: ${String(error)}` };
  }
}

function finalStatus(result: QCreatedQueueResult): 'passed' | 'degraded' | 'blocked' {
  if (result.status === 'passed' && result.readyQueueRows > 0) return result.metadataAddress.status === 'passed' ? 'passed' : 'degraded';
  return 'blocked';
}

function stageStatus(processed: number, success: number, failure: number): 'finished' | 'degraded' | 'blocked' {
  if (success > 0) return failure > 0 ? 'degraded' : 'finished';
  if (processed > 0 || failure > 0) return 'degraded';
  return 'blocked';
}
