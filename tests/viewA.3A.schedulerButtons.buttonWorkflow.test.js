import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { createSchedulerCapability } from '../shared/schedulerPlatformCapabilities.ts';

test('3A scheduler actions map to documented endpoints and store scheduler payload state', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    if (path === '/api/init/cron/install' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'warning',
          messages: ['Install is available but scheduler host heartbeat is not observed yet.'],
          scheduler: {
            operation: 'install',
            operationSupportLevel: 'supported',
            platformProfileLabel: 'Windows 11',
            task: { installed: true },
            host: { observed: false, state: 'not-observed' },
          },
          schemaVersion: 3,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/init/cron/status' && method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'warning',
          messages: ['Scheduler bootstrap task is installed through Windows Task Scheduler.'],
          scheduler: {
            operation: 'status',
            operationSupportLevel: 'supported',
            platformProfileLabel: 'Windows 11',
            task: { installed: true },
            host: { observed: false, state: 'not-observed' },
          },
          schemaVersion: 3,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/init/cron/print' && method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'warning',
          messages: ['Scheduler bootstrap task metadata exported from Windows Task Scheduler.'],
          scheduler: {
            operation: 'print',
            operationSupportLevel: 'supported',
            platformProfileLabel: 'Windows 11',
            task: { installed: true, exportedXml: '<Task />' },
            host: { observed: false, state: 'not-observed' },
          },
          schemaVersion: 3,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('install-cron');
    assert.equal(harness.state.statusByKey['3A'], 'running');
    await waitFor(() => harness.state.initResults['3A']?.operation === 'Install scheduler' && harness.state.initResults['3A']?.outcome === 'success');
    assert.equal(harness.state.statusByKey['3A'], 'info');
    assert.equal(harness.state.initResults['3A']?.endpoint, '/api/init/cron/install');
    assert.equal(harness.state.initResults['3A']?.payload?.scheduler?.operation, 'install');

    behavior.runAction('check-cron');
    await waitFor(() => harness.state.initResults['3A']?.operation === 'Check scheduler' && harness.state.initResults['3A']?.outcome === 'success');
    assert.equal(harness.state.statusByKey['3A'], 'info');
    assert.equal(harness.state.initResults['3A']?.endpoint, '/api/init/cron/status');
    assert.equal(harness.state.initResults['3A']?.payload?.scheduler?.operation, 'status');

    behavior.runAction('print-cron');
    await waitFor(() => harness.state.initResults['3A']?.operation === 'Print scheduler' && harness.state.initResults['3A']?.outcome === 'success');
    assert.equal(harness.state.statusByKey['3A'], 'info');
    assert.equal(harness.state.initResults['3A']?.endpoint, '/api/init/cron/print');
    assert.equal(harness.state.initResults['3A']?.payload?.scheduler?.operation, 'print');
    assert.equal(harness.state.initResults['3A']?.payload?.scheduler?.task?.installed, true);

    assert.deepEqual(
      requests.map(({ path, method }) => ({ path, method })),
      [
        { path: '/api/init/cron/install', method: 'POST' },
        { path: '/api/init/cron/status', method: 'GET' },
        { path: '/api/init/cron/print', method: 'GET' },
      ],
    );

    assert.equal(harness.state.history[0]?.source, 'SCHEDULER');
    assert.equal(harness.state.activeActions['3A'], undefined);
  } finally {
    global.fetch = originalFetch;
  }
});

function createRuntimeTruthHarness() {
  const state = createInitialState();
  state.initCapabilities.scheduler = createSchedulerCapability({ runtimePlatform: 'windows' });
  const fixedIso = '2026-04-23T07:45:00.000Z';
  const fixedTallinn = '23.04.2026, 10:45:00';
  const stamp = () => '10:45:00';

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
  throw new Error('Timed out while waiting for the 3A action to finish.');
}
