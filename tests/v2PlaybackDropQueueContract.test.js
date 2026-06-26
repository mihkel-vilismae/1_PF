import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

function renderPlayback() {
  const state = createInitialState();
  return renderV2StartupOperatorMenuView('playback', state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
    v2PlaybackQueueItems: [
      { id: 'photo-1', filename: 'photo.jpg', mediaKind: 'image', durationLabel: 'not applicable for image', gpsCoordinates: 'not extracted in browser-local queue', address: 'no address string yet' },
      { id: 'text-1', filename: 'notes.txt', mediaKind: 'other', durationLabel: 'not playable as media', gpsCoordinates: 'not extracted in browser-local queue', address: 'no address string yet' },
    ],
  });
}

test('B9.3 documents that V2 drag/drop queue is browser-local before backend bridge work', () => {
  const markup = renderPlayback();
  assert.match(markup, /browser-local queue table/);
  assert.match(markup, /not extracted in browser-local queue/);
  assert.match(markup, /not playable as media/);
  assert.doesNotMatch(markup, /data-action="v2-playback-queue-prepare-item"/);

  const appSource = readFileSync('dashboard/app.ts', 'utf8');
  assert.match(appSource, /productionMutation: false/);
  assert.match(appSource, /v2-playback-drop-queue-add/);
});

test('B9.3 bridge contract requires media-only backend queue preparation and non-media local failure', () => {
  const doc = readFileSync('docs/20_architecture_and_specs/openspec/V2_PlaybackDropQueueBridgeContract.md', 'utf8');
  for (const expected of [
    'Only rows classified as `image` or `video` may request backend queue preparation.',
    'Rows classified as `other` must fail locally',
    'POST /api/runtime/queue/prepare',
    'v2-playback-drop-queue',
    'no arbitrary browser file path may be trusted',
    'no fake address',
  ]) {
    assert.match(doc, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});
