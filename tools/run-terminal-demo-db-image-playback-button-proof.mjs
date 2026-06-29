import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';

const repoRoot = process.cwd();
const startedAt = new Date().toISOString();
const proof = 'terminal-demo-db-image-playback-button';
const tempRoot = mkdtempSync(join(tmpdir(), 'pf-db-playback-proof-'));
const mediaDir = join(tempRoot, 'demo-media');
const outputDir = join(tempRoot, 'demo-outputs');
const truthDir = join(tempRoot, 'truth');
const schedulerDir = join(tempRoot, 'scheduler');
const logDir = join(tempRoot, 'logs');
const dbPath = join(tempRoot, 'demo.sqlite');
const imagePath = join(mediaDir, 'queued-address-image.svg');
const addressText = 'Tartu Proof Address, Estonia';

try {
  [mediaDir, outputDir, truthDir, schedulerDir, logDir].forEach((dir) => mkdirSync(dir, { recursive: true }));
  writeFileSync(imagePath, `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#223"/><text x="40" y="180" fill="white" font-size="32">DB Playback Proof</text></svg>`, 'utf8');
  recreateAndSeedDatabase();

  const env = {
    ...process.env,
    NO_COLOR: '1',
    PHOTOFRAME_TERMINAL_ADAPTER: 'real-demo',
    DEMO_DB_PATH: dbPath,
    DEMO_DOWNLOAD_DIR: mediaDir,
    DEMO_RUNTIME_OUTPUT_DIR: outputDir,
    DEMO_V2_WORKER_TRUTH_DIR: truthDir,
    DEMO_SCHEDULER_DIR: schedulerDir,
    DEMO_LOG_DIR: logDir,
    DEMO_QUEUE_OUTPUT_PATH: join(outputDir, 'legacy-display-queue.json'),
    TERMINAL_DEMO_DB_PLAYBACK_PROOF: '1'
  };

  const run = spawnSync('npm', ['run', 'demo:terminal:real', '--', '--db-image-playback-button-smoke'], {
    cwd: repoRoot,
    env,
    encoding: 'utf8',
    timeout: 120000,
    shell: process.platform === 'win32'
  });

  const output = `${run.stdout}\n${run.stderr}`;
  const viewerPath = join(outputDir, 'db-image-playback', 'windowed-playback.html');
  const viewerHtml = existsSync(viewerPath) ? readFileSync(viewerPath, 'utf8') : '';
  const assertions = {
    command_exited_zero: run.status === 0,
    db_button_reported_rendered: output.includes('DB image playback status: rendered'),
    uses_demo_db_path: output.includes('DEMO_DB_PATH') || output.includes('DEMO DB queue source'),
    uses_real_tables: output.includes('canonical_media_assets') && output.includes('slideshow_queue') && output.includes('runtime_state'),
    uses_real_helpers: output.includes('playback_contract') && output.includes('stage6_select_current') && output.includes('playback_asset_media_path'),
    does_not_use_json_queue_for_button: !output.includes('DEMO_QUEUE_OUTPUT_PATH'),
    address_overlay_rendered: viewerHtml.includes(addressText),
    selected_image_referenced: viewerHtml.includes('queued-address-image.svg') || viewerHtml.includes('queued-address-image')
  };
  const passed = Object.values(assertions).every(Boolean);
  const payload = {
    proof,
    status: passed ? 'PASSED' : 'BLOCKED',
    checkedAt: new Date().toISOString(),
    startedAt,
    decision: passed ? 'TERMINAL_DEMO_DB_IMAGE_PLAYBACK_BUTTON_READY' : 'TERMINAL_DEMO_DB_IMAGE_PLAYBACK_BUTTON_BLOCKED',
    dbPath: relative(repoRoot, dbPath),
    mediaDir: relative(repoRoot, mediaDir),
    viewerPath: relative(repoRoot, viewerPath),
    tables: ['canonical_media_assets', 'media_asset_variants', 'slideshow_queue', 'runtime_state'],
    helpers: ['playback_contract', 'stage6_select_current', 'playback_asset_media_path'],
    assertions,
    exitCode: run.status,
    outputExcerpt: output.split('\n').filter(Boolean).slice(-60)
  };
  console.log(JSON.stringify(payload, null, 2));
  process.exit(passed ? 0 : 1);
} finally {
  if (process.env.KEEP_TERMINAL_DEMO_DB_PLAYBACK_PROOF !== '1') rmSync(tempRoot, { recursive: true, force: true });
}

function recreateAndSeedDatabase() {
  const sqliteScript = join(repoRoot, 'server', 'scripts', 'sqlite_admin.py');
  const schemaPath = join(repoRoot, 'database', 'schema.sql');
  const recreate = runPython([sqliteScript, 'recreate', dbPath, schemaPath]);
  if (recreate.status !== 0) throw new Error(`recreate failed: ${recreate.stderr || recreate.stdout}`);
  const seed = runPython(['-c', buildSeedScript(), dbPath, imagePath, addressText]);
  if (seed.status !== 0) throw new Error(`seed failed: ${seed.stderr || seed.stdout}`);
}

function runPython(args) {
  for (const command of ['python3', 'py', 'python']) {
    const finalArgs = command === 'py' ? ['-3', ...args] : args;
    const result = spawnSync(command, finalArgs, { cwd: repoRoot, encoding: 'utf8', timeout: 120000 });
    if (result.error?.code === 'ENOENT') continue;
    return result;
  }
  throw new Error('No Python command available.');
}

function buildSeedScript() {
  return String.raw`
import os, sqlite3, sys
path, image_path, address = sys.argv[1], sys.argv[2], sys.argv[3]
now = '2026-06-29T00:00:00.000Z'
conn = sqlite3.connect(path)
conn.execute('PRAGMA foreign_keys = ON')
cur = conn.cursor()
cur.execute("""INSERT INTO canonical_media_assets (asset_key, original_filename, canonical_path, media_type, file_extension, file_size_bytes, content_hash, captured_at, gps_status, geocode_status, address_text, successful_gps_parser_method, created_at, updated_at) VALUES (?, ?, ?, 'image', 'svg', ?, 'proof-svg-hash', ?, 'GPS_FOUND', 'GEOCODE_FOUND', ?, 'proof-real-shape-seed', ?, ?)""", ('proof-db-image', os.path.basename(image_path), image_path, os.path.getsize(image_path), now, address, now, now))
media_id = cur.lastrowid
cur.execute("""INSERT INTO media_asset_variants (media_asset_id, variant_kind, file_path, file_extension, file_size_bytes, created_at, updated_at) VALUES (?, 'original', ?, 'svg', ?, ?, ?)""", (media_id, image_path, os.path.getsize(image_path), now, now))
cur.execute("""INSERT INTO slideshow_queue (media_asset_id, status, sort_bucket, eligible_since, last_shown_datetime, view_count, created_at, updated_at) VALUES (?, 'READY', 'demo-proof', ?, NULL, 0, ?, ?)""", (media_id, now, now, now))
conn.commit()
conn.close()
`;
}
