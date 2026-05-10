/*
 * Verifies scheduler command wiring for the Slice 3 playback_worker entrypoint.
 * The tests keep Windows CronEmulator and Raspberry cron rows aligned without editing nested tools.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyPlaybackWorkerCronRow,
  PLAYBACK_WORKER_NPM_COMMAND,
  RASPBERRY_PLAYBACK_WORKER_CRON_ROW,
  WINDOWS_CRON_EMULATOR_PLAYBACK_WORKER_CRON_ROW,
} from '../shared/schedulerWorkerCommands.ts';
import { SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderInitView } from '../dashboard/views/initView.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('shared playback worker command points at the Slice 3 backend scheduler entrypoint', () => {
  assert.equal(PLAYBACK_WORKER_NPM_COMMAND, 'npm run api -- --scheduler playback-worker');
  assert.equal(RASPBERRY_PLAYBACK_WORKER_CRON_ROW.includes(PLAYBACK_WORKER_NPM_COMMAND), true);
  assert.equal(WINDOWS_CRON_EMULATOR_PLAYBACK_WORKER_CRON_ROW.includes(PLAYBACK_WORKER_NPM_COMMAND), true);
});

test('Windows CronEmulator default install crontab no longer uses playback_worker placeholder', () => {
  assert.equal(SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB.includes('/path/to/playback_worker'), false);
  assert.equal(SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB.includes(PLAYBACK_WORKER_NPM_COMMAND), true);
  assert.equal(SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB.includes(WINDOWS_CRON_EMULATOR_PLAYBACK_WORKER_CRON_ROW), true);
});

test('View A install crontab textarea exposes the real playback-worker npm command', () => {
  const html = renderInitView(createInitialState());

  assert.match(html, /npm run api -- --scheduler playback-worker/);
  assert.doesNotMatch(html, /\/path\/to\/playback_worker/);
});

test('playback worker cron row classification is honest for Windows and Raspberry paths', () => {
  const windows = classifyPlaybackWorkerCronRow(WINDOWS_CRON_EMULATOR_PLAYBACK_WORKER_CRON_ROW);
  const raspberry = classifyPlaybackWorkerCronRow(RASPBERRY_PLAYBACK_WORKER_CRON_ROW);
  const placeholder = classifyPlaybackWorkerCronRow('* * * * * /path/to/playback_worker');

  assert.equal(windows.classification, 'partial');
  assert.equal(windows.reachesPlaybackWorker, true);
  assert.match(windows.reason, /tools\/CronEmulator/);

  assert.equal(raspberry.classification, 'real');
  assert.equal(raspberry.reachesPlaybackWorker, true);

  assert.equal(placeholder.classification, 'placeholder');
  assert.equal(placeholder.reachesPlaybackWorker, false);
});
