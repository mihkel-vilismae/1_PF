import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntryPath = path.join(repoRoot, 'server', 'index.ts');

test('screen simulation API accepts valid simulation config and returns simulation-only state', async () => {
  await withScreenSimulationServer(async ({ port }) => {
    const response = await requestJson(port, '/api/runtime/screen-simulation/configure', {
      method: 'POST',
      body: {
        simulation: {
          pirEnabled: false,
          mouseEnabled: false,
          keyboardEnabled: false,
          simulateAllEnabled: false,
          inactivityTimeoutSeconds: 12,
        },
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.json.status, 'ok');
    assert.equal(response.json.simulationOnly, true);
    assert.equal(response.json.screen.screenState, 'OFF');
    assert.equal(response.json.screen.inactivityTimeoutSeconds, 12);
    assert.match(response.json.messages.join(' '), /does not control or report real screen hardware/);

    const stateResponse = await requestJson(port, '/api/runtime/screen-simulation/state');
    assert.equal(stateResponse.status, 200);
    assert.deepEqual(stateResponse.json, response.json);
  });
});

test('screen simulation API rejects invalid simulation config', async () => {
  await withScreenSimulationServer(async ({ port }) => {
    const response = await requestJson(port, '/api/runtime/screen-simulation/configure', {
      method: 'POST',
      body: {
        simulation: {
          pirEnabled: true,
          mouseEnabled: true,
          keyboardEnabled: true,
          simulateAllEnabled: true,
          inactivityTimeoutSeconds: 0,
        },
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.json.status, 'error');
    assert.equal(response.json.error, 'invalid_screen_simulation_timeout');
  });
});

async function withScreenSimulationServer(run) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'pf-screen-simulation-'));
  const port = await reservePort();
  const envFilePath = path.join(workspaceRoot, 'screen-simulation.test.env');
  const dbPath = path.join(workspaceRoot, 'state', 'test.sqlite');
  const downloadDir = path.join(workspaceRoot, 'downloads');
  const logDir = path.join(workspaceRoot, 'logs');
  const cookieDir = path.join(workspaceRoot, 'cookies');

  await Promise.all([
    mkdir(path.dirname(dbPath), { recursive: true }),
    mkdir(downloadDir, { recursive: true }),
    mkdir(logDir, { recursive: true }),
    mkdir(cookieDir, { recursive: true }),
  ]);

  await writeFile(envFilePath, buildEnvFile({ downloadDir, dbPath, logDir, cookieDir }), 'utf8');

  const child = spawn(process.execPath, ['--import', 'tsx', serverEntryPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      INIT_ENV_FILE: envFilePath,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  let stdout = '';
  let stderr = '';
  const ready = new Promise((resolve, reject) => {
    const fail = (error) => {
      reject(new Error(`${error.message}\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    };

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (/Init API server listening on http:\/\/127\.0\.0\.1:\d+/.test(stdout)) {
        resolve();
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.once('error', fail);
    child.once('exit', (code, signal) => {
      fail(new Error(`server exited before becoming ready (code=${code}, signal=${signal ?? 'null'})`));
    });
  });

  try {
    await ready;
    await run({ port, workspaceRoot });
  } finally {
    child.kill();
    await onceExit(child);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
}

async function requestJson(port, pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'content-type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return {
    status: response.status,
    json: await response.json(),
  };
}

async function reservePort() {
  const server = net.createServer();

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    await new Promise((resolve) => server.close(resolve));
    throw new Error('Unable to reserve a local port for screen simulation tests.');
  }

  const { port } = address;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function onceExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    child.once('exit', resolve);
  });
}

function buildEnvFile({ downloadDir, dbPath, logDir, cookieDir }) {
  return [
    'user=test@example.com',
    'pw=super-secret-password',
    `DOWNLOAD_DIR=${downloadDir}`,
    `DB_PATH=${dbPath}`,
    `LOG_DIR=${logDir}`,
    `ICLOUDPD_COOKIE_DIR=${cookieDir}`,
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
