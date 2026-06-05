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
const schemaPath = path.join(repoRoot, 'schema.sql');
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
