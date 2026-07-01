#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readTerminalLayout } from '../terminal/demo/src/layout/readTerminalLayout.ts';
import { RealDemoRuntimeAdapterPlaceholder } from '../terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts';
import { renderScreen } from '../terminal/demo/src/ui/renderScreen.ts';
import { createStartStageModalState, manualStageBatchSizes, toggleStartStageRowBatchSize } from '../terminal/demo/src/startStageModal/StartStageModalState.ts';

const proof = 'terminal-demo-start-stage-modal';
const repoRoot = process.cwd();
const boundary = buildBoundary();
const adapter = new RealDemoRuntimeAdapterPlaceholder(boundary);
const closed = adapter.getState().startStageModal;
await adapter.handleKey('S');
const openedState = adapter.getState();
const opened = openedState.startStageModal;
await adapter.handleKey('1');
const downloadDisabled = adapter.getState().startStageModal;
await adapter.handleKey('2');
const indexSelected = adapter.getState().startStageModal;
const toggled = toggleStartStageRowBatchSize(createStartStageModalState(true), '3');
const rendered = renderScreen(openedState, readTerminalLayout(), 140);
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

const assertions = {
  package_script_registered: packageJson.scripts?.['proof:terminal-demo-start-stage-modal'] === 'tsx tools/run-terminal-demo-start-stage-modal-proof.mjs',
  modal_closed_by_default: closed.elementId === 'start_stage_modal' && closed.isOpen === false,
  s_opens_modal: opened.elementId === 'start_stage_modal' && opened.isOpen === true,
  five_distinct_rows: opened.rows.length === 5 && new Set(opened.rows.map((row) => row.stageId)).size === 5,
  key_table_matches_request: JSON.stringify(opened.rows.map((row) => [row.key, row.label])) === JSON.stringify([
    ['1', 'Download'],
    ['2', 'Index'],
    ['3', 'GPS Parser'],
    ['4', 'Geocode'],
    ['5', 'Enqueue for Playback']
  ]),
  download_disabled: opened.rows[0]?.enabled === false && opened.rows[0]?.status === 'disabled',
  keys_2_to_5_ready: opened.rows.slice(1).every((row) => row.enabled && row.status === 'ready'),
  default_batch_size_one_each: opened.rows.every((row) => row.batchSize === 1),
  independent_batch_size_toggle_to_three: toggled.rows.find((row) => row.key === '3')?.batchSize === 3 && toggled.rows.filter((row) => row.key !== '3').every((row) => row.batchSize === 1),
  allowed_batch_sizes_are_one_and_three: JSON.stringify(manualStageBatchSizes) === JSON.stringify([1, 3]),
  key_1_stays_disabled_no_execution: downloadDisabled.lastMessage.includes('disabled') && downloadDisabled.rows[0]?.status === 'disabled',
  key_2_selects_without_worker_execution: indexSelected.rows.find((row) => row.key === '2')?.status === 'selected' && /reserved|no worker path called/i.test(indexSelected.lastMessage),
  rendered_modal_contains_element_name: rendered.includes('start_stage_modal') && rendered.includes('Enqueue for Playback')
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'START_STAGE_MODAL_BATCH1_READY' : 'START_STAGE_MODAL_BATCH1_BLOCKED',
  assertions,
  keyTable: opened.rows.map((row) => ({ key: row.key, action: row.action, enabled: row.enabled, batchSize: row.batchSize }))
}, null, 2));
if (!passed) process.exit(1);

function buildBoundary() {
  const root = mkdtempSync(path.join(tmpdir(), 'photoframe-start-stage-modal-'));
  const runtimeOutputDir = path.join(root, 'outputs');
  const downloadDir = path.join(root, 'downloaded_files');
  const workerTruthDir = path.join(root, 'truth');
  const schedulerDir = path.join(root, 'scheduler');
  const logDir = path.join(root, 'logs');
  [runtimeOutputDir, downloadDir, workerTruthDir, schedulerDir, logDir].forEach((dir) => mkdirSync(dir, { recursive: true }));
  return {
    adapterMode: 'real-demo',
    runtimeMode: 'demo',
    readinessStatus: 'ready',
    repoRoot,
    dbPath: path.join(root, 'demo.sqlite'),
    downloadDir,
    workerTruthDir,
    schedulerDir,
    logDir,
    runtimeOutputDir,
    queueOutputPath: path.join(runtimeOutputDir, 'display_queue.json'),
    pathMessages: ['proof paths isolated'],
    sourceSummary: 'start stage modal proof'
  };
}
