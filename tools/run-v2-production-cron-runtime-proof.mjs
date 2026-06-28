#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { check, emitProof, packageScripts, parseArgs, proofResult, readText, readTruthEvents } from './v2-final-proof-utils.mjs';

const args = parseArgs();
if (args.contract) {
  const scripts = packageScripts();
  const sourceText = readText('tools/run-v2-production-cron-runtime-proof.mjs');
  const checks = [];
  check(checks, 'production-runtime-script-registered', 'Production cron runtime proof script is registered.', Boolean(scripts['proof:v2-production-cron-runtime']));
  check(checks, 'production-runtime-contract-registered', 'Production cron runtime contract script is registered.', Boolean(scripts['proof:v2-production-cron-runtime-contract']));
  check(checks, 'production-source-required', 'Production runtime proof requires source=production-cron events.', sourceText.includes('production-cron') && sourceText.includes('expectedSource'));
  check(checks, 'post-marker-checks-present', 'Production runtime proof verifies post-marker worker truth events.', sourceText.includes('post-marker') && sourceText.includes('markerTimestamp'));
  check(checks, 'wrapper-start-check-present', 'Production runtime proof verifies production wrapper logs after marker.', sourceText.includes('PRODUCTION_WRAPPER_START'));
  const result = proofResult({
    proof: 'v2_production_cron_runtime',
    checks,
    evidenceMode: false,
    note: 'Static contract for production cron runtime proof. Evidence mode waits for production cron/wrapper events.',
  });
  emitProof(result, { write: args.write });
}
const repoRoot = process.cwd();
const proofsDir = path.join(repoRoot, 'runtime_data', 'proofs');
mkdirSync(proofsDir, { recursive: true });

const waitSeconds = Number.parseInt(process.env.PF_V2_PRODUCTION_CRON_RUNTIME_WAIT_SECONDS ?? '75', 10);
const minWaitSeconds = Number.parseInt(process.env.PF_V2_PRODUCTION_CRON_RUNTIME_MIN_WAIT_SECONDS ?? '20', 10);
const expectedSource = process.env.PF_V2_PRODUCTION_CRON_SOURCE ?? 'production-cron';
const markerTimestamp = new Date().toISOString();
const proofRunId = `v2-production-cron-runtime-${Date.now()}`;
const marker = {
  proof: 'v2_production_cron_wait_marker',
  markerTimestamp,
  proofRunId,
  mode: 'real',
  expectedSource,
  waitSeconds,
  minWaitSeconds,
  note: 'Events must be written after this marker by the production managed crontab wrapper.',
};
const safeTimestamp = markerTimestamp.replace(/[:.]/g, '-');
const markerFile = path.join(proofsDir, `v2_production_cron_wait_marker_${safeTimestamp}.json`);
writeFileSync(markerFile, `${JSON.stringify(marker, null, 2)}\n`, 'utf8');

const waitLogFile = path.join(proofsDir, `v2_production_cron_runtime_wait_${safeTimestamp}.log`);
log(`markerTimestamp=${markerTimestamp}`);
log(`waitSeconds=${waitSeconds}`);
log(`expectedSource=${expectedSource}`);

if (!args.contract) {
  const boundedWaitSeconds = Math.max(waitSeconds, minWaitSeconds);
  for (let elapsed = 0; elapsed < boundedWaitSeconds; elapsed += 5) {
    log(`waiting elapsed=${elapsed}s remaining=${Math.max(0, boundedWaitSeconds - elapsed)}s`);
    sleepSeconds(Math.min(5, boundedWaitSeconds - elapsed));
  }
  log(`wait complete elapsed=${boundedWaitSeconds}s`);
}

const crontabResult = spawnSync('crontab', ['-l'], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
writeFileSync(
  path.join(proofsDir, 'production_crontab_after_runtime.txt'),
  crontabResult.status === 0 ? crontabResult.stdout : `# crontab -l failed status=${crontabResult.status}\n${crontabResult.stderr ?? ''}\n`,
  'utf8',
);

const { events, files, malformed } = readTruthEvents('real', repoRoot);
const markerMs = Date.parse(markerTimestamp);
const postMarkerEvents = events.filter((event) => Date.parse(String(event.timestamp ?? '')) > markerMs);
const productionEvents = postMarkerEvents.filter((event) => String(event.source ?? '') === expectedSource);
const eventsByWorker = new Map();
for (const event of productionEvents) {
  if (!eventsByWorker.has(event.worker)) eventsByWorker.set(event.worker, []);
  eventsByWorker.get(event.worker).push(event);
}
const workers = ['regular-worker', 'playback-worker', 'screen-worker'];
const stages = new Set(productionEvents.map((event) => event.stage));
const wrapperLogDir = path.join(proofsDir, 'production_cron_wrapper_logs');
const wrapperLogs = existsSync(wrapperLogDir) ? readdirSync(wrapperLogDir).filter((name) => name.endsWith('.log')) : [];
const wrapperStartsAfterMarker = readWrapperStartsAfterMarker(wrapperLogDir, wrapperLogs, markerMs);

const checks = [];
check(checks, 'wait-marker-written', 'Production pre-wait marker artifact was written.', existsSync(markerFile), { markerFile, markerTimestamp });
check(checks, 'seconds-wait-configured', 'Production runtime proof uses a seconds-based wait.', waitSeconds > 0 && waitSeconds < 600, { waitSeconds, minWaitSeconds });
check(checks, 'production-crontab-after-runtime-captured', 'Production crontab after runtime was captured.', existsSync(path.join(proofsDir, 'production_crontab_after_runtime.txt')));
check(checks, 'production-managed-block-present', 'Production managed crontab block is installed during runtime proof.', String(crontabResult.stdout ?? '').includes('# BEGIN PHOTOFRAME_V2_PRODUCTION_CRON'));
check(checks, 'truth-files-present', 'Real worker truth files exist.', files.length > 0, { files });
check(checks, 'truth-json-valid', 'Worker truth JSONL has no malformed lines.', malformed.length === 0, { malformed });
check(checks, 'post-marker-events-present', 'There are worker truth events after the production wait marker.', postMarkerEvents.length > 0, { count: postMarkerEvents.length });
check(checks, 'production-source-events-present', 'Post-marker events identify production-cron source.', productionEvents.length > 0, { expectedSource, count: productionEvents.length });
for (const worker of workers) {
  check(checks, `${worker}-post-marker-production-event`, `${worker} has a post-marker production-cron event.`, (eventsByWorker.get(worker) ?? []).length > 0, {
    events: (eventsByWorker.get(worker) ?? []).slice(-5),
  });
}
check(checks, 'playback-media-started-after-marker', 'Playback media_started exists after marker from production-cron source.', stages.has('media_started'));
check(checks, 'playback-media-finished-after-marker', 'Playback media_finished exists after marker from production-cron source.', stages.has('media_finished'));
check(checks, 'playback-queue-advanced-after-marker', 'Playback queue_advanced exists after marker from production-cron source.', stages.has('queue_advanced'));
check(checks, 'production-wrapper-log-present', 'Production cron wrapper wrote log files.', wrapperLogs.length >= 3, { wrapperLogDir, wrapperLogs });
check(checks, 'production-wrapper-ran-after-marker', 'Production cron wrapper ran after the wait marker.', wrapperStartsAfterMarker.length >= 3, { wrapperStartsAfterMarker: wrapperStartsAfterMarker.slice(-10) });

const result = proofResult({
  proof: 'v2_production_cron_runtime',
  checks,
  evidenceMode: !args.contract,
  note: 'Evidence proof that the separate production managed crontab launched worker-specific wrappers and produced post-marker real-mode worker truth with source=production-cron. Proof-loop cron is reported separately.',
});
result.evidence = { markerTimestamp, expectedSource, files, postMarkerEventCount: postMarkerEvents.length, productionEventCount: productionEvents.length, wrapperLogDir, wrapperLogs };

emitProof(result, { write: args.write || args.evidence });

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  writeFileSync(waitLogFile, `${line}\n`, { flag: 'a' });
}

function sleepSeconds(seconds) {
  if (seconds <= 0) return;
  spawnSync('sleep', [String(seconds)], { stdio: 'ignore' });
}

function readWrapperStartsAfterMarker(wrapperLogDir, wrapperLogs, markerMs) {
  const entries = [];
  if (!existsSync(wrapperLogDir)) return entries;
  for (const name of wrapperLogs) {
    const filePath = path.join(wrapperLogDir, name);
    let text = '';
    try {
      text = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      if (!line.includes('PRODUCTION_WRAPPER_START')) continue;
      const match = line.match(/^\[([^\]]+)\]/);
      const timestampMs = match ? Date.parse(match[1]) : Number.NaN;
      if (Number.isFinite(timestampMs) && timestampMs > markerMs) {
        entries.push({ filePath, line, timestamp: match[1] });
      }
    }
  }
  return entries;
}
