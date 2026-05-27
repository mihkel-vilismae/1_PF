/*
 * Resolves dashboard Test Mode versus Real Mode environment boundaries.
 * Test Mode maps runtime, database, log, and auth-adjacent paths into
 * test_runtime_data so mock/test actions cannot touch real runtime storage.
 */
import path from 'node:path';

export type DashboardRuntimeMode = 'real' | 'test';

export type RuntimeModeEnvValues = {
  [key: string]: string | undefined;
};

export const DASHBOARD_RUNTIME_MODE_HEADER = 'X-Dashboard-Runtime-Mode';

const TEST_RUNTIME_ROOT = 'test_runtime_data';
const DEFAULT_TEST_DOWNLOAD_DIR = `${TEST_RUNTIME_ROOT}/downloads`;
const DEFAULT_TEST_DB_PATH = `${TEST_RUNTIME_ROOT}/test_photo_frame.sqlite`;
const DEFAULT_TEST_LOG_DIR = `${TEST_RUNTIME_ROOT}/logs`;
const DEFAULT_TEST_COOKIE_DIR = `${TEST_RUNTIME_ROOT}/icloudpd_cookies`;
const DEFAULT_TEST_RAW_STDIO_LOG_PATH = `${TEST_RUNTIME_ROOT}/private_logs/icloudpd_raw_stdio.log`;

// Converts loosely supplied mode text into the only two supported runtime modes.
export function normalizeDashboardRuntimeMode(value: unknown): DashboardRuntimeMode {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'test' ? 'test' : 'real';
}

// Applies mode-specific environment overrides while leaving Real Mode unchanged.
export function applyDashboardRuntimeModeToEnvValues(
  envValues: RuntimeModeEnvValues,
  mode: DashboardRuntimeMode,
): RuntimeModeEnvValues {
  if (mode !== 'test') {
    return {
      ...envValues,
      RUNTIME_MODE: 'real',
    };
  }

  const testLogDir = chooseSafeTestRuntimePath(envValues.TEST_LOG_DIR, DEFAULT_TEST_LOG_DIR);
  const testDbPath = chooseSafeTestDatabasePath(envValues.TEST_DB_PATH, DEFAULT_TEST_DB_PATH);

  return {
    ...envValues,
    RUNTIME_MODE: 'test',
    DOWNLOAD_DIR: chooseSafeTestRuntimePath(envValues.TEST_DOWNLOAD_DIR, DEFAULT_TEST_DOWNLOAD_DIR),
    DB_PATH: testDbPath,
    TEST_DB_PATH: testDbPath,
    LOG_DIR: testLogDir,
    TEST_LOG_DIR: testLogDir,
    FULL_LOG: chooseSafeTestRuntimePath(envValues.TEST_FULL_LOG, `${testLogDir}/full_log.log`),
    TEST_FULL_LOG: chooseSafeTestRuntimePath(envValues.TEST_FULL_LOG, `${testLogDir}/full_log.log`),
    ICLOUDPD_COOKIE_DIR: chooseSafeTestRuntimePath(envValues.TEST_ICLOUDPD_COOKIE_DIR, DEFAULT_TEST_COOKIE_DIR),
    ICLOUDPD_RAW_STDIO_LOG_PATH: chooseSafeTestRuntimePath(
      envValues.TEST_ICLOUDPD_RAW_STDIO_LOG_PATH,
      DEFAULT_TEST_RAW_STDIO_LOG_PATH,
    ),
  };
}

// Selects a test runtime path only when it remains inside test_runtime_data.
export function chooseSafeTestRuntimePath(candidate: unknown, fallback: string): string {
  const value = typeof candidate === 'string' ? candidate.trim() : '';
  if (!value) {
    return fallback;
  }
  return isInsideTestRuntimeRoot(value) ? value : fallback;
}

// Selects a test database path only when it is isolated and prefixed with test_.
export function chooseSafeTestDatabasePath(candidate: unknown, fallback: string): string {
  const runtimePath = chooseSafeTestRuntimePath(candidate, fallback);
  const databaseName = path.basename(runtimePath);
  return databaseName.startsWith('test_') ? runtimePath : fallback;
}

// Checks relative or absolute paths without accepting sibling-prefix overlaps.
export function isInsideTestRuntimeRoot(candidate: string): boolean {
  const normalized = path.normalize(candidate).replace(/\\/g, '/');
  const root = path.normalize(TEST_RUNTIME_ROOT).replace(/\\/g, '/');
  if (path.isAbsolute(normalized)) {
    return normalized.split('/').includes(TEST_RUNTIME_ROOT);
  }
  return normalized === root || normalized.startsWith(`${root}/`);
}
