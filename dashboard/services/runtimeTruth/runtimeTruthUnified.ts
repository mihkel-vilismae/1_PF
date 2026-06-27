import { requestJson } from '../apiClient.ts';

export type UnifiedWorkerMode = 'test' | 'real';
export type UnifiedWorkerStatus = 'started' | 'finished' | 'error' | 'interrupted' | 'state';

export interface UnifiedWorkerEvent {
  schemaVersion: 1;
  mode: UnifiedWorkerMode;
  worker: 'regular-worker' | 'playback-worker' | 'screen-worker';
  stage: string;
  status: UnifiedWorkerStatus;
  timestamp: string;
  processId?: string | number | null;
  logId?: string | null;
  message?: string | null;
  counts?: Record<string, number>;
  error?: string | null;
  sourceFile?: string;
  sourceLine?: number;
}

export interface UnifiedWorkerTruthResponse {
  schemaVersion: 1;
  mode: UnifiedWorkerMode;
  status: 'ok' | 'warning';
  events: UnifiedWorkerEvent[];
  files: Array<{
    worker: string;
    path: string;
    exists: boolean;
    parsedCount: number;
    malformedCount: number;
  }>;
  malformed: Array<{ path: string; line: number; error: string; raw: string }>;
  readAt: string;
}

export function normalizeUnifiedWorkerMode(value: unknown): UnifiedWorkerMode {
  return value === 'real' ? 'real' : 'test';
}

/**
 * Reads the server-owned combined worker source-of-truth.  The browser never
 * reads worker files directly; this API is the only frontend path to the three
 * TEST/REAL worker truth files.
 */
export async function getUnifiedWorkerEvents(mode: UnifiedWorkerMode): Promise<UnifiedWorkerTruthResponse> {
  return requestJson(`/api/v2/worker-truth?mode=${encodeURIComponent(mode)}`) as Promise<UnifiedWorkerTruthResponse>;
}

/**
 * Appends a normalized worker event through the backend.  This is useful for
 * controlled tests and future worker adapters, but production workers should
 * prefer server-side writers when possible.
 */
export async function appendUnifiedWorkerEvent(mode: UnifiedWorkerMode, event: Partial<UnifiedWorkerEvent>): Promise<unknown> {
  return requestJson('/api/v2/worker-truth/event', {
    method: 'POST',
    body: { mode, event },
  });
}
