import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('regular scheduler CLI can write instrumentation without reading missing env file', async () => {
  const logDir = await mkdtemp(path.join(os.tmpdir(), 'scheduler-cli-log-'));
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, ['--import', 'tsx', 'server/index.ts', '--scheduler', 'regular-stage-worker'], {
      cwd: process.cwd(),
      env: { ...process.env, INIT_ENV_FILE: '/tmp/pf-missing-env-file-for-regular-worker.env', LOG_DIR: logDir },
      timeout: 20000,
    });
    assert.match(stdout, /regular_stage_worker/);
    assert.doesNotMatch(`${stdout}\n${stderr}`, /Cannot access 'HttpError' before initialization/);
  } finally {
    await rm(logDir, { recursive: true, force: true });
  }
});

test('playback scheduler CLI env failure no longer triggers HttpError TDZ ReferenceError', async () => {
  const logDir = await mkdtemp(path.join(os.tmpdir(), 'scheduler-cli-playback-log-'));
  try {
    await assert.rejects(
      execFileAsync(process.execPath, ['--import', 'tsx', 'server/index.ts', '--scheduler', 'playback-worker'], {
        cwd: process.cwd(),
        env: { ...process.env, INIT_ENV_FILE: '/tmp/pf-missing-env-file-for-playback-worker.env', LOG_DIR: logDir },
        timeout: 20000,
      }),
      (error) => {
        const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
        assert.doesNotMatch(combined, /Cannot access 'HttpError' before initialization/);
        assert.match(combined, /env_file_read_failed|Failed to read the configured env file/);
        return true;
      },
    );
  } finally {
    await rm(logDir, { recursive: true, force: true });
  }
});
