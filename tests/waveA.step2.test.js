// Wave A step 2 queue regression coverage for playable media selection.
// Keeps the queue-preparation contract focused on playable assets only.
// Also preserves the existing playback selection check in this file.
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
const schemaPath = path.join(repoRoot, 'database', 'schema.sql');
const fixedTimestamp = '2026-04-21T12:34:56.000Z';

// Verifies queue preparation accepts playable assets without GPS/geocode/address data
// while still skipping missing-variant and missing-path cases and remaining idempotent.
test('POST /api/runtime/queue/prepare inserts slideshow rows for playable assets even when GPS data is missing', async () => {
  await withWaveAServer(async ({ port, dbPath, workspaceRoot, assets }) => {
    const mediaDir = path.join(workspaceRoot, 'media');
    const supplementalAssets = {
      missingGeocode: {
        assetKey: 'wavea-missing-geocode',
        fileName: 'missing-geocode.jpg',
        canonicalPath: path.join(mediaDir, 'missing-geocode.jpg'),
        gpsStatus: 'GPS_NOT_FOUND',
        geocodeStatus: 'GEOCODE_PENDING',
        addressText: null,
      },
      missingAddress: {
        assetKey: 'wavea-missing-address',
        fileName: 'missing-address.jpg',
        canonicalPath: path.join(mediaDir, 'missing-address.jpg'),
        gpsStatus: 'GPS_FOUND',
        geocodeStatus: 'GEOCODE_FOUND',
        addressText: '',
      },
      missingVariant: {
        assetKey: 'wavea-missing-variant',
        fileName: 'missing-variant.jpg',
        canonicalPath: path.join(mediaDir, 'missing-variant.jpg'),
        gpsStatus: 'GPS_FOUND',
        geocodeStatus: 'GEOCODE_FOUND',
        addressText: '123 Variant Street, Tallinn',
      },
      missingFilePath: {
        assetKey: 'wavea-missing-file-path',
        fileName: 'missing-file-path.jpg',
        canonicalPath: path.join(mediaDir, 'missing-file-path.jpg'),
        gpsStatus: 'GPS_FOUND',
        geocodeStatus: 'GEOCODE_FOUND',
        addressText: '123 File Path Street, Tallinn',
      },
    };

    await Promise.all(
      Object.values(supplementalAssets).map((asset) => writeFile(asset.canonicalPath, `${asset.assetKey} asset`, 'utf8')),
    );

    await execSql(dbPath, insertCanonicalAssetSql(supplementalAssets.missingGeocode));
    await execSql(dbPath, insertVariantSql(supplementalAssets.missingGeocode));
    await execSql(dbPath, insertCanonicalAssetSql(supplementalAssets.missingAddress));
    await execSql(dbPath, insertVariantSql(supplementalAssets.missingAddress));
    await execSql(dbPath, insertCanonicalAssetSql(supplementalAssets.missingVariant));
    await execSql(dbPath, insertCanonicalAssetSql(supplementalAssets.missingFilePath));
    await execSql(dbPath, insertVariantSql(supplementalAssets.missingFilePath));
    await execSql(
      dbPath,
      `UPDATE media_asset_variants
       SET file_path = ''
       WHERE media_asset_id = (
         SELECT media_asset_id
         FROM canonical_media_assets
         WHERE asset_key = ?
         LIMIT 1
       )`,
      [supplementalAssets.missingFilePath.assetKey],
    );

    const firstResponse = await requestJson(port, '/api/runtime/queue/prepare', {
      method: 'POST',
      body: {},
    });

    assert.equal(firstResponse.status, 200);
    assert.notEqual(firstResponse.json.status, 'error');

    const firstQueueRows = await queryRows(
      dbPath,
      `SELECT sq.slideshow_queue_id, sq.media_asset_id, sq.status, c.asset_key
       FROM slideshow_queue sq
       JOIN canonical_media_assets c ON c.media_asset_id = sq.media_asset_id
       ORDER BY sq.slideshow_queue_id`,
    );

    assert.deepEqual(firstQueueRows.map((row) => row.asset_key), [
      assets.eligible.assetKey,
      assets.ineligible.assetKey,
      assets.invalid.assetKey,
      supplementalAssets.missingGeocode.assetKey,
      supplementalAssets.missingAddress.assetKey,
    ]);
    assert.equal(firstQueueRows.length, 5);
    assert.deepEqual(firstQueueRows.map((row) => row.status), ['READY', 'READY', 'READY', 'READY', 'READY']);

    const secondResponse = await requestJson(port, '/api/runtime/queue/prepare', {
      method: 'POST',
      body: {},
    });

    assert.equal(secondResponse.status, 200);
    assert.notEqual(secondResponse.json.status, 'error');

    const secondQueueRows = await queryRows(
      dbPath,
      `SELECT sq.slideshow_queue_id, sq.media_asset_id, sq.status, c.asset_key
       FROM slideshow_queue sq
       JOIN canonical_media_assets c ON c.media_asset_id = sq.media_asset_id
       ORDER BY sq.slideshow_queue_id`,
    );

    assert.equal(secondQueueRows.length, 5);
    assert.deepEqual(secondQueueRows.map((row) => row.asset_key), [
      assets.eligible.assetKey,
      assets.ineligible.assetKey,
      assets.invalid.assetKey,
      supplementalAssets.missingGeocode.assetKey,
      supplementalAssets.missingAddress.assetKey,
    ]);
    assert.deepEqual(secondQueueRows.map((row) => row.status), ['READY', 'READY', 'READY', 'READY', 'READY']);

    const missingGpsAssetId = await getAssetId(dbPath, supplementalAssets.missingGeocode.assetKey);
    await execSql(
      dbPath,
      `UPDATE slideshow_queue
       SET status = 'FAILED', failure_reason = 'test_focus', updated_at = ?
       WHERE media_asset_id <> ?`,
      [fixedTimestamp, missingGpsAssetId],
    );

    const playbackResponse = await requestJson(port, '/api/runtime/playback/select-current', {
      method: 'POST',
      body: {},
    });

    assert.equal(playbackResponse.status, 200);
    assert.equal(String(playbackResponse.json.playback.selected.mediaAssetId), String(missingGpsAssetId));
    assert.equal(playbackResponse.json.playback.selected.addressText, '');
  });
});

// Verifies select-current still fails a READY row whose media stays invalid on disk.
test('POST /api/runtime/playback/select-current commits pointer/history and fails invalid READY rows', async () => {
  await withWaveAServer(async ({ port, dbPath, workspaceRoot, assets }) => {
    await requestJson(port, '/api/runtime/queue/prepare', {
      method: 'POST',
      body: {},
    });

    const eligibleAssetId = await getAssetId(dbPath, assets.eligible.assetKey);
    const mediaDir = path.join(workspaceRoot, 'media');
    const manualInvalidAsset = {
      assetKey: 'wavea-manual-invalid',
      fileName: 'manual-invalid.jpg',
      canonicalPath: path.join(mediaDir, 'manual-invalid.jpg'),
      gpsStatus: 'GPS_FOUND',
      geocodeStatus: 'GEOCODE_FOUND',
      addressText: '',
    };

    await execSql(dbPath, insertCanonicalAssetSql(manualInvalidAsset));

    const invalidAssetId = await getAssetId(dbPath, manualInvalidAsset.assetKey);
    await execSql(
      dbPath,
      `UPDATE slideshow_queue
       SET status = 'FAILED', failure_reason = 'test_focus', updated_at = ?
       WHERE media_asset_id <> ?`,
      [fixedTimestamp, eligibleAssetId],
    );
    await execSql(
      dbPath,
      `UPDATE slideshow_queue
       SET last_shown_datetime = ?, view_count = 2, updated_at = ?
       WHERE media_asset_id = ?`,
      [fixedTimestamp, fixedTimestamp, eligibleAssetId],
    );

    await execSql(
      dbPath,
      `INSERT INTO slideshow_queue (
         media_asset_id, status, failure_reason, sort_bucket, eligible_since,
         last_shown_datetime, view_count, created_at, updated_at
       ) VALUES (?, 'READY', NULL, NULL, NULL, NULL, 0, ?, ?)`,
      [invalidAssetId, fixedTimestamp, fixedTimestamp],
    );

    const response = await requestJson(port, '/api/runtime/playback/select-current', {
      method: 'POST',
      body: {},
    });

    assert.equal(response.status, 200);
    assert.notEqual(response.json.status, 'error');

    const pointerRows = await queryRows(
      dbPath,
      `SELECT state_value
       FROM runtime_state
       WHERE state_key = 'current_media_asset_id'`,
    );

    assert.equal(pointerRows.length, 1);
    assert.equal(String(pointerRows[0].state_value), String(eligibleAssetId));

    const selectedRows = await queryRows(
      dbPath,
      `SELECT sq.status, sq.view_count, sq.last_shown_datetime, c.asset_key
       FROM slideshow_queue sq
       JOIN canonical_media_assets c ON c.media_asset_id = sq.media_asset_id
       WHERE sq.media_asset_id = ?
       LIMIT 1`,
      [eligibleAssetId],
    );

    assert.equal(selectedRows.length, 1);
    assert.equal(selectedRows[0].asset_key, assets.eligible.assetKey);
    assert.equal(selectedRows[0].status, 'READY');
    assert.equal(Number(selectedRows[0].view_count), 3);
    assert.ok(selectedRows[0].last_shown_datetime);

    const invalidRows = await queryRows(
      dbPath,
      `SELECT sq.status, sq.failure_reason, c.asset_key
       FROM slideshow_queue sq
       JOIN canonical_media_assets c ON c.media_asset_id = sq.media_asset_id
       WHERE sq.media_asset_id = ?
       LIMIT 1`,
      [invalidAssetId],
    );

    assert.equal(invalidRows.length, 1);
    assert.equal(invalidRows[0].asset_key, manualInvalidAsset.assetKey);
    assert.equal(invalidRows[0].status, 'FAILED');
    assert.ok(
      invalidRows[0].failure_reason === null ||
        invalidRows[0].failure_reason === '' ||
        typeof invalidRows[0].failure_reason === 'string',
    );
  });
});

async function withWaveAServer(run) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'pf-wavea-step2-'));
  const port = await reservePort();
  const dbDir = path.join(workspaceRoot, 'state');
  const mediaDir = path.join(workspaceRoot, 'media');
  const downloadDir = path.join(workspaceRoot, 'downloads');
  const logDir = path.join(workspaceRoot, 'logs');
  const cookieDir = path.join(workspaceRoot, 'cookies');
  const envFilePath = path.join(workspaceRoot, 'wavea.test.env');
  const dbPath = path.join(dbDir, 'wavea-test.sqlite');

  await Promise.all([
    mkdir(dbDir, { recursive: true }),
    mkdir(mediaDir, { recursive: true }),
    mkdir(downloadDir, { recursive: true }),
    mkdir(logDir, { recursive: true }),
    mkdir(cookieDir, { recursive: true }),
  ]);

  const assets = {
    eligible: {
      assetKey: 'wavea-eligible',
      fileName: 'eligible.jpg',
      gpsStatus: 'GPS_FOUND',
      geocodeStatus: 'GEOCODE_FOUND',
      addressText: '123 Eligible Street, Tallinn',
    },
    ineligible: {
      assetKey: 'wavea-ineligible',
      fileName: 'ineligible.jpg',
      gpsStatus: 'GPS_FOUND',
      geocodeStatus: 'GEOCODE_PENDING',
      addressText: null,
    },
    invalid: {
      assetKey: 'wavea-invalid',
      fileName: 'invalid.jpg',
      gpsStatus: 'GPS_FOUND',
      geocodeStatus: 'GEOCODE_FOUND',
      addressText: '',
    },
  };

  const eligiblePath = path.join(mediaDir, assets.eligible.fileName);
  const ineligiblePath = path.join(mediaDir, assets.ineligible.fileName);
  const invalidPath = path.join(mediaDir, assets.invalid.fileName);

  await Promise.all([
    writeFile(eligiblePath, 'eligible asset', 'utf8'),
    writeFile(ineligiblePath, 'ineligible asset', 'utf8'),
    writeFile(invalidPath, 'invalid asset', 'utf8'),
  ]);

  assets.eligible = { ...assets.eligible, canonicalPath: eligiblePath };
  assets.ineligible = { ...assets.ineligible, canonicalPath: ineligiblePath };
  assets.invalid = { ...assets.invalid, canonicalPath: invalidPath };

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

  seedWaveADatabase(dbPath, schemaPath, assets);

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
    await run({ port, dbPath, workspaceRoot, assets });
  } finally {
    child.kill();
    await onceExit(child);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
}

function seedWaveADatabase(dbPath, schemaSourcePath, assets) {
  const schemaSql = readTextFile(schemaSourcePath);
  const seedSql = [
    schemaSql,
    insertCanonicalAssetSql(assets.eligible),
    insertVariantSql(assets.eligible),
    insertCanonicalAssetSql(assets.ineligible),
    insertVariantSql(assets.ineligible),
    insertCanonicalAssetSql(assets.invalid),
    insertVariantSql(assets.invalid),
  ].join('\n');

  const result = spawnSync(
    'python',
    ['-c', pythonScriptForExecutescript(), dbPath, seedSql],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(
      `Failed to seed Wave A database.\nstdout:\n${result.stdout ?? ''}\nstderr:\n${result.stderr ?? ''}`,
    );
  }
}

function insertCanonicalAssetSql(asset) {
  const values = [
    sqlString(asset.assetKey),
    sqlString(asset.fileName),
    sqlString(asset.canonicalPath),
    "'image'",
    sqlString('jpg'),
    '1234',
    sqlString(`hash-${asset.assetKey}`),
    sqlString(fixedTimestamp),
    '1.23456',
    '2.34567',
    '3.45678',
    sqlString(asset.gpsStatus),
    sqlString(asset.geocodeStatus),
    sqlString(asset.addressText),
    'NULL',
    sqlString('manual-test'),
    sqlString(fixedTimestamp),
    sqlString(fixedTimestamp),
  ];

  return `INSERT INTO canonical_media_assets (
    asset_key, original_filename, canonical_path, media_type, file_extension,
    file_size_bytes, content_hash, captured_at, gps_latitude, gps_longitude,
    gps_altitude, gps_status, geocode_status, address_text, address_cache_key,
    successful_gps_parser_method, created_at, updated_at
  ) VALUES (${values.join(', ')});`;
}

function insertVariantSql(asset) {
  return `INSERT INTO media_asset_variants (
    media_asset_id, variant_kind, file_path, file_extension, file_size_bytes, created_at, updated_at
  )
  SELECT media_asset_id, 'original', ${sqlString(asset.canonicalPath)}, 'jpg', 1234, ${sqlString(fixedTimestamp)}, ${sqlString(fixedTimestamp)}
  FROM canonical_media_assets
  WHERE asset_key = ${sqlString(asset.assetKey)};`;
}

function sqlString(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function queryRows(dbPath, sql, params = []) {
  const result = spawnSync(
    'python',
    ['-c', pythonScriptForQuery(), dbPath, sql, JSON.stringify(params)],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(`SQLite query failed.\nstdout:\n${result.stdout ?? ''}\nstderr:\n${result.stderr ?? ''}`);
  }

  return JSON.parse(result.stdout || '[]');
}

async function execSql(dbPath, sql, params = []) {
  const result = spawnSync(
    'python',
    ['-c', pythonScriptForExecute(), dbPath, sql, JSON.stringify(params)],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(`SQLite exec failed.\nstdout:\n${result.stdout ?? ''}\nstderr:\n${result.stderr ?? ''}`);
  }

  return JSON.parse(result.stdout || '{"changes":0}');
}

async function getAssetId(dbPath, assetKey) {
  const rows = await queryRows(
    dbPath,
    `SELECT media_asset_id
     FROM canonical_media_assets
     WHERE asset_key = ?
     LIMIT 1`,
    [assetKey],
  );

  assert.equal(rows.length, 1);
  return rows[0].media_asset_id;
}

function readTextFile(filePath) {
  return readFileSync(filePath, 'utf8');
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
    throw new Error('Unable to reserve a local port for Wave A tests.');
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

function pythonScriptForExecute() {
  return `
import json
import sqlite3
import sys

db_path = sys.argv[1]
sql = sys.argv[2]
params = json.loads(sys.argv[3])

conn = sqlite3.connect(db_path)
try:
    cur = conn.execute(sql, params)
    conn.commit()
    print(json.dumps({"changes": cur.rowcount}))
finally:
    conn.close()
`;
}
