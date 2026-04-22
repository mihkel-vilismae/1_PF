import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Wave E orchestration tests

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntryPath = path.join(repoRoot, 'server', 'index.js');

async function reservePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Failed to reserve a port');
  }
  const port = address.port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function requestJson(port, pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'content-type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await response.json();
  return { status: response.status, json };
}

function buildEnvFile({ downloadDir, dbPath, logDir, cookieDir, mockDownloadSourceDir }) {
  return [
    'user=test@example.com',
    'pw=super-secret-password',
    `DOWNLOAD_DIR=${downloadDir}`,
    `DB_PATH=${dbPath}`,
    `LOG_DIR=${logDir}`,
    `ICLOUDPD_COOKIE_DIR=${cookieDir}`,
    `MOCK_DOWNLOAD_SOURCE_DIR=${mockDownloadSourceDir}`,
    'DOWNLOAD_RECENT=7',
    'GEOCODE_LANGUAGE=en',
    'GEOCODE_BATCH_SIZE=25',
    'LOCK_TIMEOUT_SECONDS=30',
    'REGULAR_WORKER_STALE_SECONDS=60',
    'PLAYBACK_WORKER_STALE_SECONDS=60',
    'REGULAR_WORKER_HEARTBEAT_SECONDS=15',
    'PLAYBACK_WORKER_HEARTBEAT_SECONDS=15',
    'WORKER_LOCK_RECLAIM_CONFLICT_THRESHOLD=2',
    'REGULAR_WORKER_FORCE_RECLAIM_AFTER_SECONDS=120',
    'PLAYBACK_WORKER_FORCE_RECLAIM_AFTER_SECONDS=120',
    'GEOCODE_CACHE_KEY_DECIMALS=5',
    'UNRESOLVED_ASSET_POLICY=keep',
    'PLAYBACK_RESTART_POLICY=restart',
    'VIDEO_SHOWN_POLICY=allow',
    'CLEANUP_ENABLED=true',
    'MEDIA_RETENTION_DAYS=30',
    'LOG_RETENTION_DAYS=14',
    'PLAYBACK_LEASE_SECONDS=45',
  ].join('\n');
}

async function withOrchestrationServer({ fixtureFiles, mockSourceMissing = false }, run) {
  // Create a temporary workspace
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'waveE-step5-'));
  const port = await reservePort();
  const downloadDir = path.join(workspace, 'downloads');
  const mockDownloadSourceDir = path.join(workspace, 'mock-download-source');
  const dbDir = path.join(workspace, 'db');
  const logDir = path.join(workspace, 'logs');
  const cookieDir = path.join(workspace, 'cookies');
  await Promise.all([
    mkdir(downloadDir, { recursive: true }),
    ...(mockSourceMissing ? [] : [mkdir(mockDownloadSourceDir, { recursive: true })]),
    mkdir(dbDir, { recursive: true }),
    mkdir(logDir, { recursive: true }),
    mkdir(cookieDir, { recursive: true }),
  ]);
  const dbPath = path.join(dbDir, 'test.sqlite');
  // Copy fixture files into the mock download source directory.
  for (const srcPath of fixtureFiles) {
    const fileName = path.basename(srcPath);
    if (!mockSourceMissing) {
      await cp(srcPath, path.join(mockDownloadSourceDir, fileName));
    }
  }
  const envFilePath = path.join(workspace, '.env');
  await writeFile(
    envFilePath,
    buildEnvFile({ downloadDir, dbPath, logDir, cookieDir, mockDownloadSourceDir }),
    'utf8',
  );
  // Spawn the server
  const child = spawn(process.execPath, [serverEntryPath], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(port), INIT_ENV_FILE: envFilePath },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  let stdout = '';
  let stderr = '';
  const ready = new Promise((resolve, reject) => {
    const fail = (error) => reject(new Error(`${error.message}\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (/Init API server listening on http:\/\/127\.0\.0\.1:\d+/.test(stdout)) resolve();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', fail);
    child.once('exit', (code, signal) => fail(new Error(`server exited before becoming ready (code=${code}, signal=${signal ?? 'null'})`)));
  });
  try {
    await ready;
    await run({ port, dbPath, downloadDir });
  } finally {
    child.kill();
    await new Promise((resolve) => child.once('exit', resolve));
    await rm(workspace, { recursive: true, force: true });
  }
}

// --- Tests ---

test('Wave E orchestrator success run', { timeout: 30000 }, async () => {
  // Use a fixture with valid GPS data to ensure success path
  const gpsFixture = path.join(repoRoot, 'generated_test_data', 'gps_valid', 'gps_valid_01.jpg');
  await withOrchestrationServer({ fixtureFiles: [gpsFixture] }, async ({ port }) => {
    // Reset the database
    const recreateResponse = await requestJson(port, '/api/init/database/recreate-empty', {
      method: 'POST',
      body: { confirm: true, action: 'recreate-db' },
    });
    console.log('DEBUG recreate empty response', recreateResponse.status, recreateResponse.json);
    assert.equal(recreateResponse.status, 200, `recreate-empty failed with status ${recreateResponse.status} and body ${JSON.stringify(recreateResponse.json)}`);
    assert.equal(recreateResponse.json.status, 'ok', `recreate-empty responded with ${JSON.stringify(recreateResponse.json)}`);
    // Trigger orchestrator run
    const runResponse = await requestJson(port, '/api/runtime/orchestration/run', {
      method: 'POST',
      body: {},
    });
    console.log('DEBUG run response', runResponse.status, runResponse.json);
    assert.equal(runResponse.status, 200, `orchestration run failed with status ${runResponse.status} and body ${JSON.stringify(runResponse.json)}`);
    const state = runResponse.json;
    // Validate success state
    assert.equal(state.status, 'SUCCEEDED');
    assert.equal(state.failed_stage, null);
    assert.equal(state.run_id >= 1, true);
    assert.equal(state.current_stage, 'playback_select');
    assert.equal(state.last_successful_stage, 'playback_select');
    assert.ok(Array.isArray(state.stage_order_executed));
    assert.deepEqual(state.stage_order_executed, [
      'download',
      'index',
      'gps',
      'geocode',
      'queue_prepare',
      'playback_select',
    ]);
    assert.ok(state.stage_results);
    assert.equal(Object.keys(state.stage_results).length, 6);
    assert.ok(state.stage_results.download);
    assert.ok(state.stage_results.index);
    assert.ok(state.stage_results.gps);
    assert.ok(state.stage_results.geocode);
    assert.ok(state.stage_results.queue_prepare);
    assert.ok(state.stage_results.playback_select);
    assert.ok(state.selected_asset_summary !== null);
    assert.ok(state.finished_at !== null);
    // Verify current and last endpoints
    const currentResponse = await requestJson(port, '/api/runtime/orchestration/current');
    assert.equal(currentResponse.status, 200);
    assert.deepEqual(currentResponse.json, state);
    const lastResponse = await requestJson(port, '/api/runtime/orchestration/last');
    assert.equal(lastResponse.status, 200);
    assert.deepEqual(lastResponse.json, state);
  });
});

test('Wave E orchestrator controlled failure path', { timeout: 30000 }, async () => {
  await withOrchestrationServer({ fixtureFiles: [], mockSourceMissing: true }, async ({ port }) => {
    // Reset the database
    const recreateResponse = await requestJson(port, '/api/init/database/recreate-empty', {
      method: 'POST',
      body: { confirm: true, action: 'recreate-db' },
    });
    console.log('DEBUG recreate empty response', recreateResponse.status, recreateResponse.json);
    assert.equal(recreateResponse.status, 200, `recreate-empty failed with status ${recreateResponse.status} and body ${JSON.stringify(recreateResponse.json)}`);
    assert.equal(recreateResponse.json.status, 'ok', `recreate-empty responded with ${JSON.stringify(recreateResponse.json)}`);
    // Trigger orchestrator run
    const runResponse = await requestJson(port, '/api/runtime/orchestration/run', {
      method: 'POST',
      body: {},
    });
    console.log('DEBUG run response', runResponse.status, runResponse.json);
    assert.equal(runResponse.status, 200, `orchestration run failed with status ${runResponse.status} and body ${JSON.stringify(runResponse.json)}`);
    const state = runResponse.json;
    // Validate failure state
    assert.equal(state.status, 'FAILED');
    assert.equal(state.failed_stage, 'download');
    assert.ok(state.failure_reason);
    assert.equal(state.run_id >= 1, true);
    assert.ok(state.finished_at !== null);
    assert.equal(state.last_successful_stage, null);
    assert.deepEqual(state.stage_order_executed, ['download']);
    assert.deepEqual(state.stage_results, {});
    // Verify current and last endpoints
    const currentResponse = await requestJson(port, '/api/runtime/orchestration/current');
    assert.equal(currentResponse.status, 200);
    assert.deepEqual(currentResponse.json, state);
    const lastResponse = await requestJson(port, '/api/runtime/orchestration/last');
    assert.equal(lastResponse.status, 200);
    assert.deepEqual(lastResponse.json, state);
  });
});

test('Wave E orchestrator inspection shape without runs', { timeout: 30000 }, async () => {
  await withOrchestrationServer({ fixtureFiles: [] }, async ({ port }) => {
    // Reset the database
    const recreateResponse = await requestJson(port, '/api/init/database/recreate-empty', {
      method: 'POST',
      body: { confirm: true, action: 'recreate-db' },
    });
    console.log('DEBUG recreate empty response', recreateResponse.status, recreateResponse.json);
    assert.equal(recreateResponse.status, 200, `recreate-empty failed with status ${recreateResponse.status} and body ${JSON.stringify(recreateResponse.json)}`);
    assert.equal(recreateResponse.json.status, 'ok', `recreate-empty responded with ${JSON.stringify(recreateResponse.json)}`);
    // Query current state before any run
    const currentResponse = await requestJson(port, '/api/runtime/orchestration/current');
    assert.equal(currentResponse.status, 200);
    const current = currentResponse.json;
    assert.equal(current.run_id, null);
    assert.equal(current.status, 'NOT_RUNNING');
    assert.equal(current.current_stage, null);
    assert.equal(current.last_successful_stage, null);
    assert.deepEqual(current.stage_order_executed, []);
    assert.deepEqual(current.stage_results, {});
    // last should be null
    const lastResponse = await requestJson(port, '/api/runtime/orchestration/last');
    assert.equal(lastResponse.status, 200);
    assert.equal(lastResponse.json, null);
  });
});
