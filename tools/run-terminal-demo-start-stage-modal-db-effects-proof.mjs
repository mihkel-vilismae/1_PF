#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { RealDemoMediaRepository } from '../terminal/demo/src/data/RealDemoMediaRepository.ts';
import { runManualStageFromModal } from '../terminal/demo/src/run/ManualStageRunController.ts';
import { createStartStageModalState, handleStartStageModalKey, markStartStageModalRowStatus, openStartStageModal } from '../terminal/demo/src/startStageModal/StartStageModalState.ts';

const proof = 'terminal-demo-start-stage-modal-db-effects';
const repoRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const run = runKeysOnOneFixture(['2', '3', '4', '5', '1']);
const events = run.events.filter((event) => ['2', '3', '4', '5'].includes(event.button));
const operationsByKey = { '2': 'stage2_index_register', '3': 'stage3_process_gps_queue', '4': 'stage4_process_geocode_queue', '5': 'stage5_prepare_queue' };
const assertions = {
  package_script_registered: packageJson.scripts?.['proof:terminal-demo-start-stage-modal-db-effects'] === 'tsx tools/run-terminal-demo-start-stage-modal-db-effects-proof.mjs',
  keys_2_to_5_pass: ['2', '3', '4', '5'].every((key) => run.statusByKey[key] === 'passed'),
  key_1_remains_disabled: run.statusByKey['1'] === 'disabled',
  events_logged_for_keys_2_to_5: events.length === 4 && events.every((event) => event.action === 'start_stage_modal_manual_stage'),
  no_event_logged_for_disabled_key_1: !run.events.some((event) => event.button === '1'),
  db_effect_operations_match_keys: events.every((event) => event.dbEffect?.operation === operationsByKey[event.button]),
  db_effects_passed: events.every((event) => event.dbEffect?.status === 'passed'),
  truth_status_written: events.every((event) => event.truthStatus === 'passed') && run.truthExists && run.statusExists,
  manifests_stay_inside_demo_outputs: events.every((event) => String(event.manifestPath).startsWith(event._runtimeOutputDir)),
  no_cron_for_all_events: events.every((event) => event.noCron === true),
  count_evidence_present: hasPositive(events[0], 'scannedMediaCount') && hasPositive(events[1], 'processedCount') && hasPositive(events[2], 'processedCount') && Number(events[3]?.dbEffect?.counts?.insertedCount ?? 0) + Number(events[3]?.dbEffect?.counts?.skippedCount ?? 0) >= 1
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({ proof, status: passed ? 'PASSED' : 'BLOCKED', checkedAt: new Date().toISOString(), decision: passed ? 'START_STAGE_MODAL_DB_EFFECTS_READY' : 'START_STAGE_MODAL_DB_EFFECTS_BLOCKED', assertions, run }, null, 2));
if (!passed) process.exit(1);

function runKeysOnOneFixture(keys) {
  const boundary = buildFixtureBoundary();
  const media = new RealDemoMediaRepository(boundary).listDemoMediaRows();
  let modalState = openStartStageModal(createStartStageModalState(false));
  for (const key of keys) {
    const selected = handleStartStageModalKey(modalState, key);
    modalState = selected.state;
    const row = modalState.rows.find((candidate) => candidate.key === key);
    if (row?.enabled) {
      const execution = runManualStageFromModal({ boundary, row, mediaRows: media.rows });
      modalState = markStartStageModalRowStatus(modalState, key, execution.status, execution.messages[0] ?? modalState.lastMessage);
    }
  }
  const allEvents = readEvents(boundary.logDir).map((event) => ({ ...event, _runtimeOutputDir: boundary.runtimeOutputDir }));
  return {
    keys,
    mediaRows: media.rows.length,
    statusByKey: Object.fromEntries(keys.map((key) => [key, modalState.rows.find((row) => row.key === key)?.status ?? 'missing'])),
    events: allEvents,
    truthPath: path.join(boundary.workerTruthDir, 'regular-worker.truth.jsonl'),
    statusPath: path.join(boundary.schedulerDir, 'regular-worker.status.json'),
    truthExists: existsSync(path.join(boundary.workerTruthDir, 'regular-worker.truth.jsonl')),
    statusExists: existsSync(path.join(boundary.schedulerDir, 'regular-worker.status.json'))
  };
}

function buildFixtureBoundary() {
  const root = mkdtempSync(path.join(tmpdir(), 'photoframe-start-stage-db-effects-'));
  const boundary = {
    adapterMode: 'real-demo', runtimeMode: 'demo', readinessStatus: 'ready', repoRoot,
    dbPath: path.join(root, 'demo.sqlite'), downloadDir: path.join(root, 'downloaded_files'),
    workerTruthDir: path.join(root, 'truth'), schedulerDir: path.join(root, 'scheduler'), logDir: path.join(root, 'logs'),
    runtimeOutputDir: path.join(root, 'outputs'), queueOutputPath: path.join(root, 'outputs', 'display_queue.json'),
    pathMessages: ['proof paths isolated'], sourceSummary: 'start stage DB effects proof'
  };
  preparePipelineFixture(boundary);
  [boundary.workerTruthDir, boundary.schedulerDir, boundary.logDir].forEach((dir) => mkdirSync(dir, { recursive: true }));
  return boundary;
}


function preparePipelineFixture(boundary) {
  const source = path.join(repoRoot, 'generated_test_data', 'gps_valid', 'gps_valid_01.jpg');
  const destination = path.join(boundary.downloadDir, 'gps_valid', 'gps_valid_01.jpg');
  mkdirSync(path.dirname(boundary.dbPath), { recursive: true });
  mkdirSync(path.dirname(destination), { recursive: true });
  mkdirSync(boundary.runtimeOutputDir, { recursive: true });
  copyFileSync(source, destination);
  runPython([path.join(repoRoot, 'server', 'scripts', 'sqlite_admin.py'), 'recreate', boundary.dbPath, path.join(repoRoot, 'database', 'schema.sql')]);
}

function runPython(args) {
  for (const command of ['python3', 'py', 'python']) {
    const finalArgs = command === 'py' ? ['-3', ...args] : args;
    const result = spawnSync(command, finalArgs, { cwd: repoRoot, encoding: 'utf8', timeout: 45000 });
    if (result.error?.code === 'ENOENT') continue;
    if (result.status === 0) return;
    throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
  }
  throw new Error('No Python command available.');
}

function readEvents(logDir) {
  const logPath = path.join(logDir, 'terminal-button-actions.jsonl');
  const lines = existsSync(logPath) ? readFileSync(logPath, 'utf8').trim().split(/\r?\n/).filter(Boolean) : [];
  return lines.map((line) => JSON.parse(line));
}

function hasPositive(event, key) {
  return Number(event?.dbEffect?.counts?.[key] ?? 0) > 0;
}
