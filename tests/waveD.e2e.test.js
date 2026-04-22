import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { access, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntryPath = path.join(repoRoot, 'server', 'index.js');
const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
const queueSkipReasons = Object.freeze([
  'already_queued',
  'geocode_not_ready',
  'missing_file_path',
  'missing_variant',
]);
const queueAllowedExtraKeys = Object.freeze(['queue', 'database', 'schemaVersion', 'executedAt']);
const downloadFixtures = Object.freeze([
  {
    fileName: '01-success-gps.jpg',
    type: 'gps',
    latitude: 58.377625,
    longitude: 26.729006,
    altitude: 123.45,
  },
  {
    fileName: '02-missing-geocode.jpg',
    type: 'plain',
  },
  {
    fileName: '03-missing-variant.jpg',
    type: 'gps',
    latitude: 58.378001,
    longitude: 26.730001,
    altitude: 124.45,
  },
  {
    fileName: '04-missing-file-path.jpg',
    type: 'gps',
    latitude: 58.379001,
    longitude: 26.731001,
    altitude: 125.45,
  },
]);

test('Wave D proves the deterministic Stage 2-6 pipeline on a fresh DB with blocking failure paths', async () => {
  await withWaveDServer(async ({ port, dbPath, downloadDir }) => {
    logStage('fresh-db-reset');
    const recreateResponse = await requestJson(port, '/api/init/database/recreate-empty', {
      method: 'POST',
      body: { confirm: true, action: 'recreate-db' },
    });
    assert.equal(recreateResponse.status, 200);
    assert.equal(recreateResponse.json.status, 'ok');

    logStage('download-run');
    const downloadResponse = await requestJson(port, '/api/runtime/download/run', {
      method: 'POST',
      body: {},
    });
    assert.equal(downloadResponse.status, 200);
    assert.equal(downloadResponse.json.stage, 'stage1_auth_download');
    assert.equal(downloadResponse.json.download.newMediaFiles, downloadFixtures.length);
    await assertDownloadedFixtures(downloadDir);
    logStage('download-summary', {
      newMediaFiles: downloadResponse.json.download.newMediaFiles,
      mediaFilesAfter: downloadResponse.json.download.mediaFilesAfter,
    });

    logStage('index-run');
    const indexResponse = await requestJson(port, '/api/runtime/index/run', {
      method: 'POST',
      body: {},
    });
    assert.equal(indexResponse.status, 200);
    assert.equal(indexResponse.json.stage, 'stage2_index_register');
    assert.equal(indexResponse.json.indexing.scannedMediaCount, downloadFixtures.length);
    assert.equal(indexResponse.json.indexing.insertedCanonicalCount, downloadFixtures.length);
    assert.equal(indexResponse.json.indexing.insertedVariantCount, downloadFixtures.length);

    const indexedRows = await queryRows(
      dbPath,
      `SELECT c.media_asset_id, c.original_filename, c.canonical_path, v.file_path
       FROM canonical_media_assets c
       LEFT JOIN media_asset_variants v ON v.media_asset_id = c.media_asset_id
       ORDER BY c.media_asset_id ASC`,
    );
    assert.equal(indexedRows.length, downloadFixtures.length);
    assert.ok(indexedRows.every((row) => row.file_path !== null), 'every indexed asset should expose a variant path');
    assert.ok(indexedRows.every((row) => row.file_path !== ''), 'indexed variant paths should be non-empty before failure setup');

    const assetIds = Object.fromEntries(indexedRows.map((row) => [row.original_filename, Number(row.media_asset_id)]));
    logStage('index-summary', {
      assetIds,
    });

    logStage('gps-run');
    const gpsResponse = await requestJson(port, '/api/runtime/gps/run', {
      method: 'POST',
      body: {},
    });
    assert.equal(gpsResponse.status, 200);
    assert.equal(gpsResponse.json.stage, 'stage3_process_gps_queue');
    assert.equal(gpsResponse.json.processed_count, downloadFixtures.length);
    assert.equal(gpsResponse.json.success_count, 3);
    assert.equal(gpsResponse.json.failure_count, 1);

    const gpsRows = await queryRows(
      dbPath,
      `SELECT c.original_filename, c.gps_status, q.status AS gps_queue_status
       FROM canonical_media_assets c
       INNER JOIN parse_files_for_gps_queue q ON q.media_asset_id = c.media_asset_id
       ORDER BY c.media_asset_id ASC`,
    );
    assert.equal(gpsRows.length, downloadFixtures.length);
    assert.equal(gpsRows.filter((row) => row.gps_status === 'GPS_FOUND').length, 3);
    assert.equal(gpsRows.filter((row) => row.gps_status === 'GPS_NOT_FOUND').length, 1);
    assert.equal(gpsRows.filter((row) => row.gps_queue_status === 'COMPLETED').length, 3);
    assert.equal(gpsRows.filter((row) => row.gps_queue_status === 'NO_GPS_FOUND').length, 1);
    logStage('gps-summary', gpsRows);

    logStage('geocode-run');
    const geocodeResponse = await requestJson(port, '/api/runtime/geocode/run', {
      method: 'POST',
      body: {},
    });
    assert.equal(geocodeResponse.status, 200);
    assert.equal(geocodeResponse.json.stage, 'stage4_process_geocode_queue');
    assert.equal(geocodeResponse.json.processed_count, 3);
    assert.equal(geocodeResponse.json.success_count, 3);
    assert.equal(geocodeResponse.json.failure_count, 0);

    const geocodeRows = await queryRows(
      dbPath,
      `SELECT c.media_asset_id, c.original_filename, c.geocode_status, c.address_text,
              q.status AS geocode_queue_status,
              (SELECT COUNT(*) FROM address_cache) AS address_cache_count
       FROM canonical_media_assets c
       LEFT JOIN geocode_queue q ON q.media_asset_id = c.media_asset_id
       ORDER BY c.media_asset_id ASC`,
    );
    assert.ok(
      geocodeRows.some((row) => row.geocode_status === 'GEOCODE_FOUND'),
      'at least one asset must reach the repo-equivalent geocode success state',
    );
    assert.ok(
      geocodeRows.find((row) => row.original_filename === '01-success-gps.jpg')?.address_cache_count >= 1,
      'address cache should contain at least one row after geocoding',
    );
    assert.equal(
      geocodeRows.find((row) => row.original_filename === '02-missing-geocode.jpg')?.geocode_status,
      'GEOCODE_PENDING',
    );
    logStage('geocode-summary', geocodeRows);

    logStage('failure-fixture-setup', {
      missingVariantAssetId: assetIds['03-missing-variant.jpg'],
      missingFilePathAssetId: assetIds['04-missing-file-path.jpg'],
    });
    await execSql(
      dbPath,
      'DELETE FROM media_asset_variants WHERE media_asset_id = ?',
      [assetIds['03-missing-variant.jpg']],
    );
    await execSql(
      dbPath,
      'UPDATE media_asset_variants SET file_path = ? WHERE media_asset_id = ?',
      ['', assetIds['04-missing-file-path.jpg']],
    );

    logStage('queue-prepare-run-1');
    const queueResponse1 = await requestJson(port, '/api/runtime/queue/prepare', {
      method: 'POST',
      body: {},
    });
    assert.equal(queueResponse1.status, 200);
    assertQueuePrepareResponseContract(queueResponse1.json);
    assert.equal(queueResponse1.json.inserted_count, 1);
    assert.equal(queueResponse1.json.skipped_count, 3);
    assert.deepEqual(queueResponse1.json.inserted_ids, [assetIds['01-success-gps.jpg']]);
    assert.deepEqual(queueResponse1.json.skipped, [
      { asset_id: String(assetIds['02-missing-geocode.jpg']), reason: 'geocode_not_ready' },
      { asset_id: String(assetIds['03-missing-variant.jpg']), reason: 'missing_variant' },
      { asset_id: String(assetIds['04-missing-file-path.jpg']), reason: 'missing_file_path' },
    ]);
    await assertInsertedStage5AssetsArePlayable(dbPath, queueResponse1.json.inserted_ids);
    logStage('queue-prepare-summary-1', {
      inserted: queueResponse1.json.inserted_ids,
      skipped: queueResponse1.json.skipped,
    });

    logStage('queue-prepare-run-2');
    const queueResponse2 = await requestJson(port, '/api/runtime/queue/prepare', {
      method: 'POST',
      body: {},
    });
    assert.equal(queueResponse2.status, 200);
    assertQueuePrepareResponseContract(queueResponse2.json);
    assert.equal(queueResponse2.json.inserted_count, 0);
    assert.equal(queueResponse2.json.skipped_count, 4);
    assert.deepEqual(queueResponse2.json.inserted_ids, []);
    assert.deepEqual(queueResponse2.json.skipped, [
      { asset_id: String(assetIds['01-success-gps.jpg']), reason: 'already_queued' },
      { asset_id: String(assetIds['02-missing-geocode.jpg']), reason: 'geocode_not_ready' },
      { asset_id: String(assetIds['03-missing-variant.jpg']), reason: 'missing_variant' },
      { asset_id: String(assetIds['04-missing-file-path.jpg']), reason: 'missing_file_path' },
    ]);
    logStage('queue-prepare-summary-2', {
      inserted: queueResponse2.json.inserted_ids,
      skipped: queueResponse2.json.skipped,
    });

    logStage('playback-select-current');
    const playbackResponse = await requestJson(port, '/api/runtime/playback/select-current', {
      method: 'POST',
      body: {},
    });
    assert.equal(playbackResponse.status, 200);
    assert.equal(playbackResponse.json.stage, 'stage6_run_playback');
    assert.equal(playbackResponse.json.playback.outcome, 'selected');
    assert.equal(playbackResponse.json.playback.failedCandidateCount, 0);
    assert.equal(playbackResponse.json.playback.selected.mediaAssetId, assetIds['01-success-gps.jpg']);
    await access(playbackResponse.json.playback.selected.resolvedCanonicalPath);

    const playbackRows = await queryRows(
      dbPath,
      `SELECT
         rs.state_value AS current_media_asset_id,
         sq.media_asset_id,
         sq.status,
         sq.view_count,
         sq.last_shown_datetime,
         c.original_filename,
         c.geocode_status,
         c.canonical_path,
         v.file_path
       FROM slideshow_queue sq
       INNER JOIN canonical_media_assets c ON c.media_asset_id = sq.media_asset_id
       INNER JOIN media_asset_variants v ON v.media_asset_id = sq.media_asset_id
       LEFT JOIN runtime_state rs ON rs.state_key = 'current_media_asset_id'
       WHERE sq.media_asset_id = ?`,
      [assetIds['01-success-gps.jpg']],
    );
    assert.equal(playbackRows.length, 1);
    assert.equal(String(playbackRows[0].current_media_asset_id), String(assetIds['01-success-gps.jpg']));
    assert.equal(playbackRows[0].status, 'READY');
    assert.equal(Number(playbackRows[0].view_count), 1);
    assert.ok(playbackRows[0].last_shown_datetime, 'playback should persist last shown timestamp');
    assert.equal(playbackRows[0].original_filename, '01-success-gps.jpg');
    assert.equal(playbackRows[0].geocode_status, 'GEOCODE_FOUND');
    await access(playbackRows[0].canonical_path);
    await access(playbackRows[0].file_path);
    logStage('selected-asset', playbackResponse.json.playback.selected);
  });
});

async function withWaveDServer(run) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'pf-waved-e2e-'));
  const port = await reservePort();
  const dbDir = path.join(workspaceRoot, 'state');
  const downloadDir = path.join(workspaceRoot, 'downloads');
  const logDir = path.join(workspaceRoot, 'logs');
  const cookieDir = path.join(workspaceRoot, 'cookies');
  const mockDownloadSourceDir = path.join(workspaceRoot, 'mock-download-source');
  const envFilePath = path.join(workspaceRoot, 'waved.test.env');
  const dbPath = path.join(dbDir, 'waved-test.sqlite');

  await Promise.all([
    mkdir(dbDir, { recursive: true }),
    mkdir(downloadDir, { recursive: true }),
    mkdir(logDir, { recursive: true }),
    mkdir(cookieDir, { recursive: true }),
    mkdir(mockDownloadSourceDir, { recursive: true }),
  ]);

  await writeFile(
    envFilePath,
    buildEnvFile({
      downloadDir,
      dbPath,
      logDir,
      cookieDir,
      mockDownloadSourceDir,
    }),
    'utf8',
  );

  await installMockDownloadSource(mockDownloadSourceDir);

  const child = spawn(process.execPath, [serverEntryPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      INIT_ENV_FILE: envFilePath,
      PATH: process.env.PATH || process.env.Path || '',
    },
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

async function installMockDownloadSource(mockDownloadSourceDir) {
  const pythonScriptPath = path.join(mockDownloadSourceDir, 'seed_mock_download_source.py');
  await writeFile(pythonScriptPath, buildMockDownloadSourcePythonScript(), 'utf8');
  const result = spawnSync(pythonCommand, [pythonScriptPath, mockDownloadSourceDir], { encoding: 'utf8' });
  await rm(pythonScriptPath, { force: true });
  if (result.status !== 0) {
    throw new Error(`Failed to seed mock download source.\nstdout:\n${result.stdout ?? ''}\nstderr:\n${result.stderr ?? ''}`);
  }
}

function buildMockDownloadSourcePythonScript() {
  return `
import json
import os
import sys
from PIL import Image, TiffImagePlugin
from PIL.ExifTags import Base

FIXTURES = json.loads(${JSON.stringify(JSON.stringify(downloadFixtures))})
FIXED_MTIME_NS = 1713700800000000000

def rat(a, b):
    return TiffImagePlugin.IFDRational(a, b)

def to_deg(value):
    value = abs(float(value))
    degrees = int(value)
    minutes_float = (value - degrees) * 60
    minutes = int(minutes_float)
    seconds = (minutes_float - minutes) * 60
    return (rat(degrees, 1), rat(minutes, 1), rat(int(round(seconds * 10000)), 10000))

def create_gps_image(target_path, latitude, longitude, altitude):
    image = Image.new('RGB', (16, 16), (255, 0, 0))
    exif = Image.Exif()
    exif[Base.GPSInfo] = {
        1: 'N' if float(latitude) >= 0 else 'S',
        2: to_deg(latitude),
        3: 'E' if float(longitude) >= 0 else 'W',
        4: to_deg(longitude),
        6: rat(int(round(float(altitude) * 100)), 100),
    }
    image.save(target_path, exif=exif)

def create_plain_image(target_path):
    Image.new('RGB', (16, 16), (0, 255, 0)).save(target_path)

def main():
    target_directory = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    if not target_directory:
      target_directory = os.getcwd()

    os.makedirs(target_directory, exist_ok=True)
    for fixture in FIXTURES:
      file_path = os.path.join(target_directory, fixture['fileName'])
      if fixture['type'] == 'gps':
        create_gps_image(file_path, fixture['latitude'], fixture['longitude'], fixture['altitude'])
      else:
        create_plain_image(file_path)
      os.utime(file_path, ns=(FIXED_MTIME_NS, FIXED_MTIME_NS))

    print(json.dumps({
      'created': [fixture['fileName'] for fixture in FIXTURES],
      'targetDirectory': os.path.abspath(target_directory),
    }))

if __name__ == '__main__':
    main()
`;
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

async function assertDownloadedFixtures(downloadDir) {
  for (const fixture of downloadFixtures) {
    await access(path.join(downloadDir, fixture.fileName));
  }
}

function assertQueuePrepareResponseContract(payload) {
  const keys = Object.keys(payload);
  const requiredKeys = ['inserted_count', 'skipped_count', 'inserted_ids', 'skipped', 'message'];
  for (const key of requiredKeys) {
    assert.ok(keys.includes(key), `queue prepare response is missing required field ${key}`);
  }
  for (const key of keys) {
    assert.ok(
      requiredKeys.includes(key) || queueAllowedExtraKeys.includes(key),
      `queue prepare response returned unexpected top-level field ${key}`,
    );
  }

  assert.equal(typeof payload.inserted_count, 'number');
  assert.equal(typeof payload.skipped_count, 'number');
  assert.ok(Array.isArray(payload.inserted_ids));
  assert.ok(Array.isArray(payload.skipped));
  assert.equal(typeof payload.message, 'string');
  assert.ok(payload.inserted_ids.every((value) => typeof value === 'number'));

  for (const skippedEntry of payload.skipped) {
    assert.deepEqual(Object.keys(skippedEntry).sort(), ['asset_id', 'reason']);
    assert.equal(typeof skippedEntry.asset_id, 'string');
    assert.ok(queueSkipReasons.includes(skippedEntry.reason), `unknown skip reason ${skippedEntry.reason}`);
  }
}

async function assertInsertedStage5AssetsArePlayable(dbPath, insertedIds) {
  for (const insertedId of insertedIds) {
    const rows = await queryRows(
      dbPath,
      `SELECT c.media_asset_id, c.geocode_status, c.canonical_path, v.file_path, sq.status
       FROM canonical_media_assets c
       INNER JOIN media_asset_variants v ON v.media_asset_id = c.media_asset_id
       INNER JOIN slideshow_queue sq ON sq.media_asset_id = c.media_asset_id
       WHERE c.media_asset_id = ?
       LIMIT 1`,
      [insertedId],
    );

    assert.equal(rows.length, 1, `inserted asset ${insertedId} must exist across canonical/variant/queue truth`);
    assert.equal(rows[0].geocode_status, 'GEOCODE_FOUND');
    assert.equal(rows[0].status, 'READY');
    assert.ok(rows[0].file_path);
    await access(rows[0].canonical_path);
    await access(rows[0].file_path);
  }
}

function logStage(stage, details = null) {
  if (details === null) {
    console.log(`[waveD] ${stage}`);
    return;
  }
  console.log(`[waveD] ${stage}: ${JSON.stringify(details)}`);
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

async function queryRows(dbPath, sql, params = []) {
  const result = spawnSync(
    pythonCommand,
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
    pythonCommand,
    ['-c', pythonScriptForExecute(), dbPath, sql, JSON.stringify(params)],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(`SQLite exec failed.\nstdout:\n${result.stdout ?? ''}\nstderr:\n${result.stderr ?? ''}`);
  }

  return JSON.parse(result.stdout || '{"changes":0}');
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
    throw new Error('Unable to reserve a local port for Wave D tests.');
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
