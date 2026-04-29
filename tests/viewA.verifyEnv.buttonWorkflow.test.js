import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('verify-env action maps the 1A run button to POST /api/init/verify-env and stores the backend result', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  const payload = {
    status: 'ok',
    messages: ['Validated 25 required key(s).'],
    schemaVersion: 1,
    verifiedAt: '2026-04-22T17:29:06.619Z',
  };

  global.fetch = async (path, init = {}) => {
    requests.push({ path, init });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('verify-env');

    assert.equal(harness.state.statusByKey['1A'], 'running');
    assert.equal(harness.state.initResults['1A']?.outcome, 'running');
    await waitFor(() => harness.state.initResults['1A']?.outcome === 'success');

    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/api/init/verify-env');
    assert.equal(requests[0].init.method, 'POST');
    assert.equal(harness.state.statusByKey['1A'], 'success');
    assert.equal(harness.state.initResults['1A']?.method, 'POST');
    assert.equal(harness.state.initResults['1A']?.endpoint, '/api/init/verify-env');
    assert.equal(harness.state.initResults['1A']?.payload?.schemaVersion, 1);
    assert.equal(harness.state.initResults['1A']?.response?.status, 200);
    assert.equal(harness.state.initResults['1A']?.response?.body?.status, 'ok');
    assert.match(harness.state.logs['1A'][0]?.message ?? '', /Verify \.env completed with status ok\./);
    assert.equal(harness.state.history[0]?.source, 'INIT');
    assert.match(harness.state.history[0]?.message ?? '', /Verify \.env completed through \/api\/init\/verify-env\./);
    assert.equal(harness.state.activeActions['1A'], undefined);
  } finally {
    global.fetch = originalFetch;
  }
});

function createRuntimeTruthHarness() {
  const state = createInitialState();
  const fixedIso = '2026-04-22T17:29:06.619Z';
  const fixedTallinn = '22.04.2026, 20:29:06';
  const stamp = () => '20:29:06';

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

async function waitFor(predicate, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out while waiting for the verify-env action to finish.');
}
