/*
 * Read-only runtime status projection contract shared by View D and Debug.
 * It normalizes current state/backend projection data without starting workers,
 * stopping workers, mutating crontab, or claiming Raspberry hardware proof.
 */

export type RuntimeProjectionWorkerKey = 'regular' | 'playback' | 'screen';

export type RuntimeProjectionWorker = {
  key: RuntimeProjectionWorkerKey;
  label: string;
  status: string;
  heartbeat: string;
  summary: string;
  evidence: string;
};

export type RuntimeStatusProjection = {
  version: 1;
  source: 'state-derived' | 'backend-live-projection';
  projectionStatus: 'inactive' | 'active' | 'error' | 'unknown';
  readOnly: true;
  mutationAllowed: false;
  nonClaim: string;
  workers: Record<RuntimeProjectionWorkerKey, RuntimeProjectionWorker>;
};

const NON_CLAIM = 'Read-only projection only: does not start/stop workers, mutate crontab, write production media/database, or prove Raspberry hardware.';

const WORKER_LABELS: Record<RuntimeProjectionWorkerKey, string> = {
  regular: 'Regular worker',
  playback: 'Playback worker',
  screen: 'Screen on-off worker',
};

export function buildRuntimeStatusProjectionFromState(state: Record<string, unknown>): RuntimeStatusProjection {
  const runningProcess = asRecord(state.runningProcess);
  const truth = asRecord(state.truth);
  const statusByKey = asRecord(state.statusByKey);
  const active = truth.realRunActive === true;
  const playbackWorker = asRecord(runningProcess.playbackWorker);
  const screenWorker = asRecord(runningProcess.screenWorker);
  return {
    version: 1,
    source: 'state-derived',
    projectionStatus: active ? 'active' : 'inactive',
    readOnly: true,
    mutationAllowed: false,
    nonClaim: NON_CLAIM,
    workers: {
      regular: buildWorker('regular', String(statusByKey.D1 ?? 'disabled'), 'N/A', active ? 'Runtime truth reports the pipeline worker as active.' : 'Runtime truth reports no active pipeline worker.', 'state.statusByKey.D1'),
      playback: buildWorker('playback', String(playbackWorker.status ?? statusByKey.D2 ?? 'Inactive'), String(playbackWorker.heartbeat ?? 'N/A'), String(playbackWorker.summary ?? 'No playback activity'), 'state.runningProcess.playbackWorker'),
      screen: buildWorker('screen', String(screenWorker.status ?? statusByKey.D3 ?? 'Inactive'), String(screenWorker.heartbeat ?? 'N/A'), String(screenWorker.summary ?? 'No screen activity'), 'state.runningProcess.screenWorker'),
    },
  };
}

export function buildRuntimeStatusProjectionFromBackendPayload(payload: unknown): RuntimeStatusProjection {
  const record = asRecord(payload);
  const projection = asRecord(record.projection);
  const workerHealth = asRecord(projection.workerHealth);
  const playback = asRecord(projection.playback);
  const screen = asRecord(projection.screen);
  const hasProjection = Object.keys(projection).length > 0;
  return {
    version: 1,
    source: 'backend-live-projection',
    projectionStatus: hasProjection ? 'active' : 'inactive',
    readOnly: true,
    mutationAllowed: false,
    nonClaim: NON_CLAIM,
    workers: {
      regular: buildWorker('regular', normalizeHealthStatus(workerHealth['regular-stage-worker']), 'N/A', 'Backend live projection workerHealth.regular-stage-worker.', 'projection.workerHealth.regular-stage-worker'),
      playback: buildWorker('playback', playback.isPlaying?.value === true ? 'Active' : normalizeHealthStatus(workerHealth['playback-worker']), 'N/A', buildPlaybackSummary(playback), 'projection.playback + workerHealth.playback-worker'),
      screen: buildWorker('screen', screen.previewAvailable?.value || screen.fullscreenAvailable?.value ? 'Active' : normalizeHealthStatus(workerHealth['screen-on-off-worker']), 'N/A', buildScreenSummary(screen), 'projection.screen + workerHealth.screen-on-off-worker'),
    },
  };
}

export function projectionHasRuntimeSuccessClaim(projection: RuntimeStatusProjection): boolean {
  return projection.mutationAllowed === false && projection.readOnly === true && projection.nonClaim.includes('does not start/stop workers');
}

function buildWorker(key: RuntimeProjectionWorkerKey, status: string, heartbeat: string, summary: string, evidence: string): RuntimeProjectionWorker {
  return { key, label: WORKER_LABELS[key], status, heartbeat, summary, evidence };
}

function normalizeHealthStatus(value: unknown): string {
  const record = asRecord(value);
  const raw = String(asRecord(record.value).status ?? 'Inactive').toLowerCase();
  if (raw === 'running') return 'Running';
  if (raw === 'idle') return 'Idle';
  if (raw === 'completed') return 'Completed';
  if (raw === 'error' || raw === 'failed') return 'Error';
  if (!raw || raw === 'unknown') return 'Inactive';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function buildPlaybackSummary(playback: Record<string, unknown>): string {
  const queueSize = asRecord(playback.queueSize).value;
  if (typeof queueSize === 'number') return `${queueSize} items in queue`;
  return 'Playback projection available without queue-size claim.';
}

function buildScreenSummary(screen: Record<string, unknown>): string {
  const preview = asRecord(screen.previewAvailable).value === true;
  const fullscreen = asRecord(screen.fullscreenAvailable).value === true;
  return `${preview ? 'Preview available' : 'Preview unavailable'} / ${fullscreen ? 'Fullscreen available' : 'Fullscreen unavailable'}`;
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}
