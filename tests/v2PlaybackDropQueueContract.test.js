import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { buildV2PlaybackDropQueueBridgeRequest } from '../dashboard/services/v2PlaybackDropQueueBridge.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

function renderPlayback() {
  const state = createInitialState();
  return renderV2StartupOperatorMenuView('playback', state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
    v2PlaybackQueueItems: [
      { id: 'photo-1', filename: 'photo.jpg', mediaKind: 'image', durationLabel: 'not applicable for image', gpsCoordinates: 'not extracted in browser-local queue', address: 'no address string yet', backendQueueStatus: 'local-only', backendQueueMessage: 'Not sent to backend yet.' },
      { id: 'text-1', filename: 'notes.txt', mediaKind: 'other', durationLabel: 'not playable as media', gpsCoordinates: 'not extracted in browser-local queue', address: 'no address string yet', backendQueueStatus: 'blocked', backendQueueMessage: 'Non-media cannot request backend queue prepare.' },
    ],
  });
}

test('B8.3 keeps V2 drag/drop queue browser-local while exposing a safe backend bridge button for valid media', () => {
  const markup = renderPlayback();
  assert.match(markup, /browser-local queue table/);
  assert.match(markup, /not extracted in browser-local queue/);
  assert.match(markup, /not playable as media/);
  assert.match(markup, /data-action="v2-playback-queue-prepare-item"/);
  assert.match(markup, /Prepare backend queue/);
  assert.match(markup, /Non-media cannot request backend queue prepare\./);

  const appSource = readFileSync('dashboard/app.ts', 'utf8');
  assert.match(appSource, /buildV2PlaybackDropQueueBridgeRequest/);
  assert.match(appSource, /runAction\('run-b3-5', bridgeRequest\.body\)/);
  assert.match(appSource, /backendRequestSent: false/);
});

test('B8.3 bridge contract allows media rows and blocks non-media rows before backend request', () => {
  const mediaRequest = buildV2PlaybackDropQueueBridgeRequest({
    id: 'photo-1',
    filename: 'photo.jpg',
    mediaKind: 'image',
    durationLabel: 'not applicable for image',
    gpsCoordinates: 'not extracted in browser-local queue',
    address: 'no address string yet',
  });
  assert.equal(mediaRequest.ok, true);
  assert.equal(mediaRequest.endpoint.path, '/api/runtime/queue/prepare');
  assert.equal(mediaRequest.body.source, 'v2-playback-drop-queue');
  assert.equal(mediaRequest.body.browserLocalOnly, true);
  assert.equal(mediaRequest.body.selected.mediaKind, 'image');
  assert.match(mediaRequest.body.note, /not trusted as backend filesystem paths/);

  const nonMediaRequest = buildV2PlaybackDropQueueBridgeRequest({
    id: 'text-1',
    filename: 'notes.txt',
    mediaKind: 'other',
  });
  assert.equal(nonMediaRequest.ok, false);
  assert.equal(nonMediaRequest.reason, 'non-media');
  assert.equal(nonMediaRequest.body, null);
  assert.match(nonMediaRequest.message, /not image\/video media/);
});

test('B8.3 queue bridge payload reaches the existing B3.5 backend queue-prepare action', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (path, init = {}) => {
    requests.push({ path, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify({
      message: 'Inserted 1 slideshow queue row.',
      queue: { insertedCount: 1 },
      schemaVersion: 1,
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const harness = createRuntimeTruthHarness();
    const bridgeRequest = buildV2PlaybackDropQueueBridgeRequest({
      id: 'photo-1',
      filename: 'photo.jpg',
      mediaKind: 'image',
      durationLabel: 'not applicable for image',
      gpsCoordinates: 'not extracted in browser-local queue',
      address: 'no address string yet',
    });
    harness.behavior.runAction('run-b3-5', bridgeRequest.ok ? bridgeRequest.body : {});
    await waitFor(() => harness.state.statusByKey['B3.5'] === 'success');

    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/api/runtime/queue/prepare');
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].body.source, 'v2-playback-drop-queue');
    assert.equal(requests[0].body.selected.filename, 'photo.jpg');
    assert.equal(harness.state.initResults['B3.5'].outcome, 'success');
    assert.equal(harness.state.truth.queueLength, 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test('B8.3 bridge contract document records media-only safety and no fake metadata rules', () => {
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

function createRuntimeTruthHarness() {
  const state = createInitialState();
  const stamp = () => '16:55:00';
  const fixedIso = '2026-06-26T13:55:00.000Z';
  const fixedTallinn = '26.06.2026, 16:55:00';
  const patchState = (mutate) => mutate(state);
  const pushHistory = (source, type, message, details = null) => {
    state.history.unshift({ id: `history-${state.history.length + 1}`, at: stamp(), atIso: fixedIso, atTallinn: fixedTallinn, source, type, message, details });
  };
  const pushLog = (key, type, message, details = null) => {
    state.logs[key] ??= [];
    state.logs[key].unshift({ at: stamp(), atIso: fixedIso, atTallinn: fixedTallinn, type, message, details });
  };
  const setStatus = (key, status) => {
    state.statusByKey[key] = status;
  };
  return {
    state,
    behavior: createRuntimeTruthBehavior({ getState: () => state, patchState, pushHistory, pushLog, setStatus, stamp }),
  };
}

async function waitFor(predicate, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out while waiting for V2 playback queue bridge.');
}
