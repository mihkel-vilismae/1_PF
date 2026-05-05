import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

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
