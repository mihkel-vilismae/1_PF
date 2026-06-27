/*
 * V2 readiness and runtime-mode service.
 *
 * The V2 Beeline requires three global readiness rings before autonomous
 * real playback can start: .env, database, and iCloudPD login/session.
 * Readiness is tracked per runtime mode so TEST and REAL cannot accidentally
 * share operator state.
 */

export type V2RuntimeMode = 'test' | 'real';
export type V2ReadinessKey = 'env' | 'db' | 'login';
export type V2ReadinessStatus = 'unknown' | 'running' | 'complete' | 'blocked' | 'error';

export type V2ReadinessMatrix = Record<V2RuntimeMode, Record<V2ReadinessKey, V2ReadinessStatus>>;

const readiness: V2ReadinessMatrix = {
  test: { env: 'unknown', db: 'unknown', login: 'unknown' },
  real: { env: 'unknown', db: 'unknown', login: 'unknown' },
};

let currentMode: V2RuntimeMode = 'test';

export function normalizeV2RuntimeMode(value: unknown): V2RuntimeMode {
  return value === 'real' ? 'real' : 'test';
}

export function getCurrentMode(): V2RuntimeMode {
  return currentMode;
}

export function setCurrentMode(mode: V2RuntimeMode): void {
  currentMode = normalizeV2RuntimeMode(mode);
}

export function getReadinessStatus(key: V2ReadinessKey, mode: V2RuntimeMode = currentMode): V2ReadinessStatus {
  return readiness[normalizeV2RuntimeMode(mode)][key] ?? 'unknown';
}

export function setReadinessStatus(
  key: V2ReadinessKey,
  status: V2ReadinessStatus,
  mode: V2RuntimeMode = currentMode,
): void {
  readiness[normalizeV2RuntimeMode(mode)][key] = status;
}

export function getReadinessSnapshot(): V2ReadinessMatrix {
  return {
    test: { ...readiness.test },
    real: { ...readiness.real },
  };
}

export function isModeReadyForAutonomousPlayback(mode: V2RuntimeMode = currentMode): boolean {
  const selected = readiness[normalizeV2RuntimeMode(mode)];
  return selected.env === 'complete' && selected.db === 'complete' && selected.login === 'complete';
}
