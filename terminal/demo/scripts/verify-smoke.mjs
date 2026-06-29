// Verifies the merged terminal Demo Mode smoke paths without mutating runtime data.
// The script can run inside PhotoFrame or the older standalone prototype layout.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

// Runs the terminal entrypoint with compiled JS or tsx-loaded TypeScript.
function run(args, env = {}) {
  const entry = resolveMainEntrypoint();
  const fullEnv = { ...process.env, TERMINAL_DEMO_COLUMNS: '420', ...env };
  if (entry.endsWith('.js')) return execFileSync('node', [entry, ...args], { encoding: 'utf8', env: fullEnv });
  if (hasLocalTsx()) return execFileSync('node', ['--import', 'tsx', entry, ...args], { encoding: 'utf8', env: fullEnv });
  return execFileSync('npm', ['exec', '--yes', 'tsx', '--', entry, ...args], { encoding: 'utf8', env: fullEnv });
}

// Locates the terminal entrypoint for merged and standalone checkouts.
function resolveMainEntrypoint() {
  if (existsSync('terminal/demo/src/main.ts')) return 'terminal/demo/src/main.ts';
  if (existsSync('dist/main.js')) return 'dist/main.js';
  if (existsSync('src/main.ts')) return 'src/main.ts';
  throw new Error('Unable to locate terminal demo entrypoint.');
}

// Detects whether npm dependencies are already installed locally.
function hasLocalTsx() {
  return existsSync('node_modules/tsx/dist/loader.mjs') || existsSync('node_modules/tsx/index.mjs') || existsSync('terminal/demo/node_modules/tsx/dist/loader.mjs');
}

// Removes ANSI escape codes before checking stable terminal text.
function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, '');
}

// Fails with a useful label when a required text marker is missing.
function assertIncludes(output, needle, label) {
  const cleanOutput = stripAnsi(output);
  if (!cleanOutput.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

// Creates a minimal PhotoFrame-like repo fixture with media and demo truth.
function createTruthFixtureRepo() {
  const root = mkdtempSync(join(tmpdir(), 'photoframe-real-demo-truth-'));
  const mediaRoot = join(root, 'generated_test_data');
  for (const dir of ['gps_valid', 'no_gps', 'invalid_gps', 'corrupted', 'videos_with_gps']) mkdirSync(join(mediaRoot, dir), { recursive: true });
  for (const file of [
    'gps_valid/gps_valid_01.jpg',
    'gps_valid/gps_valid_02.jpg',
    'videos_with_gps/apple_like_h264_mov_gps_tallinn.mov',
    'no_gps/no_gps_01.jpg',
    'invalid_gps/invalid_gps_01.jpg',
    'corrupted/corrupted_random_01.jpg'
  ]) writeFileSync(join(mediaRoot, file), 'fixture');

  const truthDir = join(root, 'runtime_data', 'v2_worker_truth', 'demo');
  mkdirSync(truthDir, { recursive: true });
  const outputDir = join(root, 'runtime_data', 'demo', 'outputs');
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(join(root, 'runtime_data', 'demo'), { recursive: true });
  writeFileSync(join(outputDir, 'display_queue.json'), JSON.stringify({
    schemaVersion: 1,
    items: [
      { queueId: 'demo-q-1', rowNumber: 1, fileName: 'gps_valid_01.jpg', relativePath: 'gps_valid/gps_valid_01.jpg', mediaType: 'image', address: 'Demo Queue Address, Tartu', status: 'ready' },
      { queueId: 'demo-q-2', rowNumber: 3, fileName: 'apple_like_h264_mov_gps_tallinn.mov', relativePath: 'videos_with_gps/apple_like_h264_mov_gps_tallinn.mov', mediaType: 'video', address: 'Demo Queue Address, Tallinn', status: 'ready' }
    ]
  }, null, 2));
  writeFileSync(join(truthDir, 'regular-worker.truth.jsonl'), [
    { worker: 'regular-worker', stage: 'index', status: 'finished', timestamp: '2026-06-29T01:00:01.000Z', message: 'index finished', counts: { processed: 6 } },
    { worker: 'regular-worker', stage: 'gps', status: 'finished', timestamp: '2026-06-29T01:00:02.000Z', message: 'gps finished', counts: { gps_valid: 3, gps_missing: 1, gps_invalid: 2 } },
    { worker: 'regular-worker', stage: 'geocode', status: 'finished', timestamp: '2026-06-29T01:00:03.000Z', message: 'geocode finished', counts: { resolved: 3, skipped: 3 } },
    { worker: 'regular-worker', stage: 'queue', status: 'finished', timestamp: '2026-06-29T01:00:04.000Z', message: 'queue finished', counts: { enqueued: 3, not_eligible: 3 } }
  ].map(JSON.stringify).join('\n') + '\n');
  writeFileSync(join(truthDir, 'playback-worker.truth.jsonl'), JSON.stringify({ worker: 'playback-worker', stage: 'playback', status: 'state', timestamp: '2026-06-29T01:00:05.000Z', message: '3 queued media ready' }) + '\n');
  return root;
}

const version = readFileSync('VERSION', 'utf8').trim();
const initial = run(['--smoke']);
const final = run(['--q-smoke']);
const story = run(['--q-storyboard-smoke']);
const manual = run(['--manual-smoke']);
const realDemo = run(['--real-demo-smoke']);
const runtimeConfig = run(['--adapter=real-demo', '--runtime-config-smoke']);
const truthFixtureRepo = createTruthFixtureRepo();
const realDemoWithTruth = run(['--real-demo-smoke'], { PHOTOFRAME_REPO_ROOT: truthFixtureRepo });
const commandPlan = run(['--adapter=real-demo', '--real-demo-command-plan-smoke'], { PHOTOFRAME_REPO_ROOT: truthFixtureRepo });
const realWToggle = run(['--adapter=real-demo', '--w-toggle-smoke'], { PHOTOFRAME_REPO_ROOT: truthFixtureRepo });
const realQBatch5 = run(['--adapter=real-demo', '--batch-size=5', '--q-smoke'], { PHOTOFRAME_REPO_ROOT: truthFixtureRepo });
const realQBatch5Story = run(['--adapter=real-demo', '--batch-size=5', '--q-storyboard-smoke'], { PHOTOFRAME_REPO_ROOT: truthFixtureRepo });

const colorsEnabled = process.env.NO_COLOR !== '1' && process.env.NO_COLOR !== 'true';
if (colorsEnabled) {
  const notEligibleDangerColor = story.includes('\u001b[97;41;1mQueue       [DONE] not eligible') || story.includes('\u001b[97;41;1mResult for row #4: Not eligible');
  if (!notEligibleDangerColor) throw new Error('Missing reddish danger treatment for not eligible storyboard state');
  if (story.includes('\u001b[30;102;1mQueue       [DONE] not eligible')) throw new Error('Not eligible storyboard state must not use green done treatment');
}

for (const [needle, label] of [
  ['PHOTOFRAME MOCK DEMO MODE', 'header'],
  [`v${version}`, 'version banner'],
  ['demo_sunset_tartu_001.jpg', 'mock row 1'],
  ['[Q] Run 5 files -> Queue eligible', 'Q action'],
  ['RPI-STAGES', 'RPI stages panel'],
  ['RPI-WORKERS', 'RPI workers panel'],
  ['Run Playback disabled', 'playback disabled initial'],
  ['SCREEN ON/OFF WORKER', 'screen placeholder'],
  ['PLAYBACK_QUEUE', 'playback queue panel'],
  ['Adapter: mock-demo', 'mock adapter banner']
]) assertIncludes(initial, needle, label);

for (const [needle, label] of [
  ['PHOTOFRAME REAL DEMO TERMINAL', 'real-demo header'],
  ['Adapter: real-demo', 'real-demo adapter banner'],
  ['Data: real_demo_truth', 'real-demo data mode'],
  ['Group 5A real queue reader', 'real-demo group 5A warning'],
  ['W toggles selected batch size', 'real-demo batch toggle note'],
  ['GENERATED DEMO MEDIA', 'real-demo media title'],
  ['RPI-STAGES — DEMO TRUTH', 'real-demo stages truth'],
  ['RPI-WORKERS — DEMO TRUTH', 'real-demo workers truth'],
  ['No real demo queue rows loaded yet.', 'real-demo empty queue state'],
  ['[P] Run Playback disabled', 'real-demo playback disabled without queue']
]) assertIncludes(realDemo, needle, label);

for (const [needle, label] of [
  ['Truth read: regular-worker.truth.jsonl: 4 parsed, 0 malformed', 'regular truth parsed'],
  ['Truth read: playback-worker.truth.jsonl: 1 parsed, 0 malformed', 'playback truth parsed'],
  ['queue finished | enqueued=3 not_eligible=3', 'queue stage mapped'],
  ['Playback worker        Finished', 'playback worker mapped'],
  ['Queue read: Queue file parsed:', 'queue file parsed'],
  ['Real demo playback queue rows: 2', 'queue count in current run'],
  ['gps_valid_01.jpg', 'real queue item image'],
  ['apple_like_h264_mov_gps_tallinn.mov', 'real queue item video'],
  ['[P] Run Playback enabled', 'real playback enabled from queue'],
  ['Ready: 2 real demo queue items available.', 'real playback ready text']
]) assertIncludes(realDemoWithTruth, needle, label);

for (const [needle, label] of [
  ['"batchSize": 1', 'command plan batch size 1'],
  ['"batchSize": 5', 'command plan batch size 5'],
  ['"noCron": true', 'command plan no cron'],
    ['npm run api -- --scheduler regular-stage-worker', 'regular worker command plan'],
  ['terminal_demo_batch_size_5.manifest.json', 'batch 5 manifest plan']
]) assertIncludes(commandPlan, needle, label);


for (const [needle, label] of [
  ['W pressed: selected batch_size=5', 'W toggle selected batch 5'],
  ['Batch: 5', 'header batch size 5'],
  ['Press Q to run using the selected batch size.', 'W toggle Q hint']
]) assertIncludes(realWToggle, needle, label);


for (const [needle, label] of [
  ['Q finished guarded route for batch_size=5', 'Q consumes selected batch 5'],
  ['Rows considered: 5', 'Q batch 5 row selection'],
  ['Route: batch_size_5_stage_batch', 'Q batch 5 route'],
  ['Expected eligible from discovered fixture metadata', 'Q expected eligible summary'],
  ['Expected not eligible from discovered fixture metadata', 'Q expected ineligible summary'],
  ['No cron was used by the terminal.', 'Q no cron statement']
]) assertIncludes(realQBatch5, needle, label);


for (const [needle, label] of [
  ['Manifest: written', 'Q storyboard writes demo manifest'],
  ['Stage snapshot: index', 'Q storyboard index snapshot'],
  ['Stage snapshot: gps', 'Q storyboard gps snapshot'],
  ['Stage snapshot: geocode', 'Q storyboard geocode snapshot'],
  ['Stage snapshot: queue_prepare', 'Q storyboard queue snapshot'],
  ['Execution: planned', 'Q storyboard guarded execution plan'],
  ['Snapshot refresh: media/truth/status re-read for this terminal frame.', 'Q storyboard refresh marker'],
  ['No fake worker success is written by the terminal.', 'Q storyboard no fake success marker']
]) assertIncludes(realQBatch5Story, needle, label);

for (const [needle, label] of [
  ['"adapterMode": "real-demo"', 'runtime config adapter'],
  ['"runtimeMode": "demo"', 'runtime config demo mode'],
  ['"queueOutputPath"', 'runtime config queue path']
]) assertIncludes(runtimeConfig, needle, label);

for (const [needle, label] of [
  ['Demo Address, Tartu, Estonia', 'row 1 final address'],
  ['enqueued=3', 'queue batch counts'],
  ['Rows #1, #3, #5 [DONE] enqueued for playback', 'enqueued rows result'],
  ['Row #2 [DONE] skipped', 'row 2 skipped'],
  ['Row #4 [DONE] skipped', 'row 4 skipped'],
  ['[P] Run Playback enabled', 'final playback enabled']
]) assertIncludes(final, needle, label);

for (const [needle, label] of [
  ['-> [Q] [ACTIVE]', 'Q active arrow'],
  ['-> [Run 5 files] [ACTIVE]', 'run batch active arrow'],
  ['-> GPS parser  [ACTIVE] running', 'gps active arrow'],
  ['missing GPS detected', 'missing GPS error step'],
  ['invalid GPS detected', 'invalid GPS error step'],
  ['Queue       [DONE] not eligible', 'not eligible done marker']
]) assertIncludes(story, needle, label);

for (const [needle, label] of [
  ['Manual storyboard mode: step 1/22', 'manual mode first step'],
  ['Manual storyboard mode: step 22/22', 'manual mode final step'],
  ['-> Queue       [ACTIVE] enqueueing for playback', 'manual queue active arrow']
]) assertIncludes(manual, needle, label);

console.log(`verify-smoke: PASS v${version}`);
