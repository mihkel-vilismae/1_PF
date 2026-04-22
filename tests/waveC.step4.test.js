import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntryPath = path.join(repoRoot, 'server', 'index.js');
const schemaPath = path.join(repoRoot, 'schema.sql');
const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

test('POST /api/runtime/gps/run processes queued EXIF GPS work and seeds geocode queue', async () => {
  await withRuntimeServer({ schemaDb: true }, async ({ port, dbPath, downloadDir }) => {
    const gpsImagePath = path.join(downloadDir, 'gps-happy.jpg');
    await createGpsExifImage(gpsImagePath, 58.377625, 26.729006, 123.45);
    await insertIndexedAsset(dbPath, gpsImagePath, 'gps-happy.jpg');

    const response = await requestJson(port, '/api/runtime/gps/run', { method: 'POST', body: {} });
    assert.ok(response.status < 400);
    assert.equal(response.json.processed_count, 1);
    assert.equal(response.json.success_count, 1);
    assert.equal(response.json.failure_count, 0);

    const rows = await queryRows(
      dbPath,
      `SELECT c.gps_status, c.successful_gps_parser_method, c.gps_latitude, c.gps_longitude,
              q.status AS gps_queue_status,
              (SELECT COUNT(*) FROM geocode_queue) AS geocode_queue_count
       FROM canonical_media_assets c
       INNER JOIN parse_files_for_gps_queue q ON q.media_asset_id = c.media_asset_id`,
    );

    assert.equal(rows[0].gps_status, 'GPS_FOUND');
    assert.equal(rows[0].successful_gps_parser_method, 'EXIF');
    assert.equal(rows[0].gps_queue_status, 'COMPLETED');
    assert.equal(rows[0].geocode_queue_count, 1);
    assert.ok(Math.abs(rows[0].gps_latitude - 58.377625) < 0.0002);
    assert.ok(Math.abs(rows[0].gps_longitude - 26.729006) < 0.0002);
  });
});

test('POST /api/runtime/geocode/run writes address cache and canonical address text idempotently', async () => {
  await withRuntimeServer({ schemaDb: true }, async ({ port, dbPath, downloadDir }) => {
    const gpsImagePath = path.join(downloadDir, 'gps-geocode.jpg');
    await createGpsExifImage(gpsImagePath, 58.377625, 26.729006, 123.45);
    await insertIndexedAsset(dbPath, gpsImagePath, 'gps-geocode.jpg');

    const gpsResponse = await requestJson(port, '/api/runtime/gps/run', { method: 'POST', body: {} });
    assert.equal(gpsResponse.status, 200);

    const geocodeResponse1 = await requestJson(port, '/api/runtime/geocode/run', { method: 'POST', body: {} });
    assert.equal(geocodeResponse1.status, 200);
    assert.equal(geocodeResponse1.json.processed_count, 1);
    assert.equal(geocodeResponse1.json.success_count, 1);
    assert.equal(geocodeResponse1.json.failure_count, 0);

    const countsAfterFirstRun = await queryRows(
      dbPath,
      `SELECT (SELECT COUNT(*) FROM geocode_queue) AS geocode_queue,
              (SELECT COUNT(*) FROM address_cache) AS address_cache`,
    );
    assert.deepEqual(countsAfterFirstRun[0], { geocode_queue: 1, address_cache: 1 });

    const geocodeResponse2 = await requestJson(port, '/api/runtime/geocode/run', { method: 'POST', body: {} });
    assert.equal(geocodeResponse2.status, 200);
    assert.equal(geocodeResponse2.json.processed_count, 0);
    assert.equal(geocodeResponse2.json.success_count, 0);
    assert.equal(geocodeResponse2.json.failure_count, 0);

    const rows = await queryRows(
      dbPath,
      `SELECT c.geocode_status, c.address_text, c.address_cache_key, q.status AS geocode_queue_status,
              a.provider_name, a.address_text AS cached_address_text,
              (SELECT COUNT(*) FROM address_cache) AS address_cache_count
       FROM canonical_media_assets c
       INNER JOIN geocode_queue q ON q.media_asset_id = c.media_asset_id
       INNER JOIN address_cache a ON a.address_cache_key = c.address_cache_key`,
    );

    assert.equal(rows[0].geocode_status, 'GEOCODE_FOUND');
    assert.equal(rows[0].geocode_queue_status, 'COMPLETED');
    assert.equal(rows[0].provider_name, 'deterministic_placeholder');
    assert.equal(rows[0].address_text, rows[0].cached_address_text);
    assert.match(rows[0].address_text, /Lat: 58\.37763, Lon: 26\.72901/);
    assert.equal(rows[0].address_cache_count, 1);
  });
});

test('POST /api/runtime/gps/run is a successful no-op when no queued work exists', async () => {
  await withRuntimeServer({ schemaDb: true }, async ({ port }) => {
    const response = await requestJson(port, '/api/runtime/gps/run', { method: 'POST', body: {} });
    assert.equal(response.status, 200);
    assert.equal(response.json.processed_count, 0);
    assert.equal(response.json.success_count, 0);
    assert.equal(response.json.failure_count, 0);
  });
});

test('POST /api/runtime/gps/run marks queue row as no GPS when media has no EXIF coordinates', async () => {
  await withRuntimeServer({ schemaDb: true }, async ({ port, dbPath, downloadDir }) => {
    const plainImagePath = path.join(downloadDir, 'no-gps.jpg');
    await writePlainJpeg(plainImagePath);
    await insertIndexedAsset(dbPath, plainImagePath, 'no-gps.jpg');

    const response = await requestJson(port, '/api/runtime/gps/run', { method: 'POST', body: {} });
    assert.equal(response.status, 200);
    assert.equal(response.json.processed_count, 1);
    assert.equal(response.json.success_count, 0);
    assert.equal(response.json.failure_count, 1);

    const rows = await queryRows(
      dbPath,
      `SELECT c.gps_status, c.successful_gps_parser_method, q.status, q.failure_code
       FROM canonical_media_assets c
       INNER JOIN parse_files_for_gps_queue q ON q.media_asset_id = c.media_asset_id`,
    );
    assert.equal(rows[0].gps_status, 'GPS_NOT_FOUND');
    assert.equal(rows[0].successful_gps_parser_method, null);
    assert.equal(rows[0].status, 'NO_GPS_FOUND');
    assert.equal(rows[0].failure_code, 'gps_not_found');
  });
});

async function withRuntimeServer(options, run) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'pf-wavec-step4-'));
  const port = await reservePort();
  const dbDir = path.join(workspaceRoot, 'state');
  const downloadDir = path.join(workspaceRoot, 'downloads');
  const logDir = path.join(workspaceRoot, 'logs');
  const cookieDir = path.join(workspaceRoot, 'cookies');
  const envFilePath = path.join(workspaceRoot, 'wavec.test.env');
  const dbPath = path.join(dbDir, 'wavec-test.sqlite');

  await Promise.all([
    mkdir(dbDir, { recursive: true }),
    mkdir(downloadDir, { recursive: true }),
    mkdir(logDir, { recursive: true }),
    mkdir(cookieDir, { recursive: true }),
  ]);

  await writeFile(envFilePath, buildEnvFile({ downloadDir, dbPath, logDir, cookieDir }), 'utf8');

  if (options.schemaDb) {
    await execSqlFile(dbPath, schemaPath);
  }

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
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', fail);
    child.once('exit', (code, signal) => fail(new Error(`server exited before becoming ready (code=${code}, signal=${signal ?? 'null'})`)));
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

function buildEnvFile({ downloadDir, dbPath, logDir, cookieDir }) {
  return [
    'user=test-user@example.com',
    'pw=test-password',
    `DOWNLOAD_DIR=${downloadDir}`,
    `DB_PATH=${dbPath}`,
    `LOG_DIR=${logDir}`,
    `ICLOUDPD_COOKIE_DIR=${cookieDir}`,
    'DOWNLOAD_RECENT=25',
  ].join('\n');
}

async function execSqlFile(dbPath, sqlFilePath) {
  const sql = await readFile(sqlFilePath, 'utf8');
  const result = spawnSync(pythonCommand, ['-c', `import sqlite3, sys; con=sqlite3.connect(sys.argv[1]); con.executescript(sys.stdin.read()); con.commit(); con.close()`, dbPath], { input: sql, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Failed to apply schema.sql');
}

async function insertIndexedAsset(dbPath, filePath, originalFilename) {
  const result = spawnSync(pythonCommand, ['-c', `
import hashlib, os, sqlite3, sys

db_path, file_path, original_filename = sys.argv[1:4]
stat = os.stat(file_path)
canonical_path = os.path.abspath(file_path)
asset_key = hashlib.sha1(f"{canonical_path}|{stat.st_size}|{stat.st_mtime_ns}".encode('utf-8')).hexdigest()
content_hash = hashlib.sha1(open(file_path, 'rb').read()).hexdigest()
now = '2026-04-22T00:00:00Z'
con = sqlite3.connect(db_path)
cur = con.cursor()
cur.execute("""
INSERT INTO canonical_media_assets (
  asset_key, original_filename, canonical_path, media_type, file_extension,
  file_size_bytes, content_hash, captured_at, gps_status, geocode_status, created_at, updated_at
) VALUES (?, ?, ?, 'image', 'jpg', ?, ?, ?, 'GPS_PENDING', 'GEOCODE_PENDING', ?, ?)
""", (asset_key, original_filename, canonical_path, stat.st_size, content_hash, now, now, now))
media_asset_id = cur.lastrowid
cur.execute("""
INSERT INTO media_asset_variants (
  media_asset_id, variant_kind, file_path, file_extension, file_size_bytes, created_at, updated_at
) VALUES (?, 'original', ?, 'jpg', ?, ?, ?)
""", (media_asset_id, canonical_path, stat.st_size, now, now))
cur.execute("""
INSERT INTO parse_files_for_gps_queue (
  media_asset_id, status, attempt_count, created_at, updated_at
) VALUES (?, 'PENDING', 0, ?, ?)
""", (media_asset_id, now, now))
con.commit()
con.close()
`, dbPath, filePath, originalFilename], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Failed to insert test asset');
}

async function createGpsExifImage(filePath, latitude, longitude, altitude) {
  const result = spawnSync(pythonCommand, ['-c', `
from PIL import Image, TiffImagePlugin
from PIL.ExifTags import Base
import sys

def rat(a, b): return TiffImagePlugin.IFDRational(a, b)
def to_deg(value):
    value = abs(float(value))
    degrees = int(value)
    minutes_float = (value - degrees) * 60
    minutes = int(minutes_float)
    seconds = (minutes_float - minutes) * 60
    return (rat(degrees, 1), rat(minutes, 1), rat(int(round(seconds * 10000)), 10000))
path, lat, lon, alt = sys.argv[1:5]
lat = float(lat); lon = float(lon); alt = float(alt)
image = Image.new('RGB', (12, 12), (255, 0, 0))
exif = Image.Exif()
exif[Base.GPSInfo] = {1: 'N' if lat >= 0 else 'S', 2: to_deg(lat), 3: 'E' if lon >= 0 else 'W', 4: to_deg(lon), 6: rat(int(round(alt * 100)), 100)}
image.save(path, exif=exif)
`, filePath, String(latitude), String(longitude), String(altitude)], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Failed to create GPS EXIF image');
}

async function writePlainJpeg(filePath) {
  const result = spawnSync(pythonCommand, ['-c', `from PIL import Image; import sys; Image.new('RGB', (12, 12), (0, 255, 0)).save(sys.argv[1])`, filePath], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Failed to create JPEG without GPS');
}

async function queryRows(dbPath, sql) {
  const result = spawnSync(pythonCommand, ['-c', `
import json, sqlite3, sys
con = sqlite3.connect(sys.argv[1]); con.row_factory = sqlite3.Row
rows = [dict(row) for row in con.execute(sys.argv[2]).fetchall()]
con.close(); print(json.dumps(rows))
`, dbPath, sql], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Failed SQL query');
  return JSON.parse(result.stdout || '[]');
}

async function requestJson(port, pathname, options) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: options.method || 'GET',
    headers: { 'content-type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  return { status: response.status, json: text ? JSON.parse(text) : null };
}

async function reservePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function onceExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => child.once('exit', () => resolve()));
}
