// Writes DEMO-scoped truth/status events for manual Q runs.
// No cron or scheduler is installed; these files are terminal-demo evidence only.

import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { QCreatedQueueResult } from './RealDemoDbQueueProducer.js';

export interface QTruthWriteResult { status: 'passed' | 'failed'; eventCount: number; truthPath: string; statusPath: string; messages: string[]; }

export function writeQDemoTruthEvents(input: { boundary: RuntimeBoundaryState; qResult: QCreatedQueueResult; executedAt: string }): QTruthWriteResult {
  try {
    mkdirSync(input.boundary.workerTruthDir, { recursive: true });
    mkdirSync(input.boundary.schedulerDir, { recursive: true });
    const truthPath = path.join(input.boundary.workerTruthDir, 'regular-worker.truth.jsonl');
    const statusPath = path.join(input.boundary.schedulerDir, 'regular-worker.status.json');
    const events = buildEvents(input);
    appendFileSync(truthPath, `${events.map((event) => JSON.stringify(event)).join('\n')}\n`, 'utf8');
    writeFileSync(statusPath, JSON.stringify({
      worker: 'regular-worker', status: 'finished', timestamp: input.executedAt,
      message: `manual DEMO Q batch=${input.qResult.batchSize} finished`,
      counts: { selected: input.qResult.selectedRows, ready: input.qResult.readyQueueRows }
    }, null, 2));
    return { status: 'passed', eventCount: events.length, truthPath, statusPath, messages: [`Q truth events written: ${events.length}`, `Q scheduler status written: ${statusPath}`] };
  } catch (error) {
    return { status: 'failed', eventCount: 0, truthPath: '', statusPath: '', messages: [`failed to write Q truth/status: ${String(error)}`] };
  }
}

function buildEvents(input: { qResult: QCreatedQueueResult; executedAt: string }): Array<Record<string, unknown>> {
  const q = input.qResult;
  return [
    event('Index', 'finished', input.executedAt, 'DEMO media indexed through stage2', { selected: q.selectedRows }),
    event('GPS parser', q.metadataAddress.gpsSuccess > 0 ? 'finished' : 'degraded', input.executedAt, 'DEMO GPS metadata stage completed/degraded', { processed: q.metadataAddress.gpsProcessed, success: q.metadataAddress.gpsSuccess, failed: q.metadataAddress.gpsFailure }),
    event('Geocode', q.metadataAddress.geocodeSuccess > 0 ? 'finished' : 'degraded', input.executedAt, 'DEMO geocode provider stage completed/degraded', { processed: q.metadataAddress.geocodeProcessed, success: q.metadataAddress.geocodeSuccess, failed: q.metadataAddress.geocodeFailure }),
    event('Queue', q.readyQueueRows > 0 ? 'finished' : 'interrupted', input.executedAt, 'DEMO slideshow_queue rows prepared', { ready: q.readyQueueRows, inserted: q.insertedQueueRows, updated: q.updatedQueueRows })
  ];
}

function event(stage: string, status: string, timestamp: string, message: string, counts: Record<string, number>): Record<string, unknown> {
  return { worker: 'regular-worker', stage, status, timestamp, message, counts };
}
