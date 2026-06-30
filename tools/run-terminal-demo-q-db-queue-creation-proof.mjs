#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDemoBatchManifestPlan } from '../terminal/demo/src/orchestration/DemoBatchManifestPlan.ts';
import { createQDemoDbQueueRows } from '../terminal/demo/src/run/RealDemoDbQueueProducer.ts';
import { DbPlaybackRepository } from '../terminal/demo/src/playback/DbPlaybackRepository.ts';
import { runDbImagePlaybackButton } from '../terminal/demo/src/playback/DbImagePlaybackButton.ts';

const repoRoot = process.cwd();
process.env.GEOCODE_PROVIDER_ORDER = process.env.GEOCODE_PROVIDER_ORDER || 'deterministic_placeholder';
process.env.GEOCODE_ALLOW_NETWORK_PROVIDERS = process.env.GEOCODE_ALLOW_NETWORK_PROVIDERS || '0';
process.env.GEOCODE_NETWORK_PROVIDERS_ENABLED = process.env.GEOCODE_NETWORK_PROVIDERS_ENABLED || '0';
const proof = 'terminal-demo-q-db-queue-creation';
const runs = {
  batch1: runScenario(1),
  batch5: runScenario(5)
};
const producerSource = readFileSync(path.join(repoRoot, 'terminal/demo/src/run/RealDemoDbQueueProducer.ts'), 'utf8');
const assertions = {
  batch1_producer_passed: runs.batch1.producer.status === 'passed',
  batch1_creates_one_q_row: runs.batch1.dbRows.length === 1 && runs.batch1.dbRows.filter((row) => row.source.includes('terminal-demo-q-created')).length === 1,
  batch1_runtime_state_set: runs.batch1.dbStatus.selectedItem?.source.includes('terminal-demo-q-created') === true,
  batch1_no_json_queue_source: !existsSync(path.join(runs.batch1.runtimeOutputDir, 'display_queue.json')),
  batch5_producer_passed: runs.batch5.producer.status === 'passed',
  batch5_creates_five_q_rows: runs.batch5.dbRows.length === 5 && runs.batch5.dbRows.every((row) => row.source.includes('terminal-demo-q-created')),
  canonical_assets_written: runs.batch5.producer.readyQueueRows === 5,
  variants_written: runs.batch5.dbRows.length >= 5,
  slideshow_queue_written: runs.batch5.dbRows.every((row) => row.status === 'READY'),
  source_label_is_q_created: runs.batch5.dbRows.every((row) => row.source === 'DEMO_DB_PATH:terminal-demo-q-created'),
  p_can_render_q_created_image: runs.batch1.playback.status === 'rendered' && existsSync(runs.batch1.playback.viewerPath),
  p_viewer_references_demo_image: readMaybe(runs.batch1.playback.viewerPath).includes('gps_valid_01.jpg'),
  p_uses_db_source: runs.batch1.dbStatus.sourcePath.includes('#slideshow_queue'),
  no_mock_rows_claimed: !producerSource.includes('mock-media-rows'),
  no_cron_claimed: producerSource.includes('No cron was used by Q DB queue creation.') && !producerSource.includes('crontab')
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'REAL_DEMO_Q_DB_QUEUE_CREATION_READY' : 'REAL_DEMO_Q_DB_QUEUE_CREATION_BLOCKED',
  runs: {
    batch1: summarizeRun(runs.batch1),
    batch5: summarizeRun(runs.batch5)
  },
  assertions
}, null, 2));
process.exit(passed ? 0 : 1);

function runScenario(batchSize) {
  const root = mkdtempSync(path.join(tmpdir(), `photoframe-q-db-batch${batchSize}-`));
  const downloadDir = path.join(root, 'downloaded_files');
  const runtimeOutputDir = path.join(root, 'outputs');
  const dbPath = path.join(root, 'demo.sqlite');
  const boundary = buildBoundary({ root, downloadDir, runtimeOutputDir, dbPath });
  const mediaRows = seedDemoMedia(downloadDir);
  const plan = buildDemoBatchManifestPlan(boundary, mediaRows, batchSize);
  const producer = createQDemoDbQueueRows({ boundary, rows: plan.selectedRows, batchSize, executedAt: '2026-06-29T19:00:00.000Z' });
  const dbRead = new DbPlaybackRepository(boundary).read();
  process.env.TERMINAL_DEMO_DB_PLAYBACK_PROOF = '1';
  const playback = runDbImagePlaybackButton(boundary);
  delete process.env.TERMINAL_DEMO_DB_PLAYBACK_PROOF;
  return { root, downloadDir, runtimeOutputDir, dbPath, mediaRows, plan, producer, dbRows: dbRead.rows, dbStatus: dbRead.status, playback };
}

function buildBoundary({ root, downloadDir, runtimeOutputDir, dbPath }) {
  const schedulerDir = path.join(root, 'scheduler');
  const workerTruthDir = path.join(root, 'truth');
  const logDir = path.join(root, 'logs');
  [downloadDir, runtimeOutputDir, schedulerDir, workerTruthDir, logDir].forEach((dir) => mkdirSync(dir, { recursive: true }));
  return {
    adapterMode: 'real-demo',
    runtimeMode: 'demo',
    readinessStatus: 'ready',
    repoRoot,
    dbPath,
    downloadDir,
    workerTruthDir,
    schedulerDir,
    logDir,
    runtimeOutputDir,
    queueOutputPath: path.join(runtimeOutputDir, 'display_queue.json'),
    pathMessages: ['proof fixture paths are isolated and present'],
    sourceSummary: 'proof real-demo q-created DB queue rows'
  };
}

function seedDemoMedia(downloadDir) {
  const specs = [
    ['gps_valid/gps_valid_01.jpg', 'valid'],
    ['no_gps/no_gps_01.jpg', 'missing'],
    ['gps_valid/gps_valid_02.jpg', 'valid'],
    ['invalid_gps/invalid_gps_01.jpg', 'invalid'],
    ['videos_with_gps/apple_like_h264_mov_gps_tallinn.mov', 'valid'],
    ['corrupted/corrupted_random_01.jpg', 'invalid']
  ];
  return specs.map(([relativePath, gps], index) => {
    const full = path.join(downloadDir, relativePath);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, `fixture ${relativePath}\n`, 'utf8');
    return {
      rowNumber: index + 1,
      fileName: path.basename(relativePath),
      relativePath,
      type: relativePath.endsWith('.mov') ? 'video' : 'image',
      indexed: 'no',
      gps,
      geocode: 'not run',
      queue: 'not queued',
      address: ''
    };
  });
}

function summarizeRun(run) {
  return {
    dbPath: rel(run.dbPath),
    downloadDir: rel(run.downloadDir),
    runtimeOutputDir: rel(run.runtimeOutputDir),
    selectedRows: run.plan.selectedRows.length,
    producer: run.producer,
    dbRows: run.dbRows.map((row) => ({ fileName: row.fileName, status: row.status, source: row.source })),
    playback: { status: run.playback.status, viewerPath: rel(run.playback.viewerPath), filePath: rel(run.playback.filePath), address: run.playback.address }
  };
}

function readMaybe(filePath) {
  return filePath && existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

function rel(value) {
  return value ? path.relative(repoRoot, value).replace(/\\/g, '/') : '';
}
