/*
 * Verifies OS playback views display fullscreen activity monitoring state.
 * Rendering stays informational until runtime wiring starts monitoring on fullscreen entry.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { OS_PLAYBACK_PLATFORMS } from '../dashboard/services/osPlaybackViewModel.ts';
import { renderOsPlaybackFullscreenOverlay, renderOsPlaybackView } from '../dashboard/views/osPlaybackView.ts';

test('OS playback view renders wake keep-on activity panel', () => {
  const markup = renderOsPlaybackView(createInitialState(), OS_PLAYBACK_PLATFORMS.windows);

  assert.match(markup, /Wake \/ keep-on activity/);
  assert.match(markup, /data-os-playback-activity-panel="windows"/);
  assert.match(markup, /PIR sensor, Mouse movement, Keyboard activity/);
  assert.match(markup, /Unavailable source: PIR sensor/);
});

test('fullscreen overlay renders activity status in HUD', () => {
  const state = createInitialState();
  state.osPlaybackRotation = { windows: { fullscreen: true } };
  state.osPlaybackActivity.windows = {
    ...state.osPlaybackActivity.windows,
    monitoring: true,
    keepAwakeUntilIso: '2026-05-28T08:00:30.000Z',
    statusMessage: 'Mouse movement detected; fullscreen keep-awake window extended.',
  };

  const markup = renderOsPlaybackFullscreenOverlay(state);

  assert.match(markup, /Mouse movement detected; fullscreen keep-awake window extended/);
  assert.match(markup, /Keep-awake window until/);
});
