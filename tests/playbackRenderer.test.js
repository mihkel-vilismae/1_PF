/*
 * Verifies the B4 playback rendering contract before UI and worker slices consume it.
 * The tests keep preview and fullscreen tied to one renderer abstraction.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PLAYBACK_RENDERING_LIBRARY,
  PLAYBACK_RENDERING_MODES,
  PLAYBACK_RENDERING_PLATFORMS,
  buildPlaybackRenderingOptions,
  createDefaultPlaybackRenderingState,
  getSharedPlaybackRendererId,
  normalizePlaybackRenderingState,
} from '../dashboard/services/playbackRenderer.ts';

test('B4 rendering defaults to playback without rendering on Windows', () => {
  assert.deepEqual(createDefaultPlaybackRenderingState(), {
    mode: PLAYBACK_RENDERING_MODES.withoutRendering,
    platform: PLAYBACK_RENDERING_PLATFORMS.windows,
  });
});

test('B4 preview and fullscreen modes share the same renderer abstraction', () => {
  assert.equal(getSharedPlaybackRendererId(PLAYBACK_RENDERING_MODES.previewWindow), PLAYBACK_RENDERING_LIBRARY.id);
  assert.equal(getSharedPlaybackRendererId(PLAYBACK_RENDERING_MODES.fullscreen), PLAYBACK_RENDERING_LIBRARY.id);
  assert.equal(getSharedPlaybackRendererId(PLAYBACK_RENDERING_MODES.withoutRendering), null);
});

test('B4 rendering options disable preview and fullscreen until playback is ready', () => {
  const disabledOptions = buildPlaybackRenderingOptions(false);
  assert.equal(disabledOptions.find((option) => option.value === PLAYBACK_RENDERING_MODES.withoutRendering)?.enabled, true);
  assert.equal(disabledOptions.find((option) => option.value === PLAYBACK_RENDERING_MODES.previewWindow)?.enabled, false);
  assert.equal(disabledOptions.find((option) => option.value === PLAYBACK_RENDERING_MODES.fullscreen)?.enabled, false);

  const enabledOptions = buildPlaybackRenderingOptions(true);
  assert.equal(enabledOptions.find((option) => option.value === PLAYBACK_RENDERING_MODES.previewWindow)?.enabled, true);
  assert.equal(enabledOptions.find((option) => option.value === PLAYBACK_RENDERING_MODES.fullscreen)?.enabled, true);
});

test('B4 rendering state normalizes unknown persisted values', () => {
  assert.deepEqual(
    normalizePlaybackRenderingState({ mode: 'unknown', platform: 'unknown' }),
    createDefaultPlaybackRenderingState(),
  );
  assert.deepEqual(
    normalizePlaybackRenderingState({
      mode: PLAYBACK_RENDERING_MODES.fullscreen,
      platform: PLAYBACK_RENDERING_PLATFORMS.raspberryOs,
    }),
    {
      mode: PLAYBACK_RENDERING_MODES.fullscreen,
      platform: PLAYBACK_RENDERING_PLATFORMS.raspberryOs,
    },
  );
});
