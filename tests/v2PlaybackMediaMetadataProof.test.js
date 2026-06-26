import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { buildV2PlaybackDropQueueBridgeRequest } from '../dashboard/services/v2PlaybackDropQueueBridge.ts';
import { buildV2PlaybackMetadataBridge } from '../dashboard/services/v2PlaybackMetadataBridge.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

test('B9.4 proves image/video rows expose backend prepare while non-media rows stay blocked', () => {
  const state = createInitialState();
  const missingMetadata = buildV2PlaybackMetadataBridge();
  const markup = renderV2StartupOperatorMenuView('playback', state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    v2PlaybackQueueItems: [
      { id: 'image-1', filename: 'photo.jpg', mediaKind: 'image', durationLabel: 'not applicable for image', ...missingMetadata },
      { id: 'video-1', filename: 'clip.mp4', mediaKind: 'video', durationLabel: '00:00:12', ...missingMetadata },
      { id: 'other-1', filename: 'notes.txt', mediaKind: 'other', durationLabel: 'not playable as media', ...missingMetadata },
    ],
  });

  assert.equal((markup.match(/data-action="v2-playback-queue-prepare-item"/g) ?? []).length, 2);
  assert.match(markup, /photo\.jpg/);
  assert.match(markup, /clip\.mp4/);
  assert.match(markup, /notes\.txt/);
  assert.match(markup, /Non-media cannot request backend queue prepare\./);
  assert.match(markup, /Not playable/);
});

test('B9.4 proves queue insertion bridge preserves present GPS/address metadata in the queue prepare request', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (path, init = {}) => {
    requests.push({ path, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify({ message: 'Inserted 1 slideshow queue row.', queue: { insertedCount: 1 } }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const harness = createRuntimeTruthHarness();
    const metadata = buildV2PlaybackMetadataBridge({ source: 'pipeline-metadata', gpsCoordinates: '59.4370, 24.7536', address: 'Tallinn, Estonia' });
    const bridgeRequest = buildV2PlaybackDropQueueBridgeRequest({
      id: 'photo-1',
      filename: 'photo.jpg',
      mediaKind: 'image',
      durationLabel: 'not applicable for image',
      ...metadata,
    });

    assert.equal(bridgeRequest.ok, true);
    harness.behavior.runAction('run-b3-5', bridgeRequest.body);
    await waitFor(() => harness.state.statusByKey['B3.5'] === 'success');

    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/api/runtime/queue/prepare');
    assert.equal(requests[0].body.selected.gpsStatus, 'present');
    assert.equal(requests[0].body.selected.addressStatus, 'present');
    assert.equal(requests[0].body.selected.gpsCoordinates, '59.4370, 24.7536');
    assert.equal(requests[0].body.selected.address, 'Tallinn, Estonia');
    assert.equal(harness.state.initResults['B3.5'].outcome, 'success');
  } finally {
    global.fetch = originalFetch;
  }
});

test('B9.4 proves missing GPS/address metadata remains explicit through queue prepare bridge', () => {
  const metadata = buildV2PlaybackMetadataBridge();
  const request = buildV2PlaybackDropQueueBridgeRequest({
    id: 'video-1',
    filename: 'clip.mp4',
    mediaKind: 'video',
    durationLabel: '00:00:12',
    ...metadata,
  });

  assert.equal(request.ok, true);
  assert.equal(request.body.selected.gpsStatus, 'missing');
  assert.equal(request.body.selected.addressStatus, 'missing');
  assert.match(request.body.selected.gpsCoordinates, /GPS missing/);
  assert.match(request.body.selected.address, /Address missing/);
  assert.doesNotMatch(request.body.selected.address, /Tallinn|Example Address|Unknown Address/i);
});

test('B9.4 proof matrix documents media, non-media, insertion, and missing metadata coverage', () => {
  const doc = readFileSync('docs/50_audits_and_migrations/V2_PlaybackMediaMetadataProofMatrix.md', 'utf8');
  for (const expected of [
    'image/video rows expose backend prepare',
    'non-media rows stay blocked',
    'queue prepare request preserves metadata status',
    'missing GPS/address remains explicit',
  ]) {
    assert.match(doc, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});

function createRuntimeTruthHarness() {
  const state = createInitialState();
  const stamp = () => '17:10:00';
  const fixedIso = '2026-06-26T14:10:00.000Z';
  const fixedTallinn = '26.06.2026, 17:10:00';
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
  throw new Error('Timed out while waiting for B9.4 queue insertion proof.');
}
