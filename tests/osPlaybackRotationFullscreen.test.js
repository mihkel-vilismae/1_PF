/*
 * Guards Goal 1 Slice 3 playback rotation and fullscreen UI behavior.
 * These tests keep the feature presentation-only: queue rotation is browser state
 * built from the read-only playback contract, not a backend mutation shortcut.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { buildOsPlaybackViewModel, OS_PLAYBACK_PLATFORMS } from '../dashboard/services/osPlaybackViewModel.ts';
import { renderOsPlaybackFullscreenOverlay, renderOsPlaybackView } from '../dashboard/views/osPlaybackView.ts';

const appSource = readFileSync('dashboard/app.ts', 'utf8');
const docsSource = readFileSync('docs/OS_PLAYBACK_VIEWS_SLICE_3.md', 'utf8');

function buildStateWithPlaybackItems() {
  const state = createInitialState();
  state.osPlayback = {
    windows: {
      status: 'ready',
      contract: {
        messages: ['Current playback item is first.jpg.'],
        playback: {
          currentItem: {
            mediaAssetId: 101,
            displayName: 'first.jpg',
            mediaType: 'image',
            queueStatus: 'READY',
            resolvedAddress: 'First Address, Tallinn, Estonia',
            displayUrl: '/api/runtime/playback/media?assetId=101',
          },
          items: [
            {
              mediaAssetId: 101,
              displayName: 'first.jpg',
              mediaType: 'image',
              queueStatus: 'READY',
              resolvedAddress: 'First Address, Tallinn, Estonia',
              displayUrl: '/api/runtime/playback/media?assetId=101',
            },
            {
              mediaAssetId: 202,
              displayName: 'second.jpg',
              mediaType: 'image',
              queueStatus: 'READY',
              resolvedAddress: 'Second Address, Tartu, Estonia',
              displayUrl: '/api/runtime/playback/media?assetId=202',
            },
          ],
          queue: { totalCount: 2, readyCount: 2, failedCount: 0, returnedCount: 2 },
        },
      },
    },
  };
  state.osPlaybackRotation = {
    windows: {
      activeIndex: 1,
      paused: false,
      fullscreen: true,
      intervalSeconds: 12,
      nextRotationAtIso: new Date(Date.now() + 12000).toISOString(),
    },
  };
  return state;
}

test('playback view model selects the active queue item for rotation', () => {
  const viewModel = buildOsPlaybackViewModel(buildStateWithPlaybackItems(), OS_PLAYBACK_PLATFORMS.windows);

  assert.equal(viewModel.currentMediaName, 'second.jpg');
  assert.equal(viewModel.resolvedAddress, 'Second Address, Tartu, Estonia');
  assert.equal(viewModel.rotation.activeIndex, 1);
  assert.equal(viewModel.rotation.canRotate, true);
  assert.equal(viewModel.rotation.paused, false);
  assert.equal(viewModel.rotation.fullscreen, true);
  assert.equal(viewModel.playbackItems.length, 2);
});

test('playback view renders active rotation controls and no raw filesystem path', () => {
  const markup = renderOsPlaybackView(buildStateWithPlaybackItems(), OS_PLAYBACK_PLATFORMS.windows);

  assert.match(markup, /second\.jpg/);
  assert.match(markup, /Second Address, Tartu, Estonia/);
  assert.match(markup, /data-os-playback-step-platform="windows"/);
  assert.match(markup, /data-os-playback-toggle-rotation-platform="windows"/);
  assert.match(markup, /Pause rotation/);
  assert.doesNotMatch(markup, /runtime_data\/downloads|test_runtime_data\/downloads|canonicalPath/);
});

test('fullscreen overlay uses the same backend-served media contract', () => {
  const markup = renderOsPlaybackFullscreenOverlay(buildStateWithPlaybackItems());

  assert.match(markup, /data-os-playback-fullscreen-overlay="windows"/);
  assert.match(markup, /Exit Full Screen/);
  assert.match(markup, /src="\/api\/runtime\/playback\/media\?assetId=202"/);
  assert.match(markup, /Second Address, Tartu, Estonia/);
});

test('app wires rotation and fullscreen without adding backend mutation shortcuts', () => {
  assert.match(appSource, /data-playback-view-fullscreen-platform/);
  assert.match(appSource, /requestFullscreen/);
  assert.match(appSource, /data-os-playback-toggle-rotation-platform/);
  assert.match(appSource, /advanceOsPlaybackRotation/);
  assert.match(appSource, /OS_PLAYBACK_ROTATION_INTERVAL_SECONDS = 12/);
  assert.doesNotMatch(appSource, /api\/runtime\/playback\/rotate|api\/runtime\/playback\/fullscreen/);
});

test('slice documentation records preserved boundaries and deferred reuse', () => {
  assert.match(docsSource, /backend playback selection/);
  assert.match(docsSource, /browser-side queue rotation/);
  assert.match(docsSource, /Test\/Real storage separation/);
  assert.match(docsSource, /PIR\/mouse\/keyboard detection reuse remains a later task/);
});


test('frontend passively reports playback resume checkpoints without rotate mutation endpoints', () => {
  assert.match(appSource, /api\/runtime\/playback\/resume-checkpoint/);
  assert.match(appSource, /queueOsPlaybackResumeCheckpointSave\(platform, 'contract-refresh'\)/);
  assert.match(appSource, /OS_PLAYBACK_RESUME_HEARTBEAT_MIN_MS/);
  assert.doesNotMatch(appSource, /api\/runtime\/playback\/rotate|api\/runtime\/playback\/fullscreen/);
});
