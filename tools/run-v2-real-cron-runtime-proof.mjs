#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { check, emitProof, parseArgs, proofResult, readTruthEvents } from './v2-final-proof-utils.mjs';

const args = parseArgs();
const repoRoot = process.cwd();
const proofsDir = path.join(repoRoot, 'runtime_data', 'proofs');
mkdirSync(proofsDir, { recursive: true });

const waitSeconds = Number.parseInt(process.env.PF_V2_CRON_RUNTIME_WAIT_SECONDS ?? '90', 10);
const minWaitSeconds = Number.parseInt(process.env.PF_V2_CRON_RUNTIME_MIN_WAIT_SECONDS ?? '20', 10);
const expectedSources = (process.env.PF_V2_CRON_EXPECTED_SOURCES ?? 'cron-proof-loop,cron,scheduler')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const markerTimestamp = new Date().toISOString();
const proofRunId = `v2-real-cron-runtime-${Date.now()}`;
const marker = {
  proof: 'v2_real_cron_wait_marker',
  markerTimestamp,
  proofRunId,
  mode: 'real',
  expectedSources,
  waitSeconds,
  minWaitSeconds,
  note: 'Events must be written after this marker by cron or the cron-launched seconds-based proof loop.',
};
const markerFile = path.join(proofsDir, `v2_real_cron_wait_marker_${markerTimestamp.replace(/[:.]/g, '-')}.json`);
writeFileSync(markerFile, `${JSON.stringify(marker, null, 2)}\n`, 'utf8');

const waitLogFile = path.join(proofsDir, `v2_real_cron_runtime_wait_${markerTimestamp.replace(/[:.]/g, '-')}.log`);
log(`markerTimestamp=${markerTimestamp}`);
log(`waitSeconds=${waitSeconds}`);
log(`expectedSources=${expectedSources.join(',')}`);

if (!args.contract) {
  const boundedWaitSeconds = Math.max(waitSeconds, minWaitSeconds);
  for (let elapsed = 0; elapsed < boundedWaitSeconds; elapsed += 5) {
    log(`waiting elapsed=${elapsed}s remaining=${Math.max(0, boundedWaitSeconds - elapsed)}s`);
    sleepSeconds(Math.min(5, boundedWaitSeconds - elapsed));
  }
  log(`wait complete elapsed=${boundedWaitSeconds}s`);
}

const afterRuntimeResult = spawnSync('crontab', ['-l'], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
writeFileSync(
  path.join(proofsDir, 'crontab_after_runtime.txt'),
  afterRuntimeResult.status === 0 ? afterRuntimeResult.stdout : `# crontab -l failed status=${afterRuntimeResult.status}\n${afterRuntimeResult.stderr ?? ''}\n`,
  'utf8',
);

const { events, files, malformed } = readTruthEvents('real', repoRoot);
const markerMs = Date.parse(markerTimestamp);
const postMarkerEvents = events.filter((event) => Date.parse(String(event.timestamp ?? '')) > markerMs);
const cronSourceEvents = postMarkerEvents.filter((event) => expectedSources.includes(String(event.source ?? '')));
const eventsByWorker = new Map();
for (const event of cronSourceEvents) {
  if (!eventsByWorker.has(event.worker)) eventsByWorker.set(event.worker, []);
  eventsByWorker.get(event.worker).push(event);
}
const workers = ['regular-worker', 'playback-worker', 'screen-worker'];
const loopLogDir = path.join(proofsDir, 'cron_proof_loop_logs');
const loopLogs = existsSync(loopLogDir) ? readdirSync(loopLogDir).filter((name) => name.endsWith('.log')) : [];
const stages = new Set(cronSourceEvents.map((event) => event.stage));

const checks = [];
check(checks, 'wait-marker-written', 'Pre-wait marker artifact was written.', existsSync(markerFile), { markerFile, markerTimestamp });
check(checks, 'seconds-wait-configured', 'Runtime proof uses seconds-based wait.', waitSeconds > 0 && waitSeconds < 600, { waitSeconds, minWaitSeconds });
check(checks, 'crontab-after-runtime-captured', 'Crontab after runtime was captured.', existsSync(path.join(proofsDir, 'crontab_after_runtime.txt')));
check(checks, 'truth-files-present', 'Real worker truth files exist.', files.length > 0, { files });
check(checks, 'truth-json-valid', 'Worker truth JSONL has no malformed lines.', malformed.length === 0, { malformed });
check(checks, 'post-marker-events-present', 'There are worker truth events after the wait marker.', postMarkerEvents.length > 0, { count: postMarkerEvents.length });
check(checks, 'cron-source-events-present', 'Post-marker events identify cron/scheduler source.', cronSourceEvents.length > 0, { expectedSources, count: cronSourceEvents.length });
for (const worker of workers) {
  check(checks, `${worker}-post-marker-cron-source-event`, `${worker} has a post-marker cron/scheduler-source event.`, (eventsByWorker.get(worker) ?? []).length > 0, {
    events: (eventsByWorker.get(worker) ?? []).slice(-5),
  });
}
check(checks, 'playback-media-started-after-marker', 'Playback media_started exists after marker from cron/scheduler source.', stages.has('media_started'));
check(checks, 'playback-media-finished-after-marker', 'Playback media_finished exists after marker from cron/scheduler source.', stages.has('media_finished'));
check(checks, 'playback-queue-advanced-after-marker', 'Playback queue_advanced exists after marker from cron/scheduler source.', stages.has('queue_advanced'));
check(checks, 'cron-proof-loop-log-present', 'Cron proof loop wrote a log file.', loopLogs.length > 0, { loopLogDir, loopLogs });

const result = proofResult({
  proof: 'v2_real_cron_runtime',
  checks,
  evidenceMode: !args.contract,
  note: 'Evidence proof that a managed real crontab launched a seconds-based proof loop and produced post-marker worker truth events with cron/scheduler source markers.',
});

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
