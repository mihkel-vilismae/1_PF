#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { commandForWorker } from '../terminal/demo/src/orchestration/PhotoFrameWorkerCommandContract.ts';
import { RealDemoRuntimeAdapterPlaceholder } from '../terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts';
import { createStartStageModalState } from '../terminal/demo/src/startStageModal/StartStageModalState.ts';
import { runManualStageFromModal } from '../terminal/demo/src/run/ManualStageRunController.ts';

const proof = 'terminal-demo-start-stage-modal-shared-path';
const repoRoot = process.cwd();
const boundary = buildBoundary();
const worker = commandForWorker('regular-stage-worker');
const row = createStartStageModalState(true).rows.find((candidate) => candidate.key === '2');
assert(row, 'index row exists');
const direct = runManualStageFromModal({ boundary, row, mediaRows: [] });
const adapter = new RealDemoRuntimeAdapterPlaceholder(boundary);
await adapter.handleKey('S');
await adapter.handleKey('2');
const modal = adapter.getState().startStageModal;
const logPath = path.join(boundary.logDir, 'terminal-button-actions.jsonl');
const events = existsSync(logPath)
  ? readFileSync(logPath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  : [];
const latest = events.at(-1) ?? {};
const manifestExists = typeof latest.manifestPath === 'string' && existsSync(latest.manifestPath);
const assertions = {
  package_script_registered: JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).scripts?.['proof:terminal-demo-start-stage-modal-shared-path'] === 'tsx tools/run-terminal-demo-start-stage-modal-shared-path-proof.mjs',
  direct_route_uses_shared_path_and_attempts_db_effect: ['blocked', 'passed'].includes(direct.status) && direct.messages.some((message) => message.includes('PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1')) && direct.messages.some((message) => message.includes('manual DB effect')),
  modal_key_2_marks_effect_status: ['blocked', 'passed'].includes(modal.rows.find((candidate) => candidate.key === '2')?.status ?? ''),
  worker_command_matches_contract: latest.command === worker.npmCommand && latest.workerName === worker.workerName,
  cron_reference_is_contract_only: latest.cronReference === worker.cronReference && latest.noCron === true,
  event_identifies_modal_source: latest.action === 'start_stage_modal_manual_stage' && latest.source === 'manual-stage-modal' && latest.elementId === 'start_stage_modal',
  stage_mapping_is_index: latest.button === '2' && latest.stage === 'index' && latest.batchSize === 1,
  manifest_written_inside_demo_output: manifestExists && latest.manifestPath.startsWith(boundary.runtimeOutputDir),
  db_effect_recorded_in_action_log: latest.dbEffect?.operation === 'stage2_index_register' && ['blocked', 'passed'].includes(latest.dbEffect?.status),
  download_still_disabled: createStartStageModalState(true).rows.find((candidate) => candidate.key === '1')?.enabled === false
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'START_STAGE_MODAL_BATCH3_SHARED_WORKER_PATH_READY' : 'START_STAGE_MODAL_BATCH3_SHARED_WORKER_PATH_BLOCKED',
  assertions,
  latestEvent: latest
}, null, 2));
if (!passed) process.exit(1);

function buildBoundary() {
  const root = mkdtempSync(path.join(tmpdir(), 'photoframe-start-stage-shared-path-'));
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
    sourceSummary: 'start stage shared path proof'
  };
}
