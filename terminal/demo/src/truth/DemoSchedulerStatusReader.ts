// Reads and maps real-demo worker truth/status data for terminal panels.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { DemoSchedulerStatus, DemoTruthWorkerId } from './DemoTruthRepository.js';

export function readDemoSchedulerStatuses(schedulerDir: string): DemoSchedulerStatus[] {
  if (!existsSync(schedulerDir) || !statSync(schedulerDir).isDirectory()) return [];
  return readdirSync(schedulerDir)
    .filter((name) => /status.*\.json$|.*-status\.json$/i.test(name))
    .sort()
    .flatMap((name) => readStatusFile(path.join(schedulerDir, name), name));
}

function readStatusFile(filePath: string, fileName: string): DemoSchedulerStatus[] {
  try {
    const value = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
    return [{
      sourcePath: filePath,
      workerHint: inferWorker(fileName),
      status: stringValue(value.status ?? value.state ?? value.result, 'unknown'),
      timestamp: stringValue(value.timestamp ?? value.updatedAt ?? value.finishedAt ?? value.startedAt, 'unknown'),
      message: stringValue(value.message ?? value.lastEvent ?? value.error ?? value.summary, 'status file present')
    }];
  } catch {
    return [{
      sourcePath: filePath,
      workerHint: inferWorker(fileName),
      status: 'error',
      timestamp: 'unknown',
      message: 'failed to parse scheduler/status JSON'
    }];
  }
}

function inferWorker(fileName: string): DemoTruthWorkerId {
  const lower = fileName.toLowerCase();
  if (lower.includes('playback')) return 'playback-worker';
  if (lower.includes('screen') || lower.includes('on-off')) return 'screen-worker';
  return 'regular-worker';
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
