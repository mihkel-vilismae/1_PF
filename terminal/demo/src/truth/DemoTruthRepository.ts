// Reads and maps real-demo worker truth/status data for terminal panels.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { StagePanelRow, WorkerPanelRow } from '../state/DemoTerminalState.js';

export type DemoTruthWorkerId = 'regular-worker' | 'playback-worker' | 'screen-worker';
export type DemoTruthStatus = 'started' | 'finished' | 'degraded' | 'error' | 'interrupted' | 'state';

export interface DemoTruthEvent {
  worker: DemoTruthWorkerId;
  stage: string;
  status: DemoTruthStatus;
  timestamp: string;
  message: string;
  error?: string;
  counts?: Record<string, number>;
  sourcePath: string;
  sourceLine: number;
}

export interface DemoSchedulerStatus {
  sourcePath: string;
  workerHint: DemoTruthWorkerId;
  status: string;
  timestamp: string;
  message: string;
}

export interface DemoTruthReadResult {
  stages: StagePanelRow[];
  workers: WorkerPanelRow[];
  messages: string[];
}

export interface DemoTruthRepository {
  readDemoTruth(): DemoTruthReadResult;
}
