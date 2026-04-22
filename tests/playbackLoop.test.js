import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.js';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.js';

// Simple harness factory for runtime truth behavior, modelled after existing tests.
function createRuntimeTruthHarness() {
  const state = createInitialState();
  const fixedIso = '2026-04-23T10:00:00.000Z';
  const fixedTallinn = '23.04.2026, 13:00:00';
  const stamp = () => '13:00:00';

  const patchState = (mutate) => {
    mutate(state);
  };

  const pushHistory = (source, type, message, details = null) => {
    state.history.unshift({
      id: `history-${state.history.length + 1}`,
      at: stamp(),
      atIso: fixedIso,
      atTallinn: fixedTallinn,
      source,
      type,
      message,
      details,
    });
  };

  const pushLog = (key, type, message, details = null) => {
    state.logs[key] ??= [];
    state.logs[key].unshift({
      at: stamp(),
      atIso: fixedIso,
      atTallinn: fixedTallinn,
      type,
      message,
      details,
    });
  };

  const setStatus = (key, status) => {
    state.statusByKey[key] = status;
  };

  return {
    state,
    actions: {
      getState: () => state,
      patchState,
      pushHistory,
      pushLog,
      setStatus,
      stamp,
    },
  };
}

async function waitFor(predicate, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out while waiting for condition');
}

test('B4 playback selection automatically advances to next media when available', async () => {
  const originalFetch = global.fetch;
  let selectCallCount = 0;

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    // Only handle playback selection; other endpoints should not be called in this test.
    if (path === '/api/runtime/playback/select-current' && method === 'POST') {
      selectCallCount += 1;
      // First call returns the first media asset; second call returns a second asset; subsequent calls repeat the second asset.
      if (selectCallCount === 1) {
        return new Response(
          JSON.stringify({
            status: 'ok',
            messages: ['Selected media asset 1'],
            playback: {
              selected: {
                mediaAssetId: 1,
                canonicalPath: '/tmp/test-media/media1.jpg',
                addressText: 'First asset address',
                selectedAt: '2026-04-23T10:00:00.000Z',
              },
              failedCandidateCount: 0,
            },
            schemaVersion: 1,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      // Second call returns the second media asset.
      if (selectCallCount === 2) {
        return new Response(
          JSON.stringify({
            status: 'ok',
            messages: ['Selected media asset 2'],
            playback: {
              selected: {
                mediaAssetId: 2,
                canonicalPath: '/tmp/test-media/media2.jpg',
                addressText: 'Second asset address',
                selectedAt: '2026-04-23T10:00:01.000Z',
              },
              failedCandidateCount: 0,
            },
            schemaVersion: 1,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      // Subsequent calls return the same second asset to signal no further progression.
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Selected media asset 2'],
          playback: {
            selected: {
              mediaAssetId: 2,
              canonicalPath: '/tmp/test-media/media2.jpg',
              addressText: 'Second asset address',
              selectedAt: '2026-04-23T10:00:02.000Z',
            },
            failedCandidateCount: 0,
          },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    // Indicate there are two items in the queue so the position strings are meaningful.
    harness.state.truth.queueLength = 2;
    const behavior = createRuntimeTruthBehavior(harness.actions);

    // Start playback emulation. The first call should select media1.jpg, then the loop should automatically
    // select media2.jpg on the next iteration.
    behavior.runAction('run-b4');
    // Wait for first selection.
    await waitFor(() => harness.state.truth.currentMedia?.name === 'media1.jpg');
    // Wait for automatic progression to second selection.
    await waitFor(() => harness.state.truth.currentMedia?.name === 'media2.jpg', 3000);

    assert.equal(harness.state.truth.currentMedia?.name, 'media2.jpg');
    // Ensure the backend playback endpoint was called at least twice.
    assert.ok(selectCallCount >= 2);
  } finally {
    global.fetch = originalFetch;
  }
});