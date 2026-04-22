import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.js';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.js';

test('2A database actions map to the documented endpoints and store result state for check/inspect/recreate/delete', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  const databasePath = '/tmp/init-test.sqlite';
  let databaseExists = false;

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(init.body) : undefined;
    requests.push({ path, method, body });

    if (path === '/api/init/database/status' && method === 'GET') {
      return new Response(
        JSON.stringify({
          status: databaseExists ? 'ok' : 'warning',
          messages: [
            databaseExists
              ? 'Database file exists and can be inspected.'
              : 'Database file does not exist yet. Use recreate-empty to create it.',
          ],
          database: {
            absolutePath: databasePath,
            exists: databaseExists,
          },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/init/database/inspect' && method === 'POST') {
      if (!databaseExists) {
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'database_missing',
            message: 'Cannot inspect the database because the DB file does not exist.',
            details: {
              database: {
                absolutePath: databasePath,
                exists: false,
              },
            },
            schemaVersion: 1,
          }),
          { status: 404, headers: { 'content-type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Inspected 9 table/view object(s).'],
          database: {
            absolutePath: databasePath,
            exists: true,
          },
          inspection: {
            tableCount: 9,
            tables: [
              { name: 'canonical_media_assets' },
              { name: 'media_asset_variants' },
              { name: 'address_cache' },
              { name: 'parse_files_for_gps_queue' },
              { name: 'geocode_queue' },
              { name: 'slideshow_queue' },
              { name: 'runtime_state' },
              { name: 'action_runs' },
              { name: 'system_logs' },
            ],
          },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/init/database/recreate-empty' && method === 'POST') {
      if (!body?.confirm || body?.action !== 'recreate-db') {
        return new Response(
          JSON.stringify({ status: 'error', error: 'missing_confirmation', schemaVersion: 1 }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        );
      }

      databaseExists = true;
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Recreated SQLite database and applied canonical schema tables.'],
          confirmed: true,
          database: {
            absolutePath: databasePath,
            existsAfter: true,
          },
          schemaBootstrap: {
            applied: true,
            requiredTables: [
              'canonical_media_assets',
              'media_asset_variants',
              'address_cache',
              'parse_files_for_gps_queue',
              'geocode_queue',
              'slideshow_queue',
              'runtime_state',
              'action_runs',
              'system_logs',
            ],
          },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/init/database/delete' && method === 'POST') {
      if (!body?.confirm || body?.action !== 'delete-db') {
        return new Response(
          JSON.stringify({ status: 'error', error: 'missing_confirmation', schemaVersion: 1 }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        );
      }

      databaseExists = false;
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Removed 1 database artifact(s).'],
          confirmed: true,
          database: {
            absolutePath: databasePath,
            existsAfter: false,
          },
          removedPaths: [databasePath],
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

    behavior.runAction('check-db');
    assert.equal(harness.state.statusByKey['2A'], 'running');
    await waitFor(() => harness.state.initResults['2A']?.outcome === 'success');
    assert.equal(harness.state.statusByKey['2A'], 'info');
    assert.equal(harness.state.initResults['2A']?.endpoint, '/api/init/database/status');
    assert.equal(harness.state.initResults['2A']?.payload?.database?.exists, false);

    behavior.runAction('inspect-db');
    await waitFor(() => harness.state.initResults['2A']?.outcome === 'error');
    assert.equal(harness.state.statusByKey['2A'], 'error');
    assert.equal(harness.state.initResults['2A']?.endpoint, '/api/init/database/inspect');
    assert.equal(harness.state.initResults['2A']?.errorPayload?.error, 'database_missing');

    behavior.runAction('recreate-db', { confirmationSource: 'window.confirm' });
    await waitFor(() => harness.state.initResults['2A']?.operation === 'Recreate DB' && harness.state.initResults['2A']?.outcome === 'success');
    assert.equal(harness.state.statusByKey['2A'], 'success');
    assert.equal(harness.state.initResults['2A']?.endpoint, '/api/init/database/recreate-empty');
    assert.equal(harness.state.initResults['2A']?.payload?.confirmed, true);
    assert.equal(harness.state.initResults['2A']?.payload?.database?.existsAfter, true);
    assert.equal(harness.state.initResults['2A']?.payload?.schemaBootstrap?.applied, true);

    behavior.runAction('inspect-db');
    await waitFor(() => harness.state.initResults['2A']?.operation === 'Inspect DB' && harness.state.initResults['2A']?.outcome === 'success');
    assert.equal(harness.state.statusByKey['2A'], 'success');
    assert.equal(harness.state.initResults['2A']?.payload?.inspection?.tableCount, 9);

    behavior.runAction('delete-db', { confirmationSource: 'window.confirm' });
    await waitFor(() => harness.state.initResults['2A']?.operation === 'Delete DB' && harness.state.initResults['2A']?.outcome === 'success');
    assert.equal(harness.state.statusByKey['2A'], 'success');
    assert.equal(harness.state.initResults['2A']?.endpoint, '/api/init/database/delete');
    assert.equal(harness.state.initResults['2A']?.payload?.confirmed, true);
    assert.deepEqual(harness.state.initResults['2A']?.payload?.removedPaths, [databasePath]);

    behavior.runAction('check-db');
    await waitFor(() => harness.state.initResults['2A']?.operation === 'Check DB' && harness.state.initResults['2A']?.outcome === 'success');
    assert.equal(harness.state.statusByKey['2A'], 'info');
    assert.equal(harness.state.initResults['2A']?.payload?.database?.exists, false);

    assert.equal(requests.length, 6);
    assert.deepEqual(
      requests.map(({ path, method }) => ({ path, method })),
      [
        { path: '/api/init/database/status', method: 'GET' },
        { path: '/api/init/database/inspect', method: 'POST' },
        { path: '/api/init/database/recreate-empty', method: 'POST' },
        { path: '/api/init/database/inspect', method: 'POST' },
        { path: '/api/init/database/delete', method: 'POST' },
        { path: '/api/init/database/status', method: 'GET' },
      ],
    );

    assert.deepEqual(requests[2].body, {
      confirm: true,
      action: 'recreate-db',
      confirmationSource: 'window.confirm',
    });
    assert.deepEqual(requests[4].body, {
      confirm: true,
      action: 'delete-db',
      confirmationSource: 'window.confirm',
    });
  } finally {
    global.fetch = originalFetch;
  }
});

function createRuntimeTruthHarness() {
  const state = createInitialState();
  const fixedIso = '2026-04-22T18:15:00.000Z';
  const fixedTallinn = '22.04.2026, 21:15:00';
  const stamp = () => '21:15:00';

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
  throw new Error('Timed out while waiting for the 2A action to finish.');
}
