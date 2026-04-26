import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntryPath = path.join(repoRoot, 'server', 'index.js');

test('GET /api/auth/status returns only the safe public projection', async () => {
  await withAuthServer(buildEnvFile(), async ({ port }) => {
    const response = await requestJson(port, '/api/auth/status', { method: 'GET' });

    assert.equal(response.status, 200);
    assert.equal(response.json.status, 'ok');
    assert.deepEqual(Object.keys(response.json.auth).sort(), expectedAuthKeys());
    assert.equal(response.json.auth.status, 'idle');
    assert.equal(response.json.auth.provider, 'icloud');
    assert.equal(JSON.stringify(response.json).includes('super-secret-password'), false);
  });
});

test('POST /api/auth/verify-icloudpd checks executable/config without claiming login', async () => {
  await withAuthServer(buildEnvFile(), async ({ port }) => {
    const response = await requestJson(port, '/api/auth/verify-icloudpd', { method: 'POST' });

    assert.equal(response.status, 400);
    assert.equal(response.json.status, 'error');
    assert.equal(response.json.readiness.hasRequiredConfig, true);
    assert.equal(response.json.readiness.icloudpdAvailable, false);
    assert.equal(response.json.readiness.code, 'icloudpd_executable_unavailable');
    assert.equal(response.json.readiness.next_action, 'install_or_configure_icloudpd');
    assert.equal(response.json.auth.status, 'idle');
    assert.equal(response.json.auth.authenticatedUser, null);
    assert.equal(JSON.stringify(response.json).includes('super-secret-password'), false);
  });
});

test('POST /api/auth/run reaches provider boundary but does not fake login success', async () => {
  await withAuthServer(buildEnvFile(), async ({ port }) => {
    const before = await requestJson(port, '/api/auth/status', { method: 'GET' });
    const response = await requestJson(port, '/api/auth/run', { method: 'POST' });
    const after = await requestJson(port, '/api/auth/status', { method: 'GET' });

    assert.equal(response.status, 502);
    assert.equal(response.json.status, 'error');
    assert.equal(response.json.auth.status, 'provider_failed');
    assert.equal(response.json.auth.has_required_files, true);
    assert.equal(response.json.auth.next_action, 'install_or_configure_icloudpd');
    assert.equal(response.json.auth.error.code, 'icloudpd_executable_unavailable');
    assert.equal(response.json.auth.authenticatedUser, null);
    assert.equal(typeof response.json.auth.attemptId, 'string');
    assert.notEqual(response.json.auth.attemptId, before.json.auth.attemptId);
    assert.ok(Date.parse(response.json.auth.updatedAt) > 0);
    assert.deepEqual(after.json.auth, response.json.auth);
    assert.equal(JSON.stringify(response.json).includes('super-secret-password'), false);
  });
});

test('POST /api/auth/run fails honestly when required auth inputs are missing', async () => {
  await withAuthServer(buildEnvFile({ includePassword: false }), async ({ port }) => {
    const response = await requestJson(port, '/api/auth/run', { method: 'POST' });

    assert.equal(response.status, 400);
    assert.equal(response.json.status, 'error');
    assert.equal(response.json.auth.status, 'preflight_failed');
    assert.equal(response.json.auth.has_required_files, false);
    assert.equal(response.json.auth.next_action, 'fix_auth_configuration');
    assert.equal(response.json.auth.error.code, 'auth_preflight_missing_required_inputs');
    assert.deepEqual(response.json.auth.error.missingRequiredKeys, ['pw']);
    assert.equal(response.json.auth.authenticatedUser, null);
    assert.equal(JSON.stringify(response.json).includes('super-secret-password'), false);
  });
});

test('POST /api/auth/reset clears local attempt state and does not claim logout', async () => {
  await withAuthServer(buildEnvFile(), async ({ port }) => {
    const runResponse = await requestJson(port, '/api/auth/run', { method: 'POST' });
    assert.equal(runResponse.status, 502);
    assert.equal(runResponse.json.status, 'error');
    assert.equal(runResponse.json.auth.status, 'provider_failed');

    const resetResponse = await requestJson(port, '/api/auth/reset', { method: 'POST' });

    assert.equal(resetResponse.status, 200);
    assert.equal(resetResponse.json.status, 'ok');
    assert.equal(resetResponse.json.resetType, 'local_auth_attempt_state_only');
    assert.equal(resetResponse.json.logoutPerformed, false);
    assert.equal(resetResponse.json.auth.status, 'idle');
    assert.equal(resetResponse.json.auth.attemptId, null);
    assert.equal(resetResponse.json.auth.error, null);
    assert.equal(resetResponse.json.auth.authenticatedUser, null);
  });
});

async function withAuthServer(envContent, run) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'pf-auth-api-step1-'));
  const port = await reservePort();
  const envFilePath = path.join(workspaceRoot, 'auth.test.env');

  await writeFile(envFilePath, envContent, 'utf8');

  const child = spawn(process.execPath, [serverEntryPath], {
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
    await run({ port, envFilePath, workspaceRoot });
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
    throw new Error('Unable to reserve a local port for auth API tests.');
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

function buildEnvFile({ includePassword = true } = {}) {
  const root = path.join(os.tmpdir(), 'pf-auth-env-values');
  return [
    'user=test@example.com',
    includePassword ? 'pw=super-secret-password' : null,
    `DOWNLOAD_DIR=${path.join(root, 'downloads')}`,
    `DB_PATH=${path.join(root, 'state.sqlite')}`,
    `LOG_DIR=${path.join(root, 'logs')}`,
    `ICLOUDPD_COOKIE_DIR=${path.join(root, 'cookies')}`,
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
  ].filter(Boolean).join('\n');
}

function expectedAuthKeys() {
  return [
    'status',
    'has_required_files',
    'requires_2fa',
    'two_factor_status',
    'two_factor_method',
    'next_action',
    'attemptId',
    'updatedAt',
    'error',
    'authenticatedUser',
    'provider',
  ].sort();
}
