/*
 * Verifies Test Mode and Real Mode path isolation for backend env values.
 * The checks protect database, log, and download paths from crossing between
 * runtime_data and test_runtime_data when dashboard mode changes.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyDashboardRuntimeModeToEnvValues,
  chooseSafeTestDatabasePath,
  normalizeDashboardRuntimeMode,
} from '../server/runtimeModeEnv.ts';

test('real mode leaves configured database and runtime paths unchanged', () => {
  /**
   * Guards the existing production behavior: the backend must keep using
   * DB_PATH, DOWNLOAD_DIR, LOG_DIR, and FULL_LOG exactly as configured when
   * the dashboard is in Real Mode or no mode header is provided.
   */
  const env = {
    DB_PATH: 'runtime_data/photo_frame.sqlite',
    DOWNLOAD_DIR: 'runtime_data/downloads',
    LOG_DIR: 'runtime_data/logs',
    FULL_LOG: 'runtime_data/logs/full_log.log',
    TEST_DB_PATH: 'test_runtime_data/test_photo_frame.sqlite',
  };

  assert.deepEqual(applyDashboardRuntimeModeToEnvValues(env, 'real'), {
    ...env,
    RUNTIME_MODE: 'real',
  });
});

test('test mode forces database actions into isolated test_runtime_data paths', () => {
  /**
   * Verifies the core Test Mode contract: even if an old .env contains the
   * legacy runtime_data/test path, test actions must use test_runtime_data and
   * a test_ prefixed SQLite filename.
   */
  const env = {
    DB_PATH: 'runtime_data/photo_frame.sqlite',
    DOWNLOAD_DIR: 'runtime_data/downloads',
    LOG_DIR: 'runtime_data/logs',
    FULL_LOG: 'runtime_data/logs/full_log.log',
    TEST_DB_PATH: 'runtime_data/test/photo_frame_test.sqlite',
  };

  const resolved = applyDashboardRuntimeModeToEnvValues(env, 'test');

  assert.equal(resolved.RUNTIME_MODE, 'test');
  assert.equal(resolved.DB_PATH, 'test_runtime_data/test_photo_frame.sqlite');
  assert.equal(resolved.TEST_DB_PATH, 'test_runtime_data/test_photo_frame.sqlite');
  assert.equal(resolved.DOWNLOAD_DIR, 'test_runtime_data/downloads');
  assert.equal(resolved.LOG_DIR, 'test_runtime_data/logs');
  assert.equal(resolved.FULL_LOG, 'test_runtime_data/logs/full_log.log');
  assert.equal(resolved.ICLOUDPD_COOKIE_DIR, 'test_runtime_data/icloudpd_cookies');
});

test('test mode accepts explicit safe test database override with test_ prefix', () => {
  /**
   * Allows future local test database names while keeping the required
   * test_runtime_data boundary and test_ filename prefix.
   */
  assert.equal(
    chooseSafeTestDatabasePath('test_runtime_data/test_alt_photo_frame.sqlite', 'test_runtime_data/test_photo_frame.sqlite'),
    'test_runtime_data/test_alt_photo_frame.sqlite',
  );
  assert.equal(
    chooseSafeTestDatabasePath('test_runtime_data/photo_frame.sqlite', 'test_runtime_data/test_photo_frame.sqlite'),
    'test_runtime_data/test_photo_frame.sqlite',
  );
});

test('runtime mode parsing defaults to real unless test is explicit', () => {
  /**
   * Keeps mode routing conservative: absent or unknown request mode markers
   * cannot accidentally move real backend actions onto test storage.
   */
  assert.equal(normalizeDashboardRuntimeMode('test'), 'test');
  assert.equal(normalizeDashboardRuntimeMode('TEST'), 'test');
  assert.equal(normalizeDashboardRuntimeMode('real'), 'real');
  assert.equal(normalizeDashboardRuntimeMode(undefined), 'real');
  assert.equal(normalizeDashboardRuntimeMode('mock'), 'real');
});
