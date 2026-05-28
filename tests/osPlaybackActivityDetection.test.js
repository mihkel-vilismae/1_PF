/*
 * Verifies the OS playback activity adapter reuses the proven View B/B5 source model.
 * The adapter must stay honest about PIR until a verified backend source exists.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyOsPlaybackActivityEvent,
  createDefaultOsPlaybackActivityState,
  getOsPlaybackActivitySourceLabel,
  normalizeOsPlaybackActivityState,
  startOsPlaybackActivityMonitoring,
} from '../dashboard/services/osPlaybackActivityDetection.ts';

test('OS playback activity adapter starts from the View B activity source vocabulary', () => {
  const state = createDefaultOsPlaybackActivityState();

  assert.deepEqual(Object.keys(state.selectedSources), ['pir', 'mouse', 'keyboard']);
  assert.equal(getOsPlaybackActivitySourceLabel('mouse'), 'Mouse movement');
  assert.equal(state.pirAvailability, 'backend_dependent');
});

test('OS playback activity adapter extends keep-awake state for selected browser activity', () => {
  const started = startOsPlaybackActivityMonitoring(createDefaultOsPlaybackActivityState());
  const updated = applyOsPlaybackActivityEvent(started, {
    nowIso: '2026-05-28T08:00:00.000Z',
    source: 'keyboard',
    keepAwakeSeconds: 10,
  });

  assert.equal(updated.monitoring, true);
  assert.equal(updated.lastActivitySource, 'keyboard');
  assert.equal(updated.keepAwakeUntilIso, '2026-05-28T08:00:10.000Z');
  assert.match(updated.statusMessage, /Keyboard activity detected/);
});

test('OS playback activity adapter does not fake unavailable PIR events', () => {
  const started = startOsPlaybackActivityMonitoring(createDefaultOsPlaybackActivityState());
  const updated = applyOsPlaybackActivityEvent(started, {
    nowIso: '2026-05-28T08:00:00.000Z',
    source: 'pir',
  });

  assert.equal(updated.lastActivitySource, null);
  assert.equal(updated.keepAwakeUntilIso, null);
  assert.match(updated.statusMessage, /PIR activity is unavailable/);
});

test('OS playback activity adapter normalizes missing selected-source fields', () => {
  const normalized = normalizeOsPlaybackActivityState({ selectedSources: { mouse: false } });

  assert.equal(normalized.selectedSources.pir, true);
  assert.equal(normalized.selectedSources.mouse, false);
  assert.equal(normalized.selectedSources.keyboard, true);
});
