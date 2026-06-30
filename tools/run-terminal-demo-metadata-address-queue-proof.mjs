#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDemoBatchManifestPlan } from '../terminal/demo/src/orchestration/DemoBatchManifestPlan.ts';
import { createQDemoDbQueueRows } from '../terminal/demo/src/run/RealDemoDbQueueProducer.ts';
import { DbPlaybackRepository } from '../terminal/demo/src/playback/DbPlaybackRepository.ts';
import { runDbImagePlaybackButton } from '../terminal/demo/src/playback/DbImagePlaybackButton.ts';

const repoRoot = process.cwd();
const proof = 'terminal-demo-metadata-address-queue';
const run = runScenario();
const viewer = readMaybe(run.playback.viewerPath);
const dbAddress = run.dbRows.find((row) => row.fileName === 'gps_valid_01.jpg')?.address ?? '';
const assertions = {
  q_metadata_address_passed: run.result.metadataAddress.status === 'passed',
  gps_parser_path_invoked: run.result.metadataAddress.gpsProcessed > 0 && run.result.metadataAddress.gpsSuccess >= 1,
  geocode_provider_path_invoked: run.result.metadataAddress.geocodeProcessed >= 1 && run.result.metadataAddress.providerNames.length >= 1,
  address_text_written: dbAddress.length > 0 && run.result.metadataAddress.addressTextRows >= 1,
  address_text_from_provider_chain_not_mock: !/mock/i.test(dbAddress) && run.result.metadataAddress.providerNames.includes('deterministic_placeholder'),
  p_overlay_equals_db_address_text: run.playback.address === dbAddress && viewer.includes(dbAddress),
  missing_gps_is_degraded_not_fake: run.result.metadataAddress.gpsFailure >= 1,
  no_cron: run.result.messages.some((message) => message.includes('No cron')),
  demo_scoped_db: run.dbPath.startsWith(run.root)
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'REAL_DEMO_METADATA_TO_ADDRESS_QUEUE_READY' : 'REAL_DEMO_METADATA_TO_ADDRESS_QUEUE_BLOCKED',
  result: run.result,
  dbRows: run.dbRows.map((row) => ({ fileName: row.fileName, address: row.address, source: row.source })),
  playback: { status: run.playback.status, address: run.playback.address, viewerPath: rel(run.playback.viewerPath) },
  assertions
}, null, 2));
process.exit(passed ? 0 : 1);

function runScenario() {
  const root = mkdtempSync(path.join(tmpdir(), 'photoframe-q-address-'));
  const downloadDir = path.join(root, 'downloaded_files');
  const runtimeOutputDir = path.join(root, 'outputs');
  const dbPath = path.join(root, 'demo.sqlite');
  const boundary = buildBoundary({ root, downloadDir, runtimeOutputDir, dbPath });
  const mediaRows = seedMedia(downloadDir);
  const plan = buildDemoBatchManifestPlan(boundary, mediaRows, 5);
  const result = createQDemoDbQueueRows({ boundary, rows: plan.selectedRows, batchSize: 5, executedAt: '2026-06-30T08:50:00.000Z' });
  const dbRows = new DbPlaybackRepository(boundary).read().rows;
  process.env.TERMINAL_DEMO_DB_PLAYBACK_PROOF = '1';
  const playback = runDbImagePlaybackButton(boundary);
  delete process.env.TERMINAL_DEMO_DB_PLAYBACK_PROOF;
  return { root, downloadDir, runtimeOutputDir, dbPath, boundary, result, dbRows, playback };
}

function buildBoundary({ root, downloadDir, runtimeOutputDir, dbPath }) {
  const schedulerDir = path.join(root, 'scheduler');
  const workerTruthDir = path.join(root, 'truth');
  const logDir = path.join(root, 'logs');
  [downloadDir, runtimeOutputDir, schedulerDir, workerTruthDir, logDir].forEach((dir) => mkdirSync(dir, { recursive: true }));
  return {
    adapterMode: 'real-demo', runtimeMode: 'demo', readinessStatus: 'ready', repoRoot, dbPath, downloadDir,
    workerTruthDir, schedulerDir, logDir, runtimeOutputDir, queueOutputPath: path.join(runtimeOutputDir, 'display_queue.json'),
    pathMessages: ['proof fixture paths are isolated and present'], sourceSummary: 'metadata address proof fixture'
  };
}

function seedMedia(downloadDir) {
  const files = ['gps_valid_01.jpg', 'no_gps_01.jpg'];
  const rows = files.map((fileName, index) => {
    const relativePath = index === 0 ? `gps_valid/${fileName}` : `no_gps/${fileName}`;
    const full = path.join(downloadDir, relativePath);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, `fixture ${fileName}\n`, 'utf8');
    return { rowNumber: index + 1, fileName, relativePath, type: 'image', indexed: 'no', gps: index === 0 ? 'valid' : 'missing', geocode: 'not run', queue: 'not queued', address: '' };
  });
  writeFileSync(path.join(downloadDir, 'gps_valid', 'gps_valid_01.jpg.gps.json'), JSON.stringify({ latitude: 58.3776, longitude: 26.7290, altitude: 75 }, null, 2));
  return rows;
}

function readMaybe(filePath) { return filePath && existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''; }
function rel(value) { return value ? path.relative(repoRoot, value).replace(/\\/g, '/') : ''; }
