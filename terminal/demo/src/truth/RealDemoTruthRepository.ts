// Reads and maps real-demo worker truth/status data for terminal panels.
// Keep this file focused so future slices can stay below the 300 LOC target.

import path from 'node:path';
import type { DemoRuntimePaths } from '../config/runtimeTypes.js';
import type { DemoTruthEvent, DemoTruthReadResult, DemoTruthRepository, DemoTruthStatus, DemoTruthWorkerId } from './DemoTruthRepository.js';
import { readDemoSchedulerStatuses } from './DemoSchedulerStatusReader.js';
import { readJsonlTail } from './readJsonlTail.js';
import { mapDemoTruthToStages } from './mapDemoTruthToStages.js';
import { mapDemoTruthToWorkers } from './mapDemoTruthToWorkers.js';

const workerFiles: Array<{ id: DemoTruthWorkerId; file: string }> = [
  { id: 'regular-worker', file: 'regular-worker.truth.jsonl' },
  { id: 'playback-worker', file: 'playback-worker.truth.jsonl' },
  { id: 'screen-worker', file: 'screen-worker.truth.jsonl' }
];

export class RealDemoTruthRepository implements DemoTruthRepository {
  constructor(private readonly paths: DemoRuntimePaths) {}

  readDemoTruth(): DemoTruthReadResult {
    const events: DemoTruthEvent[] = [];
    const messages: string[] = [`Demo truth source: ${this.paths.workerTruthDir}`];

    for (const worker of workerFiles) {
      const filePath = path.join(this.paths.workerTruthDir, worker.file);
      const result = readJsonlTail(filePath);
      messages.push(`${worker.file}: ${result.exists ? `${result.parsed.length} parsed, ${result.malformed.length} malformed` : 'missing'}`);
      for (const parsed of result.parsed) events.push(toEvent(worker.id, result.path, parsed.value, parsed.line));
      for (const bad of result.malformed) messages.push(`Malformed ${worker.file} line ${bad.line}: ${bad.error}`);
    }

    events.sort((left, right) => left.timestamp.localeCompare(right.timestamp));
    const statuses = readDemoSchedulerStatuses(this.paths.schedulerDir);
    if (statuses.length > 0) messages.push(`Demo scheduler/status files read: ${statuses.length}`);
    if (events.length === 0 && statuses.length === 0) messages.push('No demo truth/status files exist yet; panels show safe empty state.');

    return {
      stages: mapDemoTruthToStages(events, this.paths.workerTruthDir),
      workers: mapDemoTruthToWorkers(events, statuses, this.paths.workerTruthDir),
      messages
    };
  }
}

function toEvent(worker: DemoTruthWorkerId, sourcePath: string, raw: Record<string, unknown>, sourceLine: number): DemoTruthEvent {
  const error = optionalString(raw.error);
  const counts = normalizeCounts(raw.counts);
  return {
    worker: normalizeWorker(raw.worker, worker),
    stage: stringValue(raw.stage, 'unknown'),
    status: normalizeStatus(raw.status),
    timestamp: stringValue(raw.timestamp, new Date(0).toISOString()),
    message: stringValue(raw.message, ''),
    ...(error ? { error } : {}),
    ...(counts ? { counts } : {}),
    sourcePath,
    sourceLine
  };
}

function normalizeWorker(value: unknown, fallback: DemoTruthWorkerId): DemoTruthWorkerId {
  return value === 'regular-worker' || value === 'playback-worker' || value === 'screen-worker' ? value : fallback;
}

function normalizeStatus(value: unknown): DemoTruthStatus {
  return value === 'finished' || value === 'error' || value === 'interrupted' || value === 'state' ? value : 'started';
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeCounts(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const counts = Object.fromEntries(Object.entries(value).map(([key, raw]) => [key, Number(raw)]).filter(([, raw]) => Number.isFinite(raw)));
  return Object.keys(counts).length > 0 ? counts : undefined;
}
