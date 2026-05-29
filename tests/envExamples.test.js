/*
 * Guards real and test environment example path separation.
 * The tests prevent example credentials and runtime/log folders from drifting
 * back into shared root-level locations. The app now uses .env as the
 * only checked-in runtime env source; test.example.env remains a template only.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function parseEnvFile(filePath) {
  /**
   * Parses simple KEY=value env files into a lookup map.
   * Comments and blank lines are ignored because these tests only verify
   * concrete example configuration values.
   */
  const env = new Map();
  const text = readFileSync(filePath, 'utf8');

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    env.set(trimmed.slice(0, separatorIndex), trimmed.slice(separatorIndex + 1));
  }

  return env;
}

function assertTestEnvValues(env) {
  /**
   * Verifies the reusable test env shape without duplicating assertions for
   * the redacted test.example.env template.
   */

  assert.equal(env.get('user'), '');
  assert.equal(env.get('pw'), '');
  assert.equal(env.get('DOWNLOAD_DIR'), 'test_runtime_data/downloads');
  assert.equal(env.get('DB_PATH'), 'test_runtime_data/test_photo_frame.sqlite');
  assert.equal(env.get('TEST_DB_PATH'), 'test_runtime_data/test_photo_frame.sqlite');
  assert.equal(env.get('LOG_DIR'), 'test_runtime_data/logs');
  assert.equal(env.get('FULL_LOG'), 'test_runtime_data/logs/full_log.log');
  assert.equal(env.get('ICLOUDPD_COOKIE_DIR'), 'test_runtime_data/icloudpd_cookies');
  assert.equal(env.get('ICLOUDPD_RAW_STDIO_LOG_PATH'), 'test_runtime_data/private_logs/icloudpd_raw_stdio.log');
}

test('test.example.env keeps credentials empty and test paths isolated', () => {
  assertTestEnvValues(parseEnvFile('test.example.env'));
});

function listTrackedFile(filePath) {
  /**
   * Reads Git's tracked-file index so local untracked runtime files do not
   * make the checked-in env-source guard fail on operator machines.
   */
  return execFileSync('git', ['ls-files', '--', filePath], { encoding: 'utf8' }).trim();
}

test('test.env is not a checked-in runtime env source', () => {
  /**
   * Keeps local operators on a single .env file. Temporary test harness env
   * files may still exist locally, but must not be tracked as repo sources.
   */
  assert.equal(listTrackedFile('test.env'), '');
});

test('example.env keeps real log paths inside runtime_data logs', () => {
  const env = parseEnvFile('example.env');

  assert.equal(env.get('DOWNLOAD_DIR'), 'runtime_data/downloads');
  assert.equal(env.get('DB_PATH'), 'runtime_data/photo_frame.sqlite');
  assert.equal(env.get('LOG_DIR'), 'runtime_data/logs');
  assert.equal(env.get('FULL_LOG'), 'runtime_data/logs/full_log.log');
  assert.equal(env.get('TEST_DB_PATH'), 'test_runtime_data/test_photo_frame.sqlite');
  assert.equal(env.get('TEST_DOWNLOAD_DIR'), 'test_runtime_data/downloads');
  assert.equal(env.get('TEST_LOG_DIR'), 'test_runtime_data/logs');
  assert.equal(env.get('TEST_FULL_LOG'), 'test_runtime_data/logs/full_log.log');
});
