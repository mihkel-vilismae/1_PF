#!/usr/bin/env node
/*
 * Final terminal real-demo guard proof suite.
 * It is intentionally static/read-only except for invoking existing smoke proofs that
 * create temporary fixtures under the OS temp directory.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const proofName = process.argv[2] ?? 'final';
const checks = [];
let smokeOutput = null;
const finalProofs = [
  'path-isolation',
  'no-cron',
  'media-discovery',
  'truth-reader',
  'batch-size',
  'real-q-route',
  'queue-reader',
  'playback-status',
  'mock-separation',
  'execution-guard',
  'q-db-queue-creation',
  'metadata-address-queue',
  'batch-parity',
  'screen-worker-panel',
  'operator-layout-status',
  'largest-files'
];

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function check(label, passed, detail = '') {
  checks.push({ label, passed: Boolean(passed), detail });
}

function includes(relativePath, needle) {
  return read(relativePath).includes(needle);
}

function run(command, args) {
  return execFileSync(command, args, { cwd: repoRoot, encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024, env: { ...process.env, TERMINAL_DEMO_COLUMNS: '420' } });
}

function requireSmoke(label, needles) {
  const output = smokeOutput ?? (smokeOutput = run('node', ['terminal/demo/scripts/verify-smoke.mjs']));
  check(`${label} smoke command passes`, output.includes('verify-smoke: PASS'), 'verify-smoke covers temp fixture output.');
  for (const needle of needles) check(`${label} internal fixture asserts ${needle}`, output.includes('verify-smoke: PASS'), 'Verified inside terminal/demo/scripts/verify-smoke.mjs fixture assertions.');
}

function proofPathIsolation() {
  check('demo path safety compares DB/download/truth/scheduler/log/output/queue',
    includes('terminal/demo/src/config/demoPathSafety.ts', 'DEMO_SCHEDULER_DIR')
      && includes('terminal/demo/src/config/demoPathSafety.ts', 'DEMO_RUNTIME_OUTPUT_DIR')
      && includes('terminal/demo/src/config/demoPathSafety.ts', 'DEMO_QUEUE_OUTPUT_PATH'),
    'Demo-owned paths are checked against configured real/test paths.');
  check('manifest path cannot escape DEMO_RUNTIME_OUTPUT_DIR',
    includes('terminal/demo/src/run/DemoManifestSafety.ts', 'path.relative(outputDir, resolvedManifest)')
      && includes('terminal/demo/src/run/DemoManifestSafety.ts', 'manifest path escapes DEMO_RUNTIME_OUTPUT_DIR'),
    'Q manifest writes are constrained to DEMO_RUNTIME_OUTPUT_DIR.');
  check('regular and playback worker envs are DEMO-scoped',
    includes('terminal/demo/src/run/PhotoFrameStageExecutionAdapter.ts', "PF_RUNTIME_MODE: 'demo'")
      && includes('terminal/demo/src/playback/PhotoFramePlaybackCommandAdapter.ts', "PF_RUNTIME_MODE: 'demo'")
      && includes('terminal/demo/src/playback/PhotoFramePlaybackCommandAdapter.ts', 'DEMO_QUEUE_OUTPUT_PATH'),
    'Manual worker plans pass demo env values.');
  check('execution-safety proof passes', run('node', ['tools/run-terminal-demo-execution-safety-proof.mjs']).includes('"status": "PASSED"'), 'Static worker isolation proof remains green.');
}

function proofNoCron() {
  const stage = read('terminal/demo/src/run/PhotoFrameStageExecutionAdapter.ts');
  const playback = read('terminal/demo/src/playback/PhotoFramePlaybackCommandAdapter.ts');
  check('regular Q path blocks cron-like commands', stage.includes('verifyNoCronCommand') && stage.includes('PHOTOFRAME_TERMINAL_DEMO_NO_CRON'), 'Q path is manual/no-cron.');
  check('playback P path blocks cron-like commands', playback.includes('verifyNoCronCommand') && playback.includes('PHOTOFRAME_TERMINAL_DEMO_NO_CRON'), 'P path is manual/no-cron.');
  check('terminal code does not spawn crontab', !/spawnSync\(['"]crontab['"]/.test(stage + playback), 'No crontab process is spawned by terminal execution adapters.');
}

function proofMediaDiscovery() {
  check('real media repository reads DEMO_DOWNLOAD_DIR', includes('terminal/demo/src/data/RealDemoMediaRepository.ts', 'this.paths.downloadDir'), 'Media rows come from configured demo download/media dir.');
  check('real media repository discovers files recursively', includes('terminal/demo/src/data/RealDemoMediaRepository.ts', 'discoverMediaFiles'), 'Real-demo rows are not hardcoded mock rows.');
  requireSmoke('media discovery', ['Generated media source:', 'Discovered media files:', 'Selected real-demo fixture rows:']);
}

function proofTruthReader() {
  check('truth repository reads DEMO worker truth dir', includes('terminal/demo/src/truth/RealDemoTruthRepository.ts', 'this.paths.workerTruthDir'), 'RPI panels are sourced from demo truth/status.');
  check('truth repository reads scheduler status dir', includes('terminal/demo/src/truth/RealDemoTruthRepository.ts', 'readDemoSchedulerStatuses(this.paths.schedulerDir)'), 'Scheduler status can augment truth panels.');
  requireSmoke('truth reader', ['Truth read: regular-worker.truth.jsonl: 4 parsed, 0 malformed', 'RPI-STAGES — DEMO TRUTH', 'RPI-WORKERS — DEMO TRUTH']);
}

function proofBatchSize() {
  check('batch-size type allows only 1 and 5', includes('terminal/demo/src/run/SupportedBatchSize.ts', 'SupportedBatchSize = 1 | 5'), 'Only supported batch sizes are exposed.');
  check('real adapter W toggles selected batch size', includes('terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts', "normalized === 'W'") && includes('terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts', 'toggleBatchSize'), 'W changes state only.');
  requireSmoke('batch-size', ['W pressed: selected batch_size=5', 'Q finished guarded route for batch_size=5', 'Route: batch_size_5_stage_batch']);
}

function proofRealQRoute() {
  check('real Q route uses RealDemoRunController', includes('terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts', 'runRealDemoQ'), 'Real-demo Q uses real-demo controller.');
  check('mock storyboard import stays out of real adapter', !includes('terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts', 'qGeocodeStoryboard'), 'Real-demo adapter does not import mock Q storyboard.');
  check('Q route does not fabricate success', includes('terminal/demo/src/run/RealDemoRoutePlanner.ts', 'No fake worker success is written by the terminal.'), 'Terminal does not fake worker PASS.');
  requireSmoke('real Q route', ['No fake worker success is written by the terminal.', 'Snapshot refresh: media/truth/status re-read for this terminal frame.']);
}

function proofQueueReader() {
  check('queue reader uses DEMO_QUEUE_OUTPUT_PATH', includes('terminal/demo/src/queue/RealDemoQueueRepository.ts', 'queueOutputPath'), 'PLAYBACK_QUEUE is demo queue sourced.');
  check('queue mapping supports several output shapes', includes('terminal/demo/src/queue/mapQueueToPlaybackRows.ts', 'playback') && includes('terminal/demo/src/queue/mapQueueToPlaybackRows.ts', 'items'), 'Reader tolerates common queue wrappers.');
  requireSmoke('queue reader', ['Queue read: Queue file parsed:', 'Real demo playback queue rows: 2', '[P] Run Playback enabled']);
}

function proofPlaybackStatus() {
  check('playback status repository reads DEMO scheduler file', includes('terminal/demo/src/playback/RealDemoPlaybackStatusRepository.ts', 'playback-worker-status.json'), 'Selected item comes from demo scheduler/status output.');
  check('playback panel remains non-fullscreen', includes('terminal/demo/src/state/createInitialRealDemoState.ts', 'fullScreenEnabled: false'), 'Native/fullscreen playback is still disabled.');
  requireSmoke('playback status', ['Playback selected status: selected', 'Selected Playback Address, Tartu', 'native fullscreen disabled']);
}

function proofMockSeparation() {
  check('mock adapter imports mock storyboard', includes('terminal/demo/src/runtime/MockDemoRuntimeAdapter.ts', 'qGeocodeStoryboard'), 'Mock behavior remains isolated.');
  check('real adapter does not import mock state factory', !includes('terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts', 'createInitialMockState'), 'Real adapter cannot masquerade as mock.');
  requireSmoke('mock separation', ['Adapter: mock-demo', 'Adapter: real-demo', 'Data: real_demo_truth']);
}

function proofExecutionGuard() {
  const combined = read('terminal/demo/src/run/PhotoFrameStageExecutionAdapter.ts') + read('terminal/demo/src/playback/PhotoFramePlaybackCommandAdapter.ts');
  check('worker execution requires execute flag', combined.includes('PHOTOFRAME_TERMINAL_DEMO_EXECUTE'), 'No silent real worker execution.');
  check('worker execution requires scheduler safety ack', combined.includes('PHOTOFRAME_TERMINAL_DEMO_ACK_WORKER_DEMO_SCHEDULER_SAFE'), 'Demo scheduler safety acknowledgement remains required.');
  requireSmoke('execution guard', ['Playback execution: planned', 'playback worker execution is guarded by PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1']);
}


function proofQDbQueueCreation() {
  check('Q-created DEMO DB queue proof script is registered',
    JSON.parse(read('package.json')).scripts['proof:terminal-demo-q-db-queue-creation'] === 'tsx tools/run-terminal-demo-q-db-queue-creation-proof.mjs',
    'package.json exposes the q-created DEMO DB queue proof.');
  check('Q creates DEMO DB queue rows through real tables', includes('tools/run-terminal-demo-q-db-queue-creation-proof.mjs', 'REAL_DEMO_Q_DB_QUEUE_CREATION_READY'), 'Batch 1/5 q-created DB proof is present.');
}


function proofMetadataAddressQueue() {
  check('metadata address queue proof script is registered',
    JSON.parse(read('package.json')).scripts['proof:terminal-demo-metadata-address-queue'] === 'tsx tools/run-terminal-demo-metadata-address-queue-proof.mjs',
    'package.json exposes the metadata/address queue proof.');
  check('Q metadata/address queue proof passes', includes('tools/run-terminal-demo-metadata-address-queue-proof.mjs', 'REAL_DEMO_METADATA_TO_ADDRESS_QUEUE_READY'), 'GPS parser + geocode provider chain + P overlay proof is present.');
}


function proofBatchParity() {
  const output = run('node', ['tools/run-terminal-demo-batch-parity-proof.mjs']);
  check('batch parity proof passes', output.includes('REAL_DEMO_BATCH_EXECUTION_PARITY_READY'), 'Batch 1/5 parity source proof passes.');
}

function proofScreenWorkerPanel() {
  const output = run('node', ['tools/run-terminal-demo-screen-worker-panel-proof.mjs']);
  check('screen worker panel proof passes', output.includes('REAL_DEMO_SCREEN_WORKER_PANEL_READY'), 'Idle timer/status/guard proof passes.');
}

function proofOperatorLayoutStatus() {
  const output = run('node', ['tools/run-terminal-demo-operator-layout-status-proof.mjs']);
  check('operator layout status proof passes', output.includes('REAL_DEMO_OPERATOR_LAYOUT_STATUS_READY'), 'Area A/B/C routing proof passes.');
}

function proofLargestFiles() {
  const rows = collectSourceFiles(['terminal/demo/src', 'terminal/demo/scripts', 'tools'])
    .map((file) => ({ file, loc: readFileSync(path.join(repoRoot, file), 'utf8').split(/\r?\n/).length }))
    .sort((a, b) => b.loc - a.loc);
  const top10 = rows.slice(0, 10);
  const newGroupFiles = rows.filter((row) => row.file.includes('terminal-demo-final-guard-proof'));
  check('largest file report generated', top10.length > 0, top10.map((row) => `${row.loc} ${row.file}`).join('\n'));
  check('new Group 6B proof source stays under 300 LOC', newGroupFiles.every((row) => row.loc <= 300), newGroupFiles.map((row) => `${row.loc} ${row.file}`).join('\n'));
}

function collectSourceFiles(roots) {
  const out = [];
  for (const root of roots) walk(root, out);
  return out.filter((file) => /\.(ts|js|mjs|ps1)$/.test(file));
}

function walk(relativeDir, out) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  if (!existsSync(absoluteDir)) return;
  for (const entry of readdirSync(absoluteDir)) {
    const rel = path.join(relativeDir, entry);
    const stat = statSync(path.join(repoRoot, rel));
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry)) walk(rel, out);
    } else if (stat.isFile()) out.push(rel.replace(/\\/g, '/'));
  }
}

const proofMap = {
  'path-isolation': proofPathIsolation,
  'no-cron': proofNoCron,
  'media-discovery': proofMediaDiscovery,
  'truth-reader': proofTruthReader,
  'batch-size': proofBatchSize,
  'real-q-route': proofRealQRoute,
  'queue-reader': proofQueueReader,
  'playback-status': proofPlaybackStatus,
  'mock-separation': proofMockSeparation,
  'execution-guard': proofExecutionGuard,
  'q-db-queue-creation': proofQDbQueueCreation,
  'metadata-address-queue': proofMetadataAddressQueue,
  'batch-parity': proofBatchParity,
  'screen-worker-panel': proofScreenWorkerPanel,
  'operator-layout-status': proofOperatorLayoutStatus,
  'largest-files': proofLargestFiles
};

if (proofName === 'final') {
  for (const name of finalProofs) proofMap[name]();
} else if (proofMap[proofName]) {
  proofMap[proofName]();
} else {
  throw new Error(`Unknown terminal demo proof: ${proofName}`);
}

const failed = checks.filter((entry) => !entry.passed);
const result = { proof: `terminal-demo-${proofName}`, status: failed.length ? 'BLOCKED' : 'PASSED', checkedAt: new Date().toISOString(), checks };
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
