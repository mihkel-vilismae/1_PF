/*
 * Verifies View A scheduler controls, target tabs, and CronEmulator action wiring.
 * Tests keep the legacy cron routes compatible while pinning the Windows UI.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { renderInitView } from '../dashboard/views/initView.ts';
import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { checkCronStatus, printCron } from '../dashboard/services/initService.ts';
import {
  SCHEDULER_EMULATOR_DEFAULT_ACTIVE_CRONTAB,
  SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB,
  createInitialState,
} from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { createSchedulerCapability, SCHEDULER_TARGETS } from '../shared/schedulerPlatformCapabilities.ts';

test('3A scheduler actions map to documented endpoints and store scheduler payload state', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    if (path === '/api/init/cron/install' && method === 'POST') {
      assert.equal(JSON.parse(init.body).target, SCHEDULER_TARGETS.windowsCronEmulator);
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

test('3A Windows CronEmulator controls render ordered buttons, circles, and crontab textareas', () => {
  const harness = createRuntimeTruthHarness();
  const html = renderInitView(harness.state);

  assert.match(html, /data-scheduler-button-key="check-emulator-scheduler"[\s\S]*?Check emulator scheduler/);
  assert.match(html, /data-scheduler-button-key="run-emulator"[\s\S]*?Run emulator/);
  assert.match(html, /data-scheduler-button-key="stop-emulator"[\s\S]*?Stop emulator/);
  assert.match(html, /data-scheduler-button-key="install-crontab"[\s\S]*?Install crontab/);
  assert.match(html, /data-scheduler-button-key="get-active-crontab"[\s\S]*?Get active crontab/);
  assert.match(
    html,
    /Check emulator scheduler[\s\S]*?Run emulator[\s\S]*?Stop emulator[\s\S]*?Install crontab[\s\S]*?Get active crontab/,
  );
  assert.match(html, /auth-button-status-dot/);
  assert.match(html, /insert crontab/);
  assert.match(html, /crontab from CronEmulator/);
  assert.match(html, /data-scheduler-crontab-input/);
  assert.match(html, /data-scheduler-active-crontab/);
  assert.match(html, /not checked, press &#39;Get active crontab&#39;/);
  assert.match(html, /regular_stage_worker\.ps1/);
  assert.match(html, /playback_worker\.ps1/);
  assert.match(html, /screen_on_off_worker\.ps1/);
  assert.equal(SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB.includes('/path/to/screen_on_off_worker'), false);
});

// Verifies CronEmulator action routing, request shape, and active-crontab state updates.
test('3A CronEmulator actions call emulator endpoints and only get-active updates active crontab textarea state', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  // Captures scheduler requests while preserving browser-like URL parsing for query checks.
  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    const requestUrl = new URL(String(path), 'http://localhost');
    requests.push({
      path: requestUrl.pathname,
      method,
      queryTarget: requestUrl.searchParams.get('target'),
      body: init.body ? JSON.parse(init.body) : null,
    });

    if (requestUrl.pathname === '/api/init/cron/emulator/check' && method === 'GET') {
      return schedulerResponse({ operation: 'emulator-check', running: false, rawCrontab: '* * * * * /tmp/old\n' });
    }
    if (requestUrl.pathname === '/api/init/cron/emulator/run' && method === 'POST') {
      return schedulerResponse({ operation: 'emulator-run', running: true, rawCrontab: '* * * * * /tmp/old\n' });
    }
    if (requestUrl.pathname === '/api/init/cron/emulator/stop' && method === 'POST') {
      return schedulerResponse({ operation: 'emulator-stop', running: false, rawCrontab: '* * * * * /tmp/old\n' });
    }
    if (requestUrl.pathname === '/api/init/cron/emulator/crontab' && method === 'POST') {
      assert.equal(JSON.parse(init.body).crontabText, SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB);
      return schedulerResponse({ operation: 'emulator-install-crontab', running: false, rawCrontab: `${SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB}\n`, crontabInstalled: true });
    }
    if (requestUrl.pathname === '/api/init/cron/emulator/crontab' && method === 'GET') {
      return schedulerResponse({ operation: 'emulator-active-crontab', running: false, rawCrontab: '* * * * * /tmp/active\n' });
    }

    throw new Error(`Unexpected request: ${method} ${requestUrl.pathname}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('check-emulator-scheduler');
    await waitFor(() => harness.state.schedulerEmulator.buttonStates['check-emulator-scheduler'].status === 'success');
    assert.equal(harness.state.schedulerEmulator.buttonStates['check-emulator-scheduler'].status, 'success');
    assert.equal(harness.state.schedulerEmulator.activeCrontab, SCHEDULER_EMULATOR_DEFAULT_ACTIVE_CRONTAB);

    behavior.runAction('run-emulator');
    await waitFor(() => harness.state.schedulerEmulator.buttonStates['run-emulator'].status === 'success');
    assert.equal(harness.state.schedulerEmulator.buttonStates['run-emulator'].status, 'success');

    behavior.runAction('stop-emulator');
    await waitFor(() => harness.state.schedulerEmulator.buttonStates['stop-emulator'].status === 'success');
    assert.equal(harness.state.schedulerEmulator.buttonStates['stop-emulator'].status, 'success');

    behavior.runAction('install-crontab');
    await waitFor(() => harness.state.schedulerEmulator.buttonStates['install-crontab'].status === 'success');
    assert.equal(harness.state.schedulerEmulator.buttonStates['install-crontab'].status, 'success');
    assert.equal(harness.state.schedulerEmulator.activeCrontab, SCHEDULER_EMULATOR_DEFAULT_ACTIVE_CRONTAB);

    behavior.runAction('get-active-crontab');
    await waitFor(() => harness.state.schedulerEmulator.activeCrontab === '* * * * * /tmp/active\n');
    assert.equal(harness.state.schedulerEmulator.buttonStates['get-active-crontab'].status, 'success');

    assert.deepEqual(
      requests,
      [
        { path: '/api/init/cron/emulator/check', method: 'GET', queryTarget: SCHEDULER_TARGETS.windowsCronEmulator, body: null },
        { path: '/api/init/cron/emulator/run', method: 'POST', queryTarget: null, body: { target: SCHEDULER_TARGETS.windowsCronEmulator } },
        { path: '/api/init/cron/emulator/stop', method: 'POST', queryTarget: null, body: { target: SCHEDULER_TARGETS.windowsCronEmulator } },
        {
          path: '/api/init/cron/emulator/crontab',
          method: 'POST',
          queryTarget: null,
          body: {
            target: SCHEDULER_TARGETS.windowsCronEmulator,
            crontabText: SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB,
          },
        },
        { path: '/api/init/cron/emulator/crontab', method: 'GET', queryTarget: SCHEDULER_TARGETS.windowsCronEmulator, body: null },
      ],
    );
    assert.equal(harness.state.schedulerEmulator.endpointLog.length, 10);
    assert.deepEqual(
      harness.state.schedulerEmulator.endpointLog.map((entry) => ({ type: entry.type, method: entry.method, endpoint: entry.endpoint, status: entry.status })).slice(0, 2),
      [
        { type: 'response', method: 'GET', endpoint: '/api/init/cron/emulator/crontab', status: 200 },
        { type: 'request', method: 'GET', endpoint: '/api/init/cron/emulator/crontab', status: null },
      ],
    );

    const html = renderInitView(harness.state);
    assert.match(html, /cron endpoint live log/);
    assert.match(html, /scheduler-endpoint-terminal__row--response/);
    assert.match(html, /\/api\/init\/cron\/emulator\/crontab/);
  } finally {
    global.fetch = originalFetch;
  }
});

// Verifies optional scheduler targets do not create invalid GET request bodies.
test('3A scheduler GET helpers encode optional targets as query params without request bodies', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  // Captures legacy scheduler GET helper requests for body and query assertions.
  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    const requestUrl = new URL(String(path), 'http://localhost');
    requests.push({
      path: requestUrl.pathname,
      method,
      queryTarget: requestUrl.searchParams.get('target'),
      body: init.body ? JSON.parse(init.body) : null,
    });
    return schedulerResponse({ operation: requestUrl.pathname.endsWith('/print') ? 'print' : 'status', running: false, rawCrontab: '* * * * * /tmp/current\n' });
  };

  try {
    await checkCronStatus({ target: SCHEDULER_TARGETS.windowsCronEmulator });
    await printCron({ target: SCHEDULER_TARGETS.windowsCronEmulator });

    assert.deepEqual(requests, [
      { path: '/api/init/cron/status', method: 'GET', queryTarget: SCHEDULER_TARGETS.windowsCronEmulator, body: null },
      { path: '/api/init/cron/print', method: 'GET', queryTarget: SCHEDULER_TARGETS.windowsCronEmulator, body: null },
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});

test('3A scheduler target tabs disable inactive controls and persist target selection through backend', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method, body: init.body ? JSON.parse(init.body) : null });
    if (path === '/api/init/cron/target' && method === 'POST') {
      const body = JSON.parse(init.body);
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: [`Selected scheduler target: ${body.target}.`],
          selectedTarget: body.target,
          selection: { selectedTarget: body.target, source: 'request' },
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

    let html = renderInitView(harness.state);
    assert.match(html, /WINDOWS \(crontab emulator\)/);
    assert.match(html, /RASPBERRY \(real crontab\)/);
    assert.match(html, /data-scheduler-target="windows-cron-emulator"[\s\S]*?status-badge--info[\s\S]*?Active/);
    assert.match(html, /data-scheduler-target="raspberry-real-crontab"[\s\S]*?status-badge--disabled[\s\S]*?Disabled/);

    behavior.runAction('select-scheduler-target-raspberry');
    await waitFor(() => harness.state.selectedSchedulerTarget === SCHEDULER_TARGETS.raspberryRealCrontab && harness.state.initResults['3A']?.outcome === 'success');

    html = renderInitView(harness.state);
    assert.match(html, /data-scheduler-target="windows-cron-emulator"[\s\S]*?status-badge--disabled[\s\S]*?Disabled/);
    assert.match(html, /data-scheduler-target="raspberry-real-crontab"[\s\S]*?status-badge--info[\s\S]*?Active/);
    assert.deepEqual(requests, [
      {
        path: '/api/init/cron/target',
        method: 'POST',
        body: { target: SCHEDULER_TARGETS.raspberryRealCrontab },
      },
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});

// Builds a scheduler payload resembling the backend CronEmulator endpoint response.
function schedulerResponse({ operation, running, rawCrontab, crontabInstalled = false }) {
  return new Response(
    JSON.stringify({
      status: running || operation === 'emulator-install-crontab' || operation === 'emulator-active-crontab' ? 'ok' : 'warning',
      messages: [`${operation} completed.`],
      scheduler: {
        operation,
        operationSupportLevel: 'supported',
        platformProfileLabel: 'Windows 11',
        selectedTarget: SCHEDULER_TARGETS.windowsCronEmulator,
        task: {
          installed: true,
          running,
          rawCrontab,
          crontabInstalled,
        },
        host: { observed: true, state: running ? 'running' : 'stopped' },
      },
      schemaVersion: 3,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

// Creates an isolated runtime-truth harness for scheduler button tests.
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
