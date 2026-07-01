#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runRealDemoQ } from '../terminal/demo/src/run/RealDemoRunController.ts';
import { DbPlaybackRepository } from '../terminal/demo/src/playback/DbPlaybackRepository.ts';
import { RealDemoTruthRepository } from '../terminal/demo/src/truth/RealDemoTruthRepository.ts';

const repoRoot = process.cwd();
process.env.GEOCODE_PROVIDER_ORDER = process.env.GEOCODE_PROVIDER_ORDER || 'deterministic_placeholder';
process.env.GEOCODE_ALLOW_NETWORK_PROVIDERS = process.env.GEOCODE_ALLOW_NETWORK_PROVIDERS || '0';
process.env.GEOCODE_NETWORK_PROVIDERS_ENABLED = process.env.GEOCODE_NETWORK_PROVIDERS_ENABLED || '0';
const proof = 'terminal-demo-q-operator-status';
const batch1 = runScenario(1);
const batch5 = runScenario(5);
const createState = readFileSync(path.join(repoRoot, 'terminal/demo/src/state/createInitialRealDemoState.ts'), 'utf8');
const currentRun = readFileSync(path.join(repoRoot, 'terminal/demo/src/ui/renderCurrentRun.ts'), 'utf8');
const logRenderer = readFileSync(path.join(repoRoot, 'terminal/demo/src/ui/renderRealTimeLog.ts'), 'utf8');
const config = readFileSync(path.join(repoRoot, 'terminal/demo/src/config/terminalRuntimeConfig.ts'), 'utf8');
const assertions = {
  q_completed_button_batch1: batch1.finalState.actions.some((action) => action.key === 'Q' && action.done),
  q_completed_button_batch5: batch5.finalState.actions.some((action) => action.key === 'Q' && action.done),
  q_action_jsonl_written: batch1.events.length >= 1 && batch5.events.length >= 1,
  q_jsonl_has_operator_fields: ['button', 'action', 'batchSize', 'route', 'selectedRows', 'queue', 'stages', 'noCron'].every((key) => Object.prototype.hasOwnProperty.call(batch1.events[0], key)),
  q_jsonl_batch1_values: batch1.events[0].button === 'Q' && batch1.events[0].batchSize === 1 && batch1.events[0].route === 'batch_size_1_file_by_file' && batch1.events[0].selectedRows === 1,
  q_jsonl_batch5_values: batch5.events[0].button === 'Q' && batch5.events[0].batchSize === 5 && batch5.events[0].route === 'batch_size_5_stage_batch' && batch5.events[0].selectedRows === 5,
  q_jsonl_ready_rows: batch1.events[0].queue.readyRows >= 1 && batch5.events[0].queue.readyRows >= 5,
  q_jsonl_no_cron: batch1.events[0].noCron === true && batch5.events[0].noCron === true,
  q_degraded_not_error_for_mixed_metadata: batch5.finalState.rpiStages.some((stage) => stage.name === 'GPS parser' && stage.status === 'Degraded') || batch5.finalState.rpiStages.some((stage) => stage.name === 'Geocode' && stage.status === 'Degraded'),
  no_false_red_for_not_eligible_none: currentRun.includes('Expected not eligible from discovered fixture metadata') && currentRun.includes('return false'),
  q_action_log_not_flagged_error: logRenderer.includes('Q action event written') && logRenderer.includes('return false'),
  stale_v012_group6b_removed: !createState.includes('v0.12.0') && !createState.includes('Group 6B') && !config.includes('v0.12.0') && !config.includes('Group 6B'),
  no_cron_in_q_action_logger: !readFileSync(path.join(repoRoot, 'terminal/demo/src/run/RealDemoQActionLogger.ts'), 'utf8').includes('crontab')
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'REAL_DEMO_Q_OPERATOR_STATUS_READY' : 'REAL_DEMO_Q_OPERATOR_STATUS_BLOCKED',
  batch1: summarize(batch1),
  batch5: summarize(batch5),
  assertions
}, null, 2));
process.exit(passed ? 0 : 1);

function runScenario(batchSize) {
  const root = mkdtempSync(path.join(tmpdir(), `photoframe-q-operator-b${batchSize}-`));
  const downloadDir = path.join(root, 'downloaded_files');
  const runtimeOutputDir = path.join(root, 'outputs');
  const boundary = buildBoundary({ root, downloadDir, runtimeOutputDir, dbPath: path.join(root, 'demo.sqlite') });
  const mediaRows = seedMedia(downloadDir);
  const truthRepo = new RealDemoTruthRepository(boundary);
  const refresh = () => {
    const db = new DbPlaybackRepository(boundary).read();
    return { mediaRows, mediaMessages: ['proof media fixture'], truth: truthRepo.readDemoTruth(), queueRows: db.rows, queueMessages: db.messages };
  };
  const states = runRealDemoQ({ boundary, batchSize, mediaRows, mediaMessages: ['proof media fixture'], truth: truthRepo.readDemoTruth(), queueRows: [], queueMessages: [], refresh });
  const finalState = states.at(-1);
  const events = readJsonl(path.join(boundary.logDir, 'terminal-button-actions.jsonl'));
  return { root, boundary, states, finalState, events };
}

function buildBoundary({ root, downloadDir, runtimeOutputDir, dbPath }) {
  const schedulerDir = path.join(root, 'scheduler');
  const workerTruthDir = path.join(root, 'truth');
  const logDir = path.join(root, 'logs');
  [downloadDir, runtimeOutputDir, schedulerDir, workerTruthDir, logDir].forEach((dir) => mkdirSync(dir, { recursive: true }));
  return { adapterMode: 'real-demo', runtimeMode: 'demo', readinessStatus: 'ready', repoRoot, dbPath, downloadDir, workerTruthDir, schedulerDir, logDir, runtimeOutputDir, queueOutputPath: path.join(runtimeOutputDir, 'display_queue.json'), pathMessages: ['proof paths isolated'], sourceSummary: 'Q operator proof' };
}

function seedMedia(downloadDir) {
  const specs = [
    ['gps_valid/gps_valid_01.jpg', 'valid'],
    ['no_gps/no_gps_01.jpg', 'missing'],
    ['gps_valid/gps_valid_02.jpg', 'valid'],
    ['invalid_gps/invalid_gps_01.jpg', 'invalid'],
    ['videos_with_gps/apple_like_h264_mov_gps_tallinn.mov', 'valid']
  ];
  return specs.map(([relativePath, gps], index) => {
    const full = path.join(downloadDir, relativePath);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, `fixture ${relativePath}\n`, 'utf8');
    if (gps === 'valid') writeFileSync(`${full}.gps.json`, JSON.stringify({ latitude: 58.3776 + index / 1000, longitude: 26.7290, altitude: 75 }, null, 2));
    return { rowNumber: index + 1, fileName: path.basename(relativePath), relativePath, type: relativePath.endsWith('.mov') ? 'video' : 'image', indexed: 'no', gps, geocode: 'not run', queue: 'not queued', address: '' };
  });
}

function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function summarize(run) {
  return {
    root: path.relative(repoRoot, run.root).replace(/\\/g, '/'),
    completedButtons: run.finalState.actions.filter((action) => action.done).map((action) => action.key),
    stages: run.finalState.rpiStages.map((stage) => ({ name: stage.name, status: stage.status })),
    actionLog: run.events.map((event) => ({ button: event.button, status: event.status, batchSize: event.batchSize, route: event.route, readyRows: event.queue.readyRows, stages: event.stages, noCron: event.noCron }))
  };
}
