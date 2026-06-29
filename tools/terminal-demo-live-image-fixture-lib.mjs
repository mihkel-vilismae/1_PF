#!/usr/bin/env node
// Builds the live DEMO DB image playback fixture without changing runtime behavior.
// It copies a generated-test image into DEMO downloads, then uses real SQLite helpers.

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const REQUIRED_TABLES = Object.freeze([
  'canonical_media_assets',
  'media_asset_variants',
  'slideshow_queue',
  'runtime_state'
]);

export function buildLiveImageFixture(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const dbPath = resolveRepoPath(repoRoot, options.dbPath ?? process.env.DEMO_DB_PATH ?? 'runtime_data/demo/demo.sqlite');
  const downloadDir = resolveRepoPath(repoRoot, options.downloadDir ?? process.env.DEMO_DOWNLOAD_DIR ?? 'runtime_data/demo/downloaded_files');
  const runtimeOutputDir = resolveRepoPath(repoRoot, options.runtimeOutputDir ?? process.env.DEMO_RUNTIME_OUTPUT_DIR ?? 'runtime_data/demo/outputs');
  const truthDir = resolveRepoPath(repoRoot, process.env.DEMO_V2_WORKER_TRUTH_DIR ?? 'runtime_data/v2_worker_truth/demo');
  const schedulerDir = resolveRepoPath(repoRoot, process.env.DEMO_SCHEDULER_DIR ?? 'runtime_data/scheduler/demo');
  const logDir = resolveRepoPath(repoRoot, process.env.DEMO_LOG_DIR ?? 'runtime_data/logs/demo');
  const schemaPath = path.join(repoRoot, 'database', 'schema.sql');
  const source = chooseSourceImage(repoRoot);
  const destination = path.join(downloadDir, path.relative(path.join(repoRoot, 'generated_test_data'), source));
  const executedAt = options.executedAt ?? new Date().toISOString();
  const address = options.address ?? 'Live demo playback fixture address: generated_test_data GPS image';

  [path.dirname(dbPath), downloadDir, runtimeOutputDir, truthDir, schedulerDir, logDir, path.dirname(destination)].forEach((dir) => mkdirSync(dir, { recursive: true }));
  copyFileSync(source, destination);

  runPython(repoRoot, [path.join(repoRoot, 'server', 'scripts', 'sqlite_admin.py'), 'recreate', dbPath, schemaPath]);
  const stage2 = runPythonJson(repoRoot, [path.join(repoRoot, 'server', 'scripts', 'sqlite_admin.py'), 'stage2_index_register', dbPath, downloadDir, executedAt, schemaPath]);
  const stage5 = runPythonJson(repoRoot, [path.join(repoRoot, 'server', 'scripts', 'sqlite_admin.py'), 'stage5_prepare_queue', dbPath, executedAt, schemaPath]);
  const seed = runPythonJson(repoRoot, ['-c', buildSeedSql(), dbPath, destination, address, executedAt]);
  const contract = runPythonJson(repoRoot, [path.join(repoRoot, 'server', 'scripts', 'sqlite_admin.py'), 'playback_contract', dbPath, repoRoot, '25']);

  return {
    status: 'PASSED',
    decision: 'REAL_DEMO_LIVE_IMAGE_PLAYBACK_FIXTURE_READY',
    repoRoot,
    dbPath,
    downloadDir,
    runtimeOutputDir,
    sourceImage: source,
    copiedImage: destination,
    address,
    tables: REQUIRED_TABLES,
    stage2,
    stage5,
    seed,
    playbackContract: contract,
    messages: [
      `Copied generated_test_data image: ${path.relative(repoRoot, source).replaceAll('\\\\', '/')}`,
      `DEMO downloaded image: ${path.relative(repoRoot, destination).replaceAll('\\\\', '/')}`,
      `DEMO DB: ${path.relative(repoRoot, dbPath).replaceAll('\\\\', '/')}`,
      `READY slideshow_queue rows: ${contract?.queue?.readyCount ?? 0}`
    ]
  };
}

function resolveRepoPath(repoRoot, value) {
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(repoRoot, value);
}

function chooseSourceImage(repoRoot) {
  const preferred = path.join(repoRoot, 'generated_test_data', 'gps_valid', 'gps_valid_01.jpg');
  if (existsSync(preferred)) return preferred;
  const root = path.join(repoRoot, 'generated_test_data');
  const candidates = [];
  walk(root, candidates);
  const image = candidates.find((candidate) => /\.(jpe?g|png|webp)$/i.test(candidate));
  if (!image) throw new Error('No generated_test_data image fixture found.');
  return image;
}

function walk(dir, files) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir).sort()) {
    const absolute = path.join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) walk(absolute, files);
    else if (stat.isFile()) files.push(absolute);
  }
}

function runPython(repoRoot, args) {
  const attempts = [];
  for (const command of ['python3', 'py', 'python']) {
    const finalArgs = command === 'py' ? ['-3', ...args] : args;
    const result = spawnSync(command, finalArgs, { cwd: repoRoot, encoding: 'utf8', timeout: 120000 });
    attempts.push(`${command} ${finalArgs.join(' ')} => ${result.status ?? 'null'}`);
    if (result.error?.code === 'ENOENT') continue;
    if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}\n${attempts.join('\n')}`);
    return result.stdout;
  }
  throw new Error(`No Python command available. Attempts: ${attempts.join('; ')}`);
}

function runPythonJson(repoRoot, args) {
  const output = runPython(repoRoot, args);
  try { return JSON.parse(output); }
  catch { throw new Error(`Python helper returned non-JSON output: ${output}`); }
}

function buildSeedSql() {
  return String.raw`
import os, sqlite3, sys
path, image_path, address, now = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
conn = sqlite3.connect(path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()
asset = cur.execute('SELECT media_asset_id FROM canonical_media_assets WHERE canonical_path = ?', (os.path.abspath(image_path),)).fetchone()
if asset is None:
    raise RuntimeError('copied image was not indexed into canonical_media_assets')
media_id = int(asset['media_asset_id'])
cur.execute("""
UPDATE canonical_media_assets
SET gps_status = 'GPS_FOUND', geocode_status = 'GEOCODE_FOUND', address_text = ?, updated_at = ?
WHERE media_asset_id = ?
""", (address, now, media_id))
queue = cur.execute('SELECT slideshow_queue_id FROM slideshow_queue WHERE media_asset_id = ?', (media_id,)).fetchone()
if queue is None:
    cur.execute("""
    INSERT INTO slideshow_queue (media_asset_id, status, failure_reason, sort_bucket, eligible_since, last_shown_datetime, view_count, created_at, updated_at)
    VALUES (?, 'READY', NULL, 'terminal-demo-live-image-fixture', ?, NULL, 0, ?, ?)
    """, (media_id, now, now, now))
    queue_id = cur.lastrowid
    action = 'inserted'
else:
    queue_id = int(queue['slideshow_queue_id'])
    cur.execute("""
    UPDATE slideshow_queue
    SET status = 'READY', failure_reason = NULL, sort_bucket = 'terminal-demo-live-image-fixture',
        eligible_since = ?, last_shown_datetime = NULL, view_count = 0, updated_at = ?
    WHERE slideshow_queue_id = ?
    """, (now, now, queue_id))
    action = 'updated'
cur.execute("""
INSERT INTO runtime_state (state_key, state_value, value_type, updated_at, updated_by)
VALUES ('current_media_asset_id', ?, 'text', ?, 'terminal_demo_live_image_fixture')
ON CONFLICT(state_key) DO UPDATE SET
  state_value = excluded.state_value,
  value_type = excluded.value_type,
  updated_at = excluded.updated_at,
  updated_by = excluded.updated_by
""", (str(media_id), now))
conn.commit()
print(__import__('json').dumps({'mediaAssetId': media_id, 'slideshowQueueId': queue_id, 'queueAction': action, 'addressText': address}))
conn.close()
`;
}
