#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const repoRoot = process.cwd();
const proof = 'terminal-demo-windows-viewer-launch';
const sourcePath = join(repoRoot, 'terminal/demo/src/playback/DbImagePlaybackButton.ts');
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const source = existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : '';
const runtime = runBlockedLaunchScenario();

const assertions = {
  db_playback_source_exists: Boolean(source),
  uses_invoke_item_literal_path: source.includes('Invoke-Item -LiteralPath $viewerPath'),
  uses_rundll32_file_protocol_handler: source.includes("'rundll32.exe'") && source.includes("'url.dll,FileProtocolHandler'") && source.includes('pathToFileURL(viewerPath).href'),
  uses_explorer_fallback: source.includes("'explorer.exe'") && source.includes('[viewerPath]'),
  removed_cmd_start_fallback: !source.includes('cmd.exe') && !source.includes('start ""') && !source.includes('openWindowedViewerWithCmdStart'),
  preserves_partial_state_on_blocked_open: source.includes('PartialPlaybackState') && source.includes('blocked(openMessages') && source.includes('{ viewerPath, address, filePath }'),
  writes_p_button_action_log: source.includes('terminal-button-actions.jsonl') && source.includes("button: 'P'") && source.includes("action: 'db_image_playback'"),
  keeps_non_windows_proof_guard: source.includes("process.platform === 'win32'") && source.includes("TERMINAL_DEMO_DB_PLAYBACK_PROOF !== '1'"),
  package_script_registered: packageJson.scripts?.['proof:terminal-demo-windows-viewer-launch'] === 'node tools/run-terminal-demo-windows-viewer-launch-proof.mjs',
  forced_blocked_run_exits_zero: runtime.exitCode === 0,
  blocked_launch_preserves_viewer_path: runtime.output.includes('DB image playback status: blocked') && runtime.output.includes('Windowed playback viewer:') && !runtime.output.includes('Windowed playback viewer: not written'),
  blocked_launch_preserves_file_path: runtime.output.includes('Selected image file:') && !runtime.output.includes('Selected image file: none'),
  blocked_launch_mentions_new_attempts: runtime.actionLogText.includes('Invoke-Item -LiteralPath') && runtime.actionLogText.includes('rundll32 FileProtocolHandler') && runtime.actionLogText.includes('explorer.exe'),
  p_action_jsonl_written: runtime.actionLogExists,
  p_action_jsonl_records_blocked_open: runtime.actionLogText.includes('"button":"P"') && runtime.actionLogText.includes('"status":"blocked"') && runtime.actionLogText.includes('"viewerWritten":true') && runtime.actionLogText.includes('Invoke-Item -LiteralPath')
};

const passed = Object.values(assertions).every(Boolean);
const payload = {
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'REAL_DEMO_WINDOWS_P_VIEWER_LAUNCH_READY' : 'REAL_DEMO_WINDOWS_P_VIEWER_LAUNCH_BLOCKED',
  source: 'terminal/demo/src/playback/DbImagePlaybackButton.ts',
  runtime: {
    tempRoot: runtime.tempRoot,
    viewerPath: runtime.viewerPath,
    actionLogPath: runtime.actionLogPath,
    exitCode: runtime.exitCode,
    outputExcerpt: runtime.output.split('\n').filter(Boolean).slice(-40)
  },
  assertions
};

console.log(JSON.stringify(payload, null, 2));
process.exit(passed ? 0 : 1);

function runBlockedLaunchScenario() {
  const tempRoot = mkdtempSync(join(tmpdir(), 'pf-win-viewer-launch-proof-'));
  const mediaDir = join(tempRoot, 'demo-media');
  const outputDir = join(tempRoot, 'demo-outputs');
  const truthDir = join(tempRoot, 'truth');
  const schedulerDir = join(tempRoot, 'scheduler');
  const logDir = join(tempRoot, 'logs');
  const dbPath = join(tempRoot, 'demo.sqlite');
  const imagePath = join(mediaDir, 'queued-windows-launch-image.svg');
  const addressText = 'Windows Launch Proof Address, Estonia';
  try {
    [mediaDir, outputDir, truthDir, schedulerDir, logDir].forEach((dir) => mkdirSync(dir, { recursive: true }));
    writeFileSync(imagePath, '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#123"/></svg>', 'utf8');
    recreateAndSeedDatabase(dbPath, imagePath, addressText);
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
      TERMINAL_DEMO_DB_PLAYBACK_FORCE_WINDOWS_OPEN: '1',
      TERMINAL_DEMO_DB_PLAYBACK_FAKE_OPEN_FAILURE: '1'
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
    const actionLogPath = join(logDir, 'terminal-button-actions.jsonl');
    const actionLogText = existsSync(actionLogPath) ? readFileSync(actionLogPath, 'utf8') : '';
    return { tempRoot, viewerPath, actionLogPath, actionLogExists: existsSync(actionLogPath), actionLogText, output, exitCode: run.status };
  } finally {
    if (process.env.KEEP_TERMINAL_DEMO_WINDOWS_VIEWER_LAUNCH_PROOF !== '1') rmSync(tempRoot, { recursive: true, force: true });
  }
}

function recreateAndSeedDatabase(dbPath, imagePath, addressText) {
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
now = '2026-07-01T00:00:00.000Z'
conn = sqlite3.connect(path)
conn.execute('PRAGMA foreign_keys = ON')
cur = conn.cursor()
cur.execute("""INSERT INTO canonical_media_assets (asset_key, original_filename, canonical_path, media_type, file_extension, file_size_bytes, content_hash, captured_at, gps_status, geocode_status, address_text, successful_gps_parser_method, created_at, updated_at) VALUES (?, ?, ?, 'image', 'svg', ?, 'proof-win-launch-hash', ?, 'GPS_FOUND', 'GEOCODE_FOUND', ?, 'proof-real-shape-seed', ?, ?)""", ('proof-windows-launch-image', os.path.basename(image_path), image_path, os.path.getsize(image_path), now, address, now, now))
media_id = cur.lastrowid
cur.execute("""INSERT INTO media_asset_variants (media_asset_id, variant_kind, file_path, file_extension, file_size_bytes, created_at, updated_at) VALUES (?, 'original', ?, 'svg', ?, ?, ?)""", (media_id, image_path, os.path.getsize(image_path), now, now))
cur.execute("""INSERT INTO slideshow_queue (media_asset_id, status, sort_bucket, eligible_since, last_shown_datetime, view_count, created_at, updated_at) VALUES (?, 'READY', 'windows-launch-proof', ?, NULL, 0, ?, ?)""", (media_id, now, now, now))
conn.commit()
conn.close()
`;
}
