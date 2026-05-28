/*
 * Verifies fullscreen playback runtime wiring starts, stops, and marks activity.
 * The tests assert browser activity affects only playback monitoring state, not backend playback APIs.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  getState,
  markOsPlaybackActivityDetected,
  startOsPlaybackActivityMonitoring,
  stopOsPlaybackActivityMonitoring,
} from '../dashboard/services/runtimeTruth.ts';

const appSource = readFileSync('dashboard/app.ts', 'utf8');

test('runtime truth starts and stops fullscreen playback activity monitoring', () => {
  startOsPlaybackActivityMonitoring('windows');
  assert.equal(getState().osPlaybackActivity.windows.monitoring, true);

  stopOsPlaybackActivityMonitoring('windows');
  assert.equal(getState().osPlaybackActivity.windows.monitoring, false);
});

test('runtime truth marks browser activity while fullscreen monitoring is active', () => {
  startOsPlaybackActivityMonitoring('raspberry');
  markOsPlaybackActivityDetected('keyboard');

  const activity = getState().osPlaybackActivity.raspberry;
  assert.equal(activity.lastActivitySource, 'keyboard');
  assert.equal(typeof activity.keepAwakeUntilIso, 'string');
  assert.match(getState().runningProcess.screenWorker.summary, /keep-awake/);

  stopOsPlaybackActivityMonitoring('raspberry');
});

test('app wires browser mouse and keyboard events to fullscreen playback activity monitoring', () => {
  assert.match(appSource, /markOsPlaybackActivityDetected\('mouse'\)/);
  assert.match(appSource, /markOsPlaybackActivityDetected\('keyboard'\)/);
  assert.match(appSource, /startOsPlaybackActivityMonitoring\(platform\)/);
  assert.match(appSource, /stopOsPlaybackActivityMonitoring\(platform\)/);
  assert.doesNotMatch(appSource, /api\/runtime\/playback\/activity|api\/runtime\/playback\/wake/);
});
