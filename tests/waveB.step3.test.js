import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { access, chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntryPath = path.join(repoRoot, 'server', 'index.js');
const schemaPath = path.join(repoRoot, 'schema.sql');

test('POST /api/runtime/download/run succeeds with icloudpd on PATH and writes one image', async () => {
  await withRuntimeServer(
    {
      fakeIcloudPd: true,
      schemaDb: false,
    },
    async ({ port, downloadDir }) => {
      const response = await requestJson(port, '/api/runtime/download/run', {
        method: 'POST',
        body: {},
      });

      assert.ok(['ok', 'success'].includes(response.json?.status), `unexpected status: ${response.json?.status}`);
      assert.ok(response.status < 400, `expected a successful HTTP response, got ${response.status}`);

      const downloadedFile = path.join(downloadDir, 'fake-icloudpd-download.jpg');
      await access(downloadedFile);
      const fileContents = await readFile(downloadedFile, 'utf8');
      assert.match(fileContents, /fake icloudpd download/i);
    },
  );
});

test('POST /api/runtime/download/run reports blocked/error when icloudpd is missing', async () => {
  await withRuntimeServer(
    {
      fakeIcloudPd: false,
      missingIcloudPd: true,
      schemaDb: false,
    },
    async ({ port }) => {
      const response = await requestJson(port, '/api/runtime/download/run', {
        method: 'POST',
        body: {},
      });

      assert.ok(['blocked', 'error'].includes(response.json?.status), `unexpected status: ${response.json?.status}`);
      assert.notEqual(response.status, 404, 'expected a handled endpoint response, not a missing route');
    },
  );
});

test('POST /api/runtime/index/run bootstraps schema on a fresh repo-managed DB', async () => {
  await withRuntimeServer(
    {
      fakeIcloudPd: false,
      schemaDb: false,
    },
    async ({ port, dbPath, downloadDir }) => {
      await writeFile(path.join(downloadDir, 'alpha.jpg'), 'alpha image payload', 'utf8');
      await writeFile(path.join(downloadDir, 'beta.jpg'), 'beta image payload', 'utf8');

      const recreateResponse = await requestJson(port, '/api/init/database/recreate-empty', {
        method: 'POST',
        body: { confirm: true, action: 'recreate-db' },
      });

      assert.equal(recreateResponse.status, 200);
      assert.equal(recreateResponse.json.status, 'ok');

      const response = await requestJson(port, '/api/runtime/index/run', {
        method: 'POST',
        body: {},
      });

      assert.ok(
        response.status < 400,
        `expected fresh-db index run to succeed, got HTTP ${response.status} payload=${JSON.stringify(response.json)}`,
      );
      assert.ok(['ok', 'success'].includes(response.json?.status), `unexpected status: ${response.json?.status}`);
      assert.equal(response.json.indexing?.schemaBootstrap?.applied, true);
      assert.equal(path.normalize(response.json.indexing?.schemaBootstrap?.schemaPath), path.normalize(schemaPath));

      const counts = await readIndexCounts(dbPath);
      assert.deepEqual(counts, {
        canonical_media_assets: 2,
        media_asset_variants: 2,
        parse_files_for_gps_queue: 2,
      });
    },
  );
});

test('POST /api/runtime/index/run indexes downloaded media into canonical tables idempotently', async () => {
  await withRuntimeServer(
    {
      fakeIcloudPd: false,
      schemaDb: true,
      keepOriginalPath: true,
    },
    async ({ port, dbPath, downloadDir }) => {
      const response1 = await requestJson(port, '/api/runtime/index/run', {
        method: 'POST',
        body: {},
      });

      assert.ok(
        response1.status < 400,
        `expected index run to succeed, got HTTP ${response1.status} payload=${JSON.stringify(response1.json)}`,
      );
      assert.ok(['ok', 'success'].includes(response1.json?.status), `unexpected status: ${response1.json?.status}`);

      const firstCounts = await readIndexCounts(dbPath);
      assert.deepEqual(firstCounts, {
        canonical_media_assets: 2,
        media_asset_variants: 2,
        parse_files_for_gps_queue: 2,
      });

      const canonicalRows = await queryRows(
        dbPath,
        `SELECT asset_key, original_filename, canonical_path
         FROM canonical_media_assets
         ORDER BY original_filename`,
      );

      assert.deepEqual(
        canonicalRows.map((row) => row.original_filename),
        ['alpha.jpg', 'beta.jpg'],
      );
      assert.deepEqual(
        canonicalRows.map((row) => path.normalize(row.canonical_path)),
        [
          path.normalize(path.join(downloadDir, 'alpha.jpg')),
          path.normalize(path.join(downloadDir, 'beta.jpg')),
        ],
      );

      const response2 = await requestJson(port, '/api/runtime/index/run', {
        method: 'POST',
        body: {},
      });

      assert.ok(response2.status < 400, `expected index rerun to succeed, got HTTP ${response2.status}`);
      assert.ok(['ok', 'success'].includes(response2.json?.status), `unexpected status: ${response2.json?.status}`);

      const secondCounts = await readIndexCounts(dbPath);
      assert.deepEqual(secondCounts, firstCounts);
    },
  );
});

async function withRuntimeServer(options, run) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'pf-waveb-step3-'));
  const port = await reservePort();
  const dbDir = path.join(workspaceRoot, 'state');
  const downloadDir = path.join(workspaceRoot, 'downloads');
  const logDir = path.join(workspaceRoot, 'logs');
  const cookieDir = path.join(workspaceRoot, 'cookies');
  const fakeBinDir = path.join(workspaceRoot, 'bin');
  const envFilePath = path.join(workspaceRoot, 'waveb.test.env');
  const dbPath = path.join(dbDir, 'waveb-test.sqlite');

  await Promise.all([
    mkdir(dbDir, { recursive: true }),
    mkdir(downloadDir, { recursive: true }),
    mkdir(logDir, { recursive: true }),
    mkdir(cookieDir, { recursive: true }),
    mkdir(fakeBinDir, { recursive: true }),
  ]);

  const fakeIcloudPdPath = options.fakeIcloudPd ? fakeIcloudPdCommandPath(fakeBinDir) : null;

  await writeFile(
    envFilePath,
    buildEnvFile({
      downloadDir,
      dbPath,
      logDir,
      cookieDir,
      icloudpdCommand: fakeIcloudPdPath,
    }),
    'utf8',
  );

  if (options.schemaDb) {
    await execSqlFile(dbPath, schemaPath);
    await writeFile(path.join(downloadDir, 'alpha.jpg'), 'alpha image payload', 'utf8');
    await writeFile(path.join(downloadDir, 'beta.jpg'), 'beta image payload', 'utf8');
  }

  if (options.fakeIcloudPd) {
    await writeFile(fakeIcloudPdPath, buildFakeIcloudPdScript(), 'utf8');
    await chmod(fakeIcloudPdPath, 0o755);
  }

  const child = spawn(process.execPath, [serverEntryPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      INIT_ENV_FILE: envFilePath,
      PATH: options.fakeIcloudPd
        ? `${fakeBinDir}${path.delimiter}${process.env.PATH || process.env.Path || ''}`
        : options.missingIcloudPd
          ? fakeOnlyPath()
          : (process.env.PATH || process.env.Path || ''),
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
    await run({ port, dbPath, downloadDir, workspaceRoot });
  } finally {
    child.kill();
    await onceExit(child);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
}

async function readIndexCounts(dbPath) {
  const rows = await queryRows(
    dbPath,
    `SELECT
       (SELECT COUNT(*) FROM canonical_media_assets) AS canonical_media_assets,
       (SELECT COUNT(*) FROM media_asset_variants) AS media_asset_variants,
       (SELECT COUNT(*) FROM parse_files_for_gps_queue) AS parse_files_for_gps_queue`,
  );

  assert.equal(rows.length, 1);
  return {
    canonical_media_assets: Number(rows[0].canonical_media_assets),
    media_asset_variants: Number(rows[0].media_asset_variants),
    parse_files_for_gps_queue: Number(rows[0].parse_files_for_gps_queue),
  };
}

function fakeOnlyPath() {
  return path.join(os.tmpdir(), 'pf-empty-path');
}

function fakeIcloudPdCommandPath(fakeBinDir) {
  return path.join(fakeBinDir, process.platform === 'win32' ? 'icloudpd.cmd' : 'icloudpd');
}

function buildFakeIcloudPdScript() {
  if (process.platform === 'win32') {
    return `@echo off
setlocal EnableDelayedExpansion
set "TARGET="
:next
if "%~1"=="" goto done
if /I "%~1"=="--directory" (
  set "TARGET=%~2"
  shift
)
shift
goto next
:done
if "%TARGET%"=="" (
  set "TARGET=%CD%"
)
if not exist "%TARGET%" mkdir "%TARGET%"
(
  echo fake icloudpd download
) > "%TARGET%\\fake-icloudpd-download.jpg"
exit /b 0
`;
  }

  return `#!/usr/bin/env sh
TARGET=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "--directory" ]; then
    TARGET=$2
    shift
  fi
  shift
done
if [ -z "$TARGET" ]; then
  TARGET=$PWD
fi
mkdir -p "$TARGET"
printf 'fake icloudpd download
' > "$TARGET/fake-icloudpd-download.jpg"
`;
}

function buildEnvFile({ downloadDir, dbPath, logDir, cookieDir, icloudpdCommand }) {
  return [
    'user=test@example.com',
    'pw=super-secret-password',
    `DOWNLOAD_DIR=${downloadDir}`,
    `DB_PATH=${dbPath}`,
    `LOG_DIR=${logDir}`,
    `ICLOUDPD_COOKIE_DIR=${cookieDir}`,
    ...(icloudpdCommand ? [`ICLOUDPD_COMMAND=${icloudpdCommand}`] : []),
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
    throw new Error('Unable to reserve a local port for Wave B tests.');
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

async function execSqlFile(dbPath, schemaSourcePath) {
  const schemaSql = readFileSync(schemaSourcePath, 'utf8');
  const result = spawnSync('python', ['-c', pythonScriptForExecutescript(), dbPath, schemaSql], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`Failed to initialize SQLite schema.\nstdout:\n${result.stdout ?? ''}\nstderr:\n${result.stderr ?? ''}`);
  }
}

async function queryRows(dbPath, sql, params = []) {
  const result = spawnSync('python', ['-c', pythonScriptForQuery(), dbPath, sql, JSON.stringify(params)], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`SQLite query failed.\nstdout:\n${result.stdout ?? ''}\nstderr:\n${result.stderr ?? ''}`);
  }

  return JSON.parse(result.stdout || '[]');
}

function pythonScriptForExecutescript() {
  return `
import sqlite3
import sys

db_path = sys.argv[1]
sql = sys.argv[2]

conn = sqlite3.connect(db_path)
try:
    conn.executescript(sql)
    conn.commit()
finally:
    conn.close()
`;
}

function pythonScriptForQuery() {
  return `
import json
import sqlite3
import sys

db_path = sys.argv[1]
sql = sys.argv[2]
params = json.loads(sys.argv[3])

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
try:
    cur = conn.execute(sql, params)
    print(json.dumps([dict(row) for row in cur.fetchall()]))
finally:
    conn.close()
`;
}
