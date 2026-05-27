/*
 * Guards real and test environment example path separation.
 * The tests prevent example credentials and runtime/log folders from drifting
 * back into shared root-level locations.
 */
import assert from 'node:assert/strict';
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

test('test.example.env keeps credentials empty and test paths isolated', () => {
  const env = parseEnvFile('test.example.env');

  assert.equal(env.get('user'), '');
  assert.equal(env.get('pw'), '');
  assert.equal(env.get('DOWNLOAD_DIR'), 'test_runtime_data/downloads');
  assert.equal(env.get('DB_PATH'), 'test_runtime_data/test_photo_frame.sqlite');
  assert.equal(env.get('TEST_DB_PATH'), 'test_runtime_data/test_photo_frame.sqlite');
  assert.equal(env.get('LOG_DIR'), 'test_runtime_data/logs');
  assert.equal(env.get('FULL_LOG'), 'test_runtime_data/logs/full_log.log');
  assert.equal(env.get('ICLOUDPD_COOKIE_DIR'), 'test_runtime_data/icloudpd_cookies');
  assert.equal(env.get('ICLOUDPD_RAW_STDIO_LOG_PATH'), 'test_runtime_data/private_logs/icloudpd_raw_stdio.log');
});

test('example.env keeps real log paths inside runtime_data logs', () => {
  const env = parseEnvFile('example.env');

  assert.equal(env.get('DOWNLOAD_DIR'), 'runtime_data/downloads');
  assert.equal(env.get('DB_PATH'), 'runtime_data/photo_frame.sqlite');
  assert.equal(env.get('LOG_DIR'), 'runtime_data/logs');
  assert.equal(env.get('FULL_LOG'), 'runtime_data/logs/full_log.log');
});
