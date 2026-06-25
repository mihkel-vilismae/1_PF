/*
 * Guards the dashboard DOM-stability fix: browser mouse/keyboard activity must not
 * notify runtime-truth subscribers unless fullscreen playback monitoring can consume it.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  getState,
  markOsPlaybackActivityDetected,
  startOsPlaybackActivityMonitoring,
  stopOsPlaybackActivityMonitoring,
  subscribe,
} from '../dashboard/services/runtimeTruth.ts';

const appSource = readFileSync('dashboard/app.ts', 'utf8');

function countSubscriberEmitsWhile(callback) {
  let emitCount = 0;
  const unsubscribe = subscribe(() => {
    emitCount += 1;
  });
  try {
    callback();
  } finally {
    unsubscribe();
  }
  return emitCount;
}

test('mouse activity with no active OS playback monitoring does not notify subscribers', () => {
  stopOsPlaybackActivityMonitoring('windows');
  stopOsPlaybackActivityMonitoring('raspberry');

  const emitCount = countSubscriberEmitsWhile(() => {
    markOsPlaybackActivityDetected('mouse');
  });

  assert.equal(emitCount, 0);
});

test('keyboard activity with no active OS playback monitoring does not notify subscribers', () => {
  stopOsPlaybackActivityMonitoring('windows');
  stopOsPlaybackActivityMonitoring('raspberry');

  const emitCount = countSubscriberEmitsWhile(() => {
    markOsPlaybackActivityDetected('keyboard');
  });

  assert.equal(emitCount, 0);
});

test('keyboard activity while monitoring is active still updates keep-awake state', () => {
  stopOsPlaybackActivityMonitoring('windows');
  startOsPlaybackActivityMonitoring('raspberry');

  const emitCount = countSubscriberEmitsWhile(() => {
    markOsPlaybackActivityDetected('keyboard');
  });

  const activity = getState().osPlaybackActivity.raspberry;
  assert.ok(emitCount >= 1);
  assert.equal(activity.lastActivitySource, 'keyboard');
  assert.equal(typeof activity.keepAwakeUntilIso, 'string');
  assert.match(getState().runningProcess.screenWorker.summary, /keep-awake/);

  stopOsPlaybackActivityMonitoring('raspberry');
});

test('dashboard app still wires browser mouse and keyboard events to OS playback activity monitoring', () => {
  assert.match(appSource, /document\.addEventListener\('mousemove', handleB5ActivityMouseMove\)/);
  assert.match(appSource, /document\.addEventListener\('keydown', handleB5ActivityKeyDown\)/);
  assert.match(appSource, /markOsPlaybackActivityDetected\('mouse'\)/);
  assert.match(appSource, /markOsPlaybackActivityDetected\('keyboard'\)/);
});
