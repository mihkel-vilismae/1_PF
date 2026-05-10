/*
 * Verifies scheduler command wiring for the three worker entrypoints.
 * The tests keep Windows CronEmulator and Raspberry cron rows aligned with checked-in entrypoints.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  classifyPlaybackWorkerCronRow,
  PLAYBACK_WORKER_NPM_COMMAND,
  POWERSHELL_ENTRYPOINT_PREFIX,
  RASPBERRY_PLAYBACK_WORKER_CRON_ROW,
  RASPBERRY_REGULAR_STAGE_WORKER_CRON_ROW,
  RASPBERRY_SCREEN_ON_OFF_WORKER_CRON_ROW,
  WINDOWS_CRON_EMULATOR_ENTRYPOINTS,
  WINDOWS_CRON_EMULATOR_PLAYBACK_WORKER_CRON_ROW,
  WINDOWS_CRON_EMULATOR_REGULAR_STAGE_WORKER_CRON_ROW,
  WINDOWS_CRON_EMULATOR_SCREEN_ON_OFF_WORKER_CRON_ROW,
} from '../shared/schedulerWorkerCommands.ts';
import { SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderInitView } from '../dashboard/views/initView.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('shared worker commands preserve the three Raspberry worker rows', () => {
  assert.equal(PLAYBACK_WORKER_NPM_COMMAND, 'npm run api -- --scheduler playback-worker');
  assert.match(RASPBERRY_REGULAR_STAGE_WORKER_CRON_ROW, /regular-stage-worker/);
  assert.equal(RASPBERRY_PLAYBACK_WORKER_CRON_ROW.includes(PLAYBACK_WORKER_NPM_COMMAND), true);
  assert.match(RASPBERRY_SCREEN_ON_OFF_WORKER_CRON_ROW, /screen-on-off-worker/);
});

test('Windows CronEmulator default install crontab calls the three checked-in entrypoint files', () => {
  for (const placeholder of ['/path/to/regular_stage_worker', '/path/to/playback_worker', '/path/to/screen_on_off_worker']) {
    assert.equal(SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB.includes(placeholder), false);
  }
  for (const row of [
    WINDOWS_CRON_EMULATOR_REGULAR_STAGE_WORKER_CRON_ROW,
    WINDOWS_CRON_EMULATOR_PLAYBACK_WORKER_CRON_ROW,
    WINDOWS_CRON_EMULATOR_SCREEN_ON_OFF_WORKER_CRON_ROW,
  ]) {
    assert.equal(row.includes(POWERSHELL_ENTRYPOINT_PREFIX), true);
    assert.equal(SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB.includes(row), true);
  }
});

test('Windows CronEmulator entrypoint files exist and preserve worker boundaries', () => {
  const entrypointRoot = path.join(process.cwd(), 'tools', 'CronEmulator', 'entrypoints');
  const regular = readFileSync(path.join(entrypointRoot, 'regular_stage_worker.ps1'), 'utf8');
  const playback = readFileSync(path.join(entrypointRoot, 'playback_worker.ps1'), 'utf8');
  const screen = readFileSync(path.join(entrypointRoot, 'screen_on_off_worker.ps1'), 'utf8');

  for (const relativePath of Object.values(WINDOWS_CRON_EMULATOR_ENTRYPOINTS)) {
    assert.equal(existsSync(path.join('tools', 'CronEmulator', ...relativePath.split('\\'))), true);
  }
  assert.match(regular, /api\/runtime\/download\/run/);
  assert.match(regular, /api\/runtime\/queue\/prepare/);
  assert.doesNotMatch(regular, /playback\/select-current/);
  assert.match(playback, /--scheduler playback-worker/);
  assert.match(screen, /api\/runtime\/screen-simulation\/configure/);
});

test('View A install crontab textarea exposes the three entrypoint workers', () => {
  const html = renderInitView(createInitialState());

  assert.match(html, /regular_stage_worker\.ps1/);
  assert.match(html, /playback_worker\.ps1/);
  assert.match(html, /screen_on_off_worker\.ps1/);
  assert.doesNotMatch(html, /\/path\/to\/playback_worker/);
});

test('playback worker cron row classification is honest for Windows and Raspberry paths', () => {
  const windows = classifyPlaybackWorkerCronRow(WINDOWS_CRON_EMULATOR_PLAYBACK_WORKER_CRON_ROW);
  const raspberry = classifyPlaybackWorkerCronRow(RASPBERRY_PLAYBACK_WORKER_CRON_ROW);
  const placeholder = classifyPlaybackWorkerCronRow('* * * * * /path/to/playback_worker');

  assert.equal(windows.classification, 'partial');
  assert.equal(windows.reachesPlaybackWorker, true);
  assert.match(windows.reason, /CronEmulator/);

  assert.equal(raspberry.classification, 'real');
  assert.equal(raspberry.reachesPlaybackWorker, true);

  assert.equal(placeholder.classification, 'placeholder');
  assert.equal(placeholder.reachesPlaybackWorker, false);
});
