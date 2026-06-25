/*
 * Verifies the proof-only generated video fixture seed path.
 * Uses a temporary SQLite database and never launches mpv or a real API server.
 * Protects production queue ordering by checking this path is explicit proof tooling.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const sqliteAdmin = path.join(repoRoot, 'server', 'scripts', 'sqlite_admin.py');
const schemaPath = path.join(repoRoot, 'database', 'schema.sql');
const fixturePath = 'generated_test_data/videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4';

/** Runs sqlite_admin.py and returns the parsed JSON stdout. */
function runSqliteAdmin(args) {
  const result = spawnSync('python3', [sqliteAdmin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('proof video fixture seed creates current READY video item in isolated database', () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'pf-video-proof-seed-'));
  const dbPath = path.join(tempRoot, 'test.sqlite');
  const seed = runSqliteAdmin([
    'seed_live_windows_native_video_fixture',
    dbPath,
    fixturePath,
    repoRoot,
    '2026-06-05T00:00:00.000Z',
    schemaPath,
  ]);
  assert.equal(seed.status, 'ok');
  assert.equal(seed.proofOnly, true);
  assert.equal(seed.mediaType, 'video');
  assert.equal(seed.fixtureRelativePath, fixturePath);

  const contract = runSqliteAdmin(['playback_contract', dbPath, repoRoot, '10']);
  assert.equal(contract.currentItem.mediaType, 'video');
  assert.equal(contract.currentItem.displayName, 'apple_like_h264_mp4_gps_new_york.mp4');
  assert.equal(contract.currentItem.queueStatus, 'READY');
  assert.equal(contract.currentItem.isCurrent, true);
  assert.equal(contract.nextItem.mediaType, 'video');
  assert.equal(contract.queue.readyCount, 1);
});

test('proof video fixture seed makes video current ahead of existing READY image rows', () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'pf-video-proof-seed-priority-'));
  const dbPath = path.join(tempRoot, 'test.sqlite');
  runSqliteAdmin(['recreate', dbPath, schemaPath]);
  const py = `
import sqlite3
conn = sqlite3.connect(r'''${dbPath}''')
cur = conn.cursor()
cur.execute("""INSERT INTO canonical_media_assets (asset_key, original_filename, canonical_path, media_type, file_extension, file_size_bytes, content_hash, captured_at, gps_status, geocode_status, address_text, successful_gps_parser_method, created_at, updated_at) VALUES ('existing-image', 'duplicate_copy_01.jpg', 'generated_test_data/duplicates/duplicate_copy_01.jpg', 'image', 'jpg', 1, 'image-sha', '2026-06-05T00:00:00.000Z', 'GPS_FOUND', 'GEOCODE_FOUND', 'Existing image address', 'test', '2026-06-05T00:00:00.000Z', '2026-06-05T00:00:00.000Z')""")
asset_id = cur.lastrowid
cur.execute("""INSERT INTO media_asset_variants (media_asset_id, variant_kind, file_path, file_extension, file_size_bytes, created_at, updated_at) VALUES (?, 'original', 'generated_test_data/duplicates/duplicate_copy_01.jpg', 'jpg', 1, '2026-06-05T00:00:00.000Z', '2026-06-05T00:00:00.000Z')""", (asset_id,))
cur.execute("""INSERT INTO slideshow_queue (media_asset_id, status, sort_bucket, eligible_since, last_shown_datetime, view_count, created_at, updated_at) VALUES (?, 'READY', 'default', '2026-06-05T00:00:00.000Z', NULL, 0, '2026-06-05T00:00:00.000Z', '2026-06-05T00:00:00.000Z')""", (asset_id,))
conn.commit()
conn.close()
`;
  const prep = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
  assert.equal(prep.status, 0, prep.stderr || prep.stdout);

  const seed = runSqliteAdmin([
    'seed_live_windows_native_video_fixture',
    dbPath,
    fixturePath,
    repoRoot,
    '2026-06-05T00:01:00.000Z',
    schemaPath,
  ]);
  assert.equal(seed.status, 'ok');
  assert.equal(seed.demotedReadyRows, 1);

  const contract = runSqliteAdmin(['playback_contract', dbPath, repoRoot, '10']);
  assert.equal(contract.currentItem.mediaType, 'video');
  assert.equal(contract.currentItem.isCurrent, true);
  assert.equal(contract.nextItem.mediaType, 'video');
  assert.equal(contract.items[0].mediaType, 'video');
  assert.equal(contract.items[1].mediaType, 'image');
});

test('proof video fixture seed rejects paths outside generated_test_data', () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'pf-video-proof-seed-reject-'));
  const dbPath = path.join(tempRoot, 'test.sqlite');
  const result = spawnSync('python3', [
    sqliteAdmin,
    'seed_live_windows_native_video_fixture',
    dbPath,
    'README.md',
    repoRoot,
    '2026-06-05T00:00:00.000Z',
    schemaPath,
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /generated_test_data/);
});

test('normal launcher docs do not vendor local ffmpeg or mpv bundles', () => {
  const gitignore = readFileSync(path.join(repoRoot, '.gitignore'), 'utf8');
  assert.match(gitignore, /tools\/mpv\//);
  assert.match(gitignore, /tools\/ffmpeg\//);
});
