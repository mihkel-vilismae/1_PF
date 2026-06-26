import assert from 'node:assert/strict';
import test from 'node:test';

import { PLAYBACK_RENDERING_MODES } from '../dashboard/services/playbackRenderer.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { buildV2RealPlaybackProjection } from '../dashboard/services/v2RealPlaybackProjection.ts';
import { buildV2PlaybackMetadataBridge } from '../dashboard/services/v2PlaybackMetadataBridge.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

test('B10.2 builds a real playback projection from existing action state and queue rows', () => {
  const state = createInitialState();
  state.statusByKey['3A'] = 'success';
  state.statusByKey['B3.1'] = 'success';
  state.statusByKey['B3.5'] = 'success';
  state.playbackRendering.mode = PLAYBACK_RENDERING_MODES.previewWindow;
  const metadata = buildV2PlaybackMetadataBridge({ source: 'pipeline-metadata', gpsCoordinates: '59.4370, 24.7536', address: 'Tallinn, Estonia' });
  const projection = buildV2RealPlaybackProjection(state, [
    { mediaKind: 'image', backendQueueStatus: 'requested', ...metadata },
    { mediaKind: 'other', backendQueueStatus: 'blocked', ...buildV2PlaybackMetadataBridge() },
  ]);

  assert.equal(projection.readiness, 'ready');
  assert.match(projection.summary, /backend queue preparation/i);
  assert.ok(projection.rows.some((row) => row.id === 'queue' && /1 backend queue request/.test(row.message)));
  assert.ok(projection.rows.some((row) => row.id === 'metadata' && /No fake address/.test(row.message)));
  assert.ok(projection.rows.some((row) => row.id === 'recovery' && row.status === 'blocked until B11'));
});

test('B10.2 renders the action flow/status projection on 09 REAL PLAYBACK', () => {
  const state = createInitialState();
  state.statusByKey['B3.5'] = 'success';
  const markup = renderV2StartupOperatorMenuView('real-playback', state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
    v2PlaybackQueueItems: [
      { id: 'video-1', filename: 'clip.mp4', mediaKind: 'video', durationLabel: '0:12', backendQueueStatus: 'requested', ...buildV2PlaybackMetadataBridge() },
    ],
  });

  assert.match(markup, /Real Playback action flow \/ status projection/);
  assert.match(markup, /data-v2-real-playback-projection/);
  assert.match(markup, /data-v2-real-playback-readiness="ready"/);
  assert.match(markup, /1\. Raspberry scheduler\/crontab/);
  assert.match(markup, /2\. Media pipeline workers/);
  assert.match(markup, /3\. Playback queue bridge/);
  assert.match(markup, /4\. GPS\/address metadata/);
  assert.match(markup, /6\. Recovery gate/);
  assert.match(markup, /blocked until B11/);
});
