import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

function createRuntimeTruthHarness() {
  const state = createInitialState();
  const fixedIso = '2026-06-26T13:33:00.000Z';
  const fixedTallinn = '26.06.2026, 16:33:00';
  const stamp = () => '16:33:00';

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
    behavior: createRuntimeTruthBehavior({
      getState: () => state,
      patchState,
      pushHistory,
      pushLog,
      setStatus,
      stamp,
    }),
  };
}

async function waitFor(predicate, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out while waiting for V2 pipeline maintenance proof.');
}

function renderTroubleshooting(state) {
  return renderV2StartupOperatorMenuView('troubleshooting', state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
  });
}

test('V2 pipeline Detect issues calls the backend and renders a graceful success result', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (path, init = {}) => {
    requests.push({ path, init });
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'No stale pipeline locks were detected.',
      truth: {
        pipelineActiveKey: null,
        pipelineLockAcquiredAt: null,
        stageLock: 'Pipeline lock available',
      },
      schemaVersion: 1,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const harness = createRuntimeTruthHarness();
    harness.behavior.runAction('detect-pipeline-issues');

    await waitFor(() => harness.state.statusByKey['B3-DIAGNOSTICS'] === 'success');

    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/api/runtime/pipeline/issues/detect');
    assert.equal(requests[0].init.method, 'POST');
    assert.equal(harness.state.truth.stageLock, 'Pipeline lock available');
    assert.equal(harness.state.initResults['B3-DIAGNOSTICS'].outcome, 'success');
    assert.equal(harness.state.initResults['B3-DIAGNOSTICS'].endpoint, '/api/runtime/pipeline/issues/detect');

    const markup = renderTroubleshooting(harness.state);
    assert.match(markup, /Latest backend result/);
    assert.match(markup, /Success/);
    assert.match(markup, /POST \/api\/runtime\/pipeline\/issues\/detect/);
    assert.match(markup, /No stale pipeline locks were detected\./);
    assert.match(markup, /Response payload/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('V2 pipeline Clear stale locks calls the backend and renders a graceful error result', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (path, init = {}) => {
    requests.push({ path, init });
    return new Response(JSON.stringify({
      status: 'error',
      error: 'stale_lock_clear_blocked',
      message: 'Cannot clear locks while a live pipeline run is active.',
      schemaVersion: 1,
    }), {
      status: 409,
      statusText: 'Conflict',
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const harness = createRuntimeTruthHarness();
    harness.behavior.runAction('clear-stale-pipeline-locks');

    await waitFor(() => harness.state.statusByKey['B3-DIAGNOSTICS'] === 'error');

    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/api/runtime/pipeline/stale-locks/clear');
    assert.equal(requests[0].init.method, 'POST');
    assert.equal(harness.state.initResults['B3-DIAGNOSTICS'].outcome, 'error');
    assert.equal(harness.state.initResults['B3-DIAGNOSTICS'].status, 409);
    assert.equal(harness.state.initResults['B3-DIAGNOSTICS'].endpoint, '/api/runtime/pipeline/stale-locks/clear');

    const markup = renderTroubleshooting(harness.state);
    assert.match(markup, /Latest backend result/);
    assert.match(markup, /Error/);
    assert.match(markup, /POST \/api\/runtime\/pipeline\/stale-locks\/clear/);
    assert.match(markup, /HTTP status/);
    assert.match(markup, /409/);
    assert.match(markup, /Cannot clear locks while a live pipeline run is active\./);
    assert.match(markup, /Error payload/);
  } finally {
    global.fetch = originalFetch;
  }
});
