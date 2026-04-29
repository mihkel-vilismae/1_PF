import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile, access } from 'node:fs/promises';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntryPath = path.join(repoRoot, 'server', 'index.ts');

test('POST /api/init/verify-env validates the temp env file', async () => {
  await withInitServer(async ({ port, dbPath }) => {
    const { status, json } = await requestJson(port, '/api/init/verify-env', { method: 'POST' });

    assert.equal(status, 200);
    assert.equal(json.status, 'ok');
    assert.equal(json.schemaVersion, 1);
    const requiredCount = json.checks.filter((check) => check.required).length;
    assert.deepEqual(json.messages, [`Validated ${requiredCount} required key(s).`]);

    const dbCheck = json.checks.find((check) => check.key === 'DB_PATH');
    assert.ok(dbCheck);
    assert.equal(dbCheck.present, true);
    assert.equal(dbCheck.valid, true);
    assert.equal(dbCheck.details.absolutePath, dbPath);

    const optionalCheck = json.checks.find((check) => check.key === 'GEONAMES_USERNAME');
    assert.ok(optionalCheck);
    assert.equal(optionalCheck.present, false);
    assert.equal(optionalCheck.required, false);
  });
});

test('POST /api/init/database/* follows the recreate/status/inspect/delete flow with confirmation guards', async () => {
  await withInitServer(async ({ port, dbPath }) => {
    const statusBefore = await requestJson(port, '/api/init/database/status', { method: 'GET' });
    assert.equal(statusBefore.status, 200);
    assert.equal(statusBefore.json.status, 'warning');
    assert.equal(statusBefore.json.database.exists, false);

    const inspectMissing = await requestJson(port, '/api/init/database/inspect', { method: 'POST' });
    assert.equal(inspectMissing.status, 404);
    assert.equal(inspectMissing.json.error, 'database_missing');
    assert.equal(inspectMissing.json.details.database.absolutePath, dbPath);

    const recreateRejected = await requestJson(port, '/api/init/database/recreate-empty', {
      method: 'POST',
      body: { action: 'recreate-db' },
    });
    assert.equal(recreateRejected.status, 400);
    assert.equal(recreateRejected.json.error, 'missing_confirmation');
    await assert.rejects(access(dbPath));

    const recreateAccepted = await requestJson(port, '/api/init/database/recreate-empty', {
      method: 'POST',
      body: { confirm: true, action: 'recreate-db' },
    });
    assert.equal(recreateAccepted.status, 200);
    assert.equal(recreateAccepted.json.status, 'ok');
    assert.equal(recreateAccepted.json.confirmed, true);
    assert.equal(recreateAccepted.json.database.existsAfter, true);
    assert.equal(recreateAccepted.json.schemaBootstrap?.applied, true);
    assert.ok(Array.isArray(recreateAccepted.json.schemaBootstrap?.requiredTables));
    assert.ok(recreateAccepted.json.schemaBootstrap.requiredTables.includes('runtime_state'));
    await access(dbPath);

    const statusAfterRecreate = await requestJson(port, '/api/init/database/status', { method: 'GET' });
    assert.equal(statusAfterRecreate.status, 200);
    assert.equal(statusAfterRecreate.json.status, 'ok');
    assert.equal(statusAfterRecreate.json.database.exists, true);

    const inspectAfterRecreate = await requestJson(port, '/api/init/database/inspect', { method: 'POST' });
    assert.equal(inspectAfterRecreate.status, 200);
    assert.equal(inspectAfterRecreate.json.status, 'ok');
    assert.ok(inspectAfterRecreate.json.inspection.tableCount >= 9);
    const tableNames = inspectAfterRecreate.json.inspection.tables.map((table) => table.name);
    assert.ok(tableNames.includes('canonical_media_assets'));
    assert.ok(tableNames.includes('runtime_state'));
    assert.ok(tableNames.includes('system_logs'));

    const deleteRejected = await requestJson(port, '/api/init/database/delete', {
      method: 'POST',
      body: { confirm: true, action: 'recreate-db' },
    });
    assert.equal(deleteRejected.status, 400);
    assert.equal(deleteRejected.json.error, 'missing_confirmation');
    await access(dbPath);

    const deleteAccepted = await requestJson(port, '/api/init/database/delete', {
      method: 'POST',
      body: { confirm: true, action: 'delete-db' },
    });
    assert.equal(deleteAccepted.status, 200);
    assert.equal(deleteAccepted.json.status, 'ok');
    assert.equal(deleteAccepted.json.confirmed, true);
    assert.ok(deleteAccepted.json.removedPaths.includes(dbPath));
    await assert.rejects(access(dbPath));

    const statusAfterDelete = await requestJson(port, '/api/init/database/status', { method: 'GET' });
    assert.equal(statusAfterDelete.status, 200);
    assert.equal(statusAfterDelete.json.status, 'warning');
    assert.equal(statusAfterDelete.json.database.exists, false);

    const inspectAfterDelete = await requestJson(port, '/api/init/database/inspect', { method: 'POST' });
    assert.equal(inspectAfterDelete.status, 404);
    assert.equal(inspectAfterDelete.json.error, 'database_missing');
  });
});

test('GET /api/init/cron/status and /api/init/cron/print expose scheduler capability payloads', async () => {
  await withInitServer(async ({ port }) => {
    const statusResponse = await requestJson(port, '/api/init/cron/status', { method: 'GET' });
    assert.equal(statusResponse.status, 200);
    assert.equal(statusResponse.json.schemaVersion, 3);
    assert.equal(statusResponse.json.scheduler.operation, 'status');
    assert.equal(statusResponse.json.scheduler.routeCompatibility, '/api/init/cron/*');
    assert.ok(Array.isArray(statusResponse.json.messages));
    assert.ok(['supported', 'deferred', 'unsupported'].includes(statusResponse.json.scheduler.operationSupportLevel));

    const printResponse = await requestJson(port, '/api/init/cron/print', { method: 'GET' });
    assert.equal(printResponse.status, 200);
    assert.equal(printResponse.json.schemaVersion, 3);
    assert.equal(printResponse.json.scheduler.operation, 'print');
    assert.equal(printResponse.json.scheduler.routeCompatibility, '/api/init/cron/*');
    assert.ok(Array.isArray(printResponse.json.messages));
    assert.ok(['supported', 'deferred', 'unsupported'].includes(printResponse.json.scheduler.operationSupportLevel));

    if (printResponse.json.scheduler.operationSupportLevel === 'supported') {
      assert.equal(typeof printResponse.json.scheduler.task?.installed, 'boolean');
    }
  });
});

async function withInitServer(run) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'pf-init-api-step1-'));
  const port = await reservePort();
  const envFilePath = path.join(workspaceRoot, 'init.test.env');
  const dbPath = path.join(workspaceRoot, 'state', 'init-test.sqlite');
  const downloadDir = path.join(workspaceRoot, 'downloads');
  const logDir = path.join(workspaceRoot, 'logs');
  const cookieDir = path.join(workspaceRoot, 'cookies');

  await writeFile(
    envFilePath,
    buildEnvFile({
      downloadDir,
      dbPath,
      logDir,
      cookieDir,
    }),
    'utf8',
  );

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
    await run({ port, dbPath, envFilePath, workspaceRoot });
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
    throw new Error('Unable to reserve a local port for init API tests.');
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

// Custom helper similar to withInitServer but allows supplying a bespoke .env file.
// It writes the provided envContent to a temporary file, starts the init server with that file,
// waits for the server to be ready, executes the provided callback, then tears everything down.
async function withCustomEnvServer(envContent, run) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'pf-init-api-custom-'));
  const port = await reservePort();
  const envFilePath = path.join(workspaceRoot, 'custom.env');
  await writeFile(envFilePath, envContent, 'utf8');

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
    await run({ port, envFilePath, workspaceRoot });
  } finally {
    child.kill();
    await onceExit(child);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
}

test('POST /api/init/verify-env rejects overlapping real and test paths', async () => {
  // Create a custom .env file that intentionally overlaps test and real paths.
  await withCustomEnvServer(
    (() => {
      // Construct base values using a temporary workspace directory.
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-env-overlap-'));
      const downloadDir = path.join(tempRoot, 'downloads');
      const dbPath = path.join(tempRoot, 'state', 'init-test.sqlite');
      const logDir = path.join(tempRoot, 'logs');
      const cookieDir = path.join(tempRoot, 'cookies');
      // Build base env content from the existing helper.
      const base = buildEnvFile({ downloadDir, dbPath, logDir, cookieDir });
      // Append overlapping test paths. Use the same real paths to simulate overlap.
      const lines = [
        base,
        `TEST_DOWNLOAD_DIR=${downloadDir}`,
        `TEST_DB_PATH=${dbPath}`,
        `TEST_LOG_DIR=${logDir}`,
        `TEST_ICLOUDPD_COOKIE_DIR=${cookieDir}`,
      ];
      return lines.join('\n');
    })(),
    async ({ port }) => {
      const response = await requestJson(port, '/api/init/verify-env', { method: 'POST' });
      // The HTTP status should still be 200, but payload status should be 'error'.
      assert.equal(response.status, 200);
      assert.equal(response.json.status, 'error');
      // It should emit at least one message about overlap.
      assert.ok(response.json.messages.some((m) => /overlap/i.test(m)));
    },
  );
});
