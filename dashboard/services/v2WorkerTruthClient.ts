/*
 * Browser-side client for the V2 worker source-of-truth API.
 *
 * This keeps the UI from reading worker truth files directly. RPI stage and
 * worker rows consume the normalized API payload that combines regular,
 * playback, and screen worker JSONL truth files.
 */
import { requestJson, type ApiResponseWithMeta } from './apiClient.ts';
import type { V2RuntimeMode } from './v2ReadinessService.ts';

export type V2WorkerTruthStatus = 'started' | 'finished' | 'error' | 'interrupted' | 'state';
export type V2WorkerId = 'regular-worker' | 'playback-worker' | 'screen-worker';

export interface V2WorkerTruthEvent {
  schemaVersion: 1;
  mode: V2RuntimeMode;
  worker: V2WorkerId;
  stage: string;
  status: V2WorkerTruthStatus;
  timestamp: string;
  processId?: string | number | null;
  logId?: string | null;
  message?: string | null;
  counts?: Record<string, number>;
  error?: string | null;
  sourceFile?: string;
  sourceLine?: number;
}

export interface V2WorkerTruthPayload {
  schemaVersion: 1;
  mode: V2RuntimeMode;
  status: 'ok' | 'warning';
  events: V2WorkerTruthEvent[];
  files: Array<{
    worker: V2WorkerId;
    path: string;
    exists: boolean;
    parsedCount: number;
    malformedCount: number;
  }>;
  malformed: Array<{ path: string; line: number; error: string; raw: string }>;
  readAt: string;
}

export type V2WorkerTruthResponse = ApiResponseWithMeta<V2WorkerTruthPayload>;

export function readV2WorkerTruth(mode: V2RuntimeMode): Promise<V2WorkerTruthResponse> {
  const normalizedMode = mode === 'real' ? 'real' : 'test';
  return requestJson(`/api/v2/worker-truth?mode=${encodeURIComponent(normalizedMode)}`, {
    method: 'GET',
    captureMeta: true,
  }) as Promise<V2WorkerTruthResponse>;
}
