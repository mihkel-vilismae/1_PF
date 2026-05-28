/*
 * Verifies fullscreen playback view models expose activity-monitoring state.
 * The checks keep Goal 3 state separate from direct View B UI coupling.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { buildOsPlaybackViewModel, OS_PLAYBACK_PLATFORMS } from '../dashboard/services/osPlaybackViewModel.ts';

test('OS playback view model exposes default activity monitoring state', () => {
  const viewModel = buildOsPlaybackViewModel(createInitialState(), OS_PLAYBACK_PLATFORMS.windows);

  assert.equal(viewModel.activity.monitoring, false);
  assert.deepEqual(viewModel.activity.selectedLabels, ['PIR sensor', 'Mouse movement', 'Keyboard activity']);
  assert.deepEqual(viewModel.activity.unavailableLabels, ['PIR sensor']);
  assert.match(viewModel.activity.keepAwakeLabel, /inactive/);
});

test('OS playback view model reports captured fullscreen activity state', () => {
  const state = createInitialState();
  state.osPlaybackActivity.windows = {
    ...state.osPlaybackActivity.windows,
    monitoring: true,
    lastActivitySource: 'mouse',
    lastActivityAtIso: '2026-05-28T08:00:00.000Z',
    keepAwakeUntilIso: '2026-05-28T08:00:30.000Z',
    statusMessage: 'Mouse movement detected; fullscreen keep-awake window extended.',
  };

  const viewModel = buildOsPlaybackViewModel(state, OS_PLAYBACK_PLATFORMS.windows);

  assert.equal(viewModel.activity.monitoring, true);
  assert.match(viewModel.activity.lastActivityLabel, /Mouse movement/);
  assert.match(viewModel.activity.keepAwakeLabel, /Keep-awake window until/);
});
