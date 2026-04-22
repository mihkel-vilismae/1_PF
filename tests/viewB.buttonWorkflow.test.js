import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.js';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.js';

test('B1 login flow remains frontend-only and completes without backend calls', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    requests.push({ path, method: init.method ?? 'GET' });
    throw new Error('B1 should not call backend endpoints');
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('run-b1');
    assert.equal(harness.state.statusByKey.B1, 'running');
    await waitFor(() => harness.state.statusByKey.B1 === 'success', 1500);

    assert.equal(requests.length, 0);
    assert.equal(harness.state.loginSteps.every((step) => step.status === 'done'), true);
  } finally {
    global.fetch = originalFetch;
  }
});

test('B2, B3 auto, and B4 actions call backend endpoints and update runtime truth state', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  let queuePrepared = false;

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    if (path === '/api/runtime/download/run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Mock download copied 1 file(s) from generated_test_data into the test download directory.'],
          download: { newMediaFiles: 1 },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/index/run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Indexed 1 media file(s); inserted 1 canonical row(s).'],
          indexing: { insertedCanonicalCount: 1 },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/gps/run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['GPS parsing processed 1 queued asset(s): 1 success, 0 without GPS.'],
          processed_count: 1,
          success_count: 1,
          failure_count: 0,
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/geocode/run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Geocoding processed 1 queued asset(s): 1 success, 0 failed using the deterministic placeholder geocoder (not production).'],
          processed_count: 1,
          success_count: 1,
          failure_count: 0,
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/queue/prepare' && method === 'POST') {
      queuePrepared = true;
      return new Response(
        JSON.stringify({
          inserted_count: 1,
          skipped_count: 0,
          inserted_ids: [42],
          skipped: [],
          message: 'Inserted 1 slideshow queue row.',
          queue: { insertedCount: 1 },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/playback/select-current' && method === 'POST') {
      if (!queuePrepared) {
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'no_ready_row',
            message: 'No READY slideshow rows exist for playback selection.',
            schemaVersion: 1,
          }),
          { status: 409, headers: { 'content-type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Selected media asset 42 as the current playback item.'],
          playback: {
            selected: {
              mediaAssetId: 42,
              canonicalPath: '/tmp/test-media/sample.jpg',
              addressText: 'Tallinn, Harjumaa, Estonia',
              selectedAt: '2026-04-23T10:00:00.000Z',
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
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('run-b2');
    await waitFor(() => harness.state.statusByKey.B2 === 'success');
    assert.equal(harness.state.logs.B2[0]?.message.includes('Mock download copied 1 file(s)'), true);

    behavior.runAction('run-b3-auto');
    await waitFor(() => harness.state.statusByKey.B3 === 'success');
    assert.equal(harness.state.truth.lastStageCompleted, 'B3.5');

    behavior.runAction('run-b4');
    await waitFor(() => harness.state.statusByKey.B4 === 'success');
    assert.equal(harness.state.truth.currentMedia?.name, 'sample.jpg');
    assert.equal(harness.state.truth.currentMedia?.type, 'Image');
    assert.equal(harness.state.truth.currentMedia?.overlay, 'Tallinn, Harjumaa, Estonia');

    assert.deepEqual(
      requests.map(({ path, method }) => ({ path, method })),
      [
        { path: '/api/runtime/download/run', method: 'POST' },
        { path: '/api/runtime/download/run', method: 'POST' },
        { path: '/api/runtime/index/run', method: 'POST' },
        { path: '/api/runtime/gps/run', method: 'POST' },
        { path: '/api/runtime/geocode/run', method: 'POST' },
        { path: '/api/runtime/queue/prepare', method: 'POST' },
        { path: '/api/runtime/playback/select-current', method: 'POST' },
      ],
    );
  } finally {
    global.fetch = originalFetch;
  }
});

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

async function waitFor(predicate, timeoutMs = 1200) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out while waiting for View B action to finish.');
}
