import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('View C refresh-last-run reads backend orchestration last endpoint', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method, hasBody: Boolean(init.body) });

    if (path === '/api/runtime/orchestration/last' && method === 'GET') {
      return new Response(
        JSON.stringify({
          run_id: 3,
          status: 'SUCCEEDED',
          current_stage: 'playback_select',
          last_successful_stage: 'playback_select',
          started_at: '2026-04-23T09:59:00.000Z',
          finished_at: '2026-04-23T10:00:00.000Z',
          failed_stage: null,
          failure_reason: null,
          stage_order_executed: ['download', 'index', 'gps', 'geocode', 'queue_prepare', 'playback_select'],
          stage_results: {},
          selected_asset_summary: {
            canonicalPath: '/tmp/test-media/sample.jpg',
            addressText: 'Tallinn, Harjumaa, Estonia',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('refresh-last-run');
    await waitFor(() => harness.state.statusByKey.C === 'success');

    assert.deepEqual(requests, [{ path: '/api/runtime/orchestration/last', method: 'GET', hasBody: false }]);
    assert.equal(harness.state.lastRunMode, 'ready');
    assert.equal(harness.state.lastRunData.media.file, 'sample.jpg');
    assert.equal(harness.state.lastRunData.stage.lastCompleted, 'playback_select');
  } finally {
    global.fetch = originalFetch;
  }
});

test('View C refresh-last-run handles no previous orchestration run', async () => {
  const originalFetch = global.fetch;

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    if (path === '/api/runtime/orchestration/last' && method === 'GET') {
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);
    harness.state.lastRunMode = 'ready';

    behavior.runAction('refresh-last-run');
    await waitFor(() => harness.state.statusByKey.C === 'success');

    assert.equal(harness.state.lastRunMode, 'none');
    assert.deepEqual(harness.state.lastRunData, { media: {}, playback: {}, stage: {}, screen: {} });
  } finally {
    global.fetch = originalFetch;
  }
});

test('View C refresh-last-run surfaces backend load failure', async () => {
  const originalFetch = global.fetch;

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    if (path === '/api/runtime/orchestration/last' && method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'runtime_state_read_failed',
          message: 'Failed to read orchestration state.',
          schemaVersion: 1,
        }),
        { status: 500, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('refresh-last-run');
    await waitFor(() => harness.state.statusByKey.C === 'error');

    assert.equal(harness.state.lastRunMode, 'error');
    assert.equal(harness.state.logs.C[0]?.type, 'error');
    assert.match(harness.state.logs.C[0]?.message ?? '', /Failed to read orchestration state/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('View C resume-last-run remains local and does not call runtime orchestration endpoints', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    requests.push({ path, init });
    return new Response(JSON.stringify({ status: 'unexpected' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('resume-last-run');

    assert.equal(harness.state.statusByKey.C, 'running');
    await waitFor(() => harness.state.statusByKey.C === 'success');

    assert.deepEqual(requests, []);
    assert.equal(harness.state.logs.C[0]?.type, 'success');
    assert.match(harness.state.logs.C[0]?.message ?? '', /Restore placeholder activated/);
    assert.equal(harness.state.history[0]?.source, 'RECOVERY');
    assert.equal(harness.state.history[0]?.details?.actionKey, 'C');
  } finally {
    global.fetch = originalFetch;
  }
});

function createRuntimeTruthHarness() {
  const state = createInitialState();
  const stamp = () => '20:29:06';

  const patchState = (mutate) => {
    mutate(state);
  };

  const pushHistory = (source, type, message, details = null) => {
    state.history.unshift({
      id: `history-${state.history.length + 1}`,
      at: stamp(),
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

async function waitFor(predicate, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out while waiting for resume-last-run to finish.');
}
