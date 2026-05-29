/*
 * Verifies the read-only playback API contract used by OS playback views.
 * The tests protect Test/Real database separation and backend-owned media serving.
 * They use isolated SQLite/runtime paths so local project data is never touched.
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntryPath = path.join(repoRoot, 'server', 'index.ts');
const schemaPath = path.join(repoRoot, 'schema.sql');
const fixedTimestamp = '2026-05-27T19:00:00.000Z';



test('playback resume checkpoint APIs save, read, validate, and clear platform checkpoints', async () => {
  await withPlaybackServer(async ({ port }) => {
    const currentResponse = await requestJson(port, '/api/runtime/playback/current?limit=10');
    assert.equal(currentResponse.status, 200);
    const mediaAssetId = currentResponse.json.playback.currentItem.mediaAssetId;

    const saveResponse = await requestJson(port, '/api/runtime/playback/resume-checkpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        platform: 'windows',
        mediaAssetId,
        displayName: currentResponse.json.playback.currentItem.displayName,
        displayUrl: currentResponse.json.playback.currentItem.displayUrl,
        mediaType: currentResponse.json.playback.currentItem.mediaType,
        resolvedAddress: currentResponse.json.playback.currentItem.resolvedAddress,
        activeIndex: 0,
        rotationPaused: false,
        fullscreenRequested: true,
        fullscreenActive: false,
        rotationDurationMs: 30000,
        remainingRotationMs: 12000,
        videoPositionMs: null,
        restorePolicy: 'resume_same_item',
      },
    });
    assert.equal(saveResponse.status, 200);
    assert.equal(saveResponse.json.status, 'saved');
    assert.equal(saveResponse.json.checkpoint.platform, 'windows');
    assert.equal(saveResponse.json.checkpoint.viewId, 'WIN');
    assert.equal(saveResponse.json.validation.status, 'valid');

    const readResponse = await requestJson(port, '/api/runtime/playback/resume-checkpoint?platform=windows');
    assert.equal(readResponse.status, 200);
    assert.equal(readResponse.json.status, 'ok');
    assert.equal(readResponse.json.checkpoint.mediaAssetId, String(mediaAssetId));
    assert.equal(readResponse.json.validation.mediaFoundInContract, true);

    const clearResponse = await requestJson(port, '/api/runtime/playback/resume-checkpoint/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { platform: 'windows' },
    });
    assert.equal(clearResponse.status, 200);
    assert.equal(clearResponse.json.status, 'cleared');

    const missingResponse = await requestJson(port, '/api/runtime/playback/resume-checkpoint?platform=windows');
    assert.equal(missingResponse.status, 200);
    assert.equal(missingResponse.json.status, 'missing');
    assert.equal(missingResponse.json.checkpoint, null);
  });
});


test('playback current and queue APIs honor Test/Real database separation', async () => {
  await withPlaybackServer(async ({ port, realDbPath, testDbPath }) => {
    const realResponse = await requestJson(port, '/api/runtime/playback/current?limit=10');
    assert.equal(realResponse.status, 200);
    assert.equal(realResponse.json.runtimeMode, 'real');
    assert.equal(realResponse.json.database.absolutePath, realDbPath);
    assert.equal(realResponse.json.playback.currentItem.displayName, 'real-image.jpg');
    assert.equal(realResponse.json.playback.queue.readyCount, 1);
    assert.match(realResponse.json.playback.currentItem.displayUrl, /^\/api\/runtime\/playback\/media\?assetId=\d+$/);
    assert.equal('canonicalPath' in realResponse.json.playback.currentItem, false);
    assert.equal('resolvedCanonicalPath' in realResponse.json.playback.currentItem, false);

    const testResponse = await requestJson(port, '/api/runtime/playback/current?limit=10', {
      headers: { 'X-Dashboard-Runtime-Mode': 'test' },
    });
    assert.equal(testResponse.status, 200);
    assert.equal(testResponse.json.runtimeMode, 'test');
    assert.equal(testResponse.json.database.absolutePath, testDbPath);
    assert.equal(testResponse.json.playback.currentItem.displayName, 'test-image.jpg');
    assert.equal(testResponse.json.playback.queue.readyCount, 1);

    const queueResponse = await requestJson(port, '/api/runtime/playback/queue?limit=10', {
      headers: { 'X-Dashboard-Runtime-Mode': 'test' },
    });
    assert.equal(queueResponse.status, 200);
    assert.equal(queueResponse.json.runtimeMode, 'test');
    assert.equal(queueResponse.json.items.length, 1);
    assert.equal(queueResponse.json.items[0].displayName, 'test-image.jpg');

    const mediaResponse = await fetch(`http://127.0.0.1:${port}${testResponse.json.playback.currentItem.displayUrl}`, {
      headers: { 'X-Dashboard-Runtime-Mode': 'test' },
    });
    assert.equal(mediaResponse.status, 200);
    assert.match(mediaResponse.headers.get('content-type') ?? '', /image\/jpeg/);
    assert.equal(await mediaResponse.text(), 'test media body');
  });
});

async function withPlaybackServer(run) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'pf-playback-contract-'));
  const port = await reservePort();
  const realRuntimeDir = path.join(workspaceRoot, 'runtime_data');
  const testRuntimeDir = path.join(workspaceRoot, 'test_runtime_data');
  const realDownloadDir = path.join(realRuntimeDir, 'downloads');
  const testDownloadDir = path.join(testRuntimeDir, 'downloads');
  const realLogDir = path.join(realRuntimeDir, 'logs');
  const testLogDir = path.join(testRuntimeDir, 'logs');
  const cookieDir = path.join(workspaceRoot, 'cookies');
  const envFilePath = path.join(workspaceRoot, 'playback.test.env');
  const realDbPath = path.join(realRuntimeDir, 'photo_frame.sqlite');
  const testDbPath = path.join(testRuntimeDir, 'test_photo_frame.sqlite');
  const realMediaPath = path.join(realDownloadDir, 'real-image.jpg');
  const testMediaPath = path.join(testDownloadDir, 'test-image.jpg');

  await Promise.all([
    mkdir(realDownloadDir, { recursive: true }),
    mkdir(testDownloadDir, { recursive: true }),
    mkdir(realLogDir, { recursive: true }),
    mkdir(testLogDir, { recursive: true }),
    mkdir(cookieDir, { recursive: true }),
  ]);

  await Promise.all([
    writeFile(realMediaPath, 'real media body', 'utf8'),
    writeFile(testMediaPath, 'test media body', 'utf8'),
  ]);

  await writeFile(
    envFilePath,
    buildEnvFile({
      realDownloadDir,
      testDownloadDir,
      realDbPath,
      testDbPath,
      realLogDir,
      testLogDir,
      cookieDir,
    }),
    'utf8',
  );

  seedPlaybackDatabase(realDbPath, {
    assetKey: 'real-image',
    fileName: 'real-image.jpg',
    canonicalPath: realMediaPath,
    addressText: 'Real Address 1, Tallinn, Estonia',
  });
  seedPlaybackDatabase(testDbPath, {
    assetKey: 'test-image',
    fileName: 'test-image.jpg',
    canonicalPath: testMediaPath,
    addressText: 'Test Address 1, Tallinn, Estonia',
  });

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
    await run({ port, realDbPath, testDbPath, workspaceRoot });
  } finally {
    child.kill();
    await onceExit(child);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
}

function seedPlaybackDatabase(dbPath, asset) {
  const schemaSql = readFileSync(schemaPath, 'utf8');
  const seedSql = [
    schemaSql,
    insertCanonicalAssetSql(asset),
    insertVariantSql(asset),
    insertQueueSql(asset),
    insertCurrentStateSql(asset),
  ].join('\n');

  const result = spawnSync(
    'python',
    ['-c', pythonScriptForExecutescript(), dbPath, seedSql],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(`Failed to seed playback database.\nstdout:\n${result.stdout ?? ''}\nstderr:\n${result.stderr ?? ''}`);
  }
}

function insertCanonicalAssetSql(asset) {
  return `INSERT INTO canonical_media_assets (
    asset_key, original_filename, canonical_path, media_type, file_extension,
    file_size_bytes, content_hash, captured_at, gps_latitude, gps_longitude,
    gps_altitude, gps_status, geocode_status, address_text, address_cache_key,
    successful_gps_parser_method, created_at, updated_at
  ) VALUES (
    ${sqlString(asset.assetKey)}, ${sqlString(asset.fileName)}, ${sqlString(asset.canonicalPath)}, 'image', 'jpg',
    15, ${sqlString(`hash-${asset.assetKey}`)}, ${sqlString(fixedTimestamp)}, 59.437, 24.753,
    5, 'GPS_FOUND', 'GEOCODE_FOUND', ${sqlString(asset.addressText)}, NULL,
    'manual-test', ${sqlString(fixedTimestamp)}, ${sqlString(fixedTimestamp)}
  );`;
}

function insertVariantSql(asset) {
  return `INSERT INTO media_asset_variants (
    media_asset_id, variant_kind, file_path, file_extension, file_size_bytes, created_at, updated_at
  )
  SELECT media_asset_id, 'original', ${sqlString(asset.canonicalPath)}, 'jpg', 15, ${sqlString(fixedTimestamp)}, ${sqlString(fixedTimestamp)}
  FROM canonical_media_assets
  WHERE asset_key = ${sqlString(asset.assetKey)};`;
}

function insertQueueSql(asset) {
  return `INSERT INTO slideshow_queue (
    media_asset_id, status, failure_reason, sort_bucket, eligible_since,
    last_shown_datetime, view_count, created_at, updated_at
  )
  SELECT media_asset_id, 'READY', NULL, 'test', ${sqlString(fixedTimestamp)}, NULL, 0, ${sqlString(fixedTimestamp)}, ${sqlString(fixedTimestamp)}
  FROM canonical_media_assets
  WHERE asset_key = ${sqlString(asset.assetKey)};`;
}

function insertCurrentStateSql(asset) {
  return `INSERT INTO runtime_state (state_key, state_value, value_type, updated_at, updated_by)
  SELECT 'current_media_asset_id', CAST(media_asset_id AS TEXT), 'text', ${sqlString(fixedTimestamp)}, 'playback-contract-test'
  FROM canonical_media_assets
  WHERE asset_key = ${sqlString(asset.assetKey)}
  ON CONFLICT(state_key) DO UPDATE SET
    state_value = excluded.state_value,
    value_type = excluded.value_type,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;`;
}

function sqlString(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function buildEnvFile({ realDownloadDir, testDownloadDir, realDbPath, testDbPath, realLogDir, testLogDir, cookieDir }) {
  return [
    'user=test@example.com',
    'pw=super-secret-password',
    `DOWNLOAD_DIR=${realDownloadDir}`,
    `TEST_DOWNLOAD_DIR=${testDownloadDir}`,
    `DB_PATH=${realDbPath}`,
    `TEST_DB_PATH=${testDbPath}`,
    `LOG_DIR=${realLogDir}`,
    `TEST_LOG_DIR=${testLogDir}`,
    `FULL_LOG=${path.join(realLogDir, 'full_log.log')}`,
    `TEST_FULL_LOG=${path.join(testLogDir, 'full_log.log')}`,
    `ICLOUDPD_COOKIE_DIR=${cookieDir}`,
    `TEST_ICLOUDPD_COOKIE_DIR=${path.join(testRuntimePath(testDbPath), 'icloudpd_cookies')}`,
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

function testRuntimePath(testDbPath) {
  return path.dirname(testDbPath);
}

async function requestJson(port, pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: options.method ?? 'GET',
    headers: options.headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return {
    status: response.status,
    json: await response.json(),
    headers: response.headers,
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
    throw new Error('Unable to reserve a local port for playback API tests.');
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
