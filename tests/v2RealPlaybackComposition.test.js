import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { buildV2PlaybackMetadataBridge } from '../dashboard/services/v2PlaybackMetadataBridge.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

function renderRealPlayback(options = {}) {
  const state = { ...createInitialState(), ...(options.state ?? {}) };
  return renderV2StartupOperatorMenuView('real-playback', state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
    v2PlaybackQueueItems: options.v2PlaybackQueueItems ?? [],
  });
}

function esc(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('B10.1 composes 09 REAL PLAYBACK from already proven V2 pieces only', () => {
  const markup = renderRealPlayback();
  for (const expected of [
    '09 REAL PLAYBACK integrated goal',
    'Proven-piece boundary',
    'Real Playback scheduler controls',
    'RPI-STAGES / Media pipeline stage row',
    'RPI-WORKERS / Worker call status row',
    'Real Playback B3.1 Download',
    'Real Playback B3.5 Enqueue playback',
    'Real Playback rendering controls',
    'Real Playback queue bridge',
    'Gated future controls',
    'blocked until B11',
    'hardware proof later',
    'data-v2-status-id="v2.block.09.proven-boundary"',
    'data-v2-status-id="v2.block.09.drop-queue"',
  ]) {
    assert.match(markup, new RegExp(esc(expected)));
  }
});

test('B10.1 keeps unproven recovery and PIR hardware disabled on 09 REAL PLAYBACK', () => {
  const markup = renderRealPlayback();
  assert.doesNotMatch(markup, /data-v2-alert-text="SAVE STATE"/);
  assert.doesNotMatch(markup, /data-action="emulate-pir-signal"/);
  assert.match(markup, /data-v2-child-item="09\.future-recovery"/);
  assert.match(markup, /data-v2-child-item="09\.future-pir-hardware"/);
  assert.match(markup, /data-v2-interaction="disabledPlaceholder"/);
});

test('B10.1 reuses the playback queue bridge and metadata table on 09 REAL PLAYBACK', () => {
  const metadata = buildV2PlaybackMetadataBridge({
    source: 'pipeline-metadata',
    gpsCoordinates: '59.4370, 24.7536',
    address: 'Tallinn, Estonia',
  });
  const markup = renderRealPlayback({
    v2PlaybackQueueItems: [
      { id: 'photo-1', filename: 'photo.jpg', mediaKind: 'image', durationLabel: 'not applicable for image', ...metadata },
      { id: 'other-1', filename: 'notes.txt', mediaKind: 'other', durationLabel: 'not playable as media', ...buildV2PlaybackMetadataBridge() },
    ],
  });

  assert.match(markup, /photo\.jpg/);
  assert.match(markup, /Tallinn, Estonia/);
  assert.match(markup, /data-action="v2-playback-queue-prepare-item"/);
  assert.match(markup, /notes\.txt/);
  assert.match(markup, /Non-media cannot request backend queue prepare\./);
});
