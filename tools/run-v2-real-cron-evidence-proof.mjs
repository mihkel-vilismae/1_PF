#!/usr/bin/env node
import { check, emitProof, packageScripts, parseArgs, proofResult, readText, readTruthEvents } from './v2-final-proof-utils.mjs';

const args = parseArgs();
const checks = [];
const scripts = packageScripts();
const index = readText('server/index.ts');
const truthService = readText('server/v2WorkerTruthService.ts');
const pkgScripts = Object.keys(scripts).join('\n');

check(checks, 'cron-preflight-script', 'Raspberry cron preflight script is registered.', pkgScripts.includes('proof:raspberry-cron-preflight'));
check(checks, 'cron-worker-runtime-script', 'Raspberry cron worker runtime proof script is registered.', pkgScripts.includes('proof:raspberry-cron-worker-runtime'));
check(checks, 'worker-truth-api-route', 'Worker truth API is registered in server index.', index.includes('/api/v2/worker-truth') || index.includes('createV2WorkerTruthRoutes'));
check(checks, 'truth-workers', 'Worker truth service knows regular, playback and screen workers.', ['regular-worker', 'playback-worker', 'screen-worker'].every((value) => truthService.includes(value)));

if (args.evidence) {
  const { events, files, malformed } = readTruthEvents('real');
  const workers = new Set(events.map((event) => event.worker));
  const stages = new Set(events.map((event) => event.stage));
  const allowedSources = ['cron', 'cron-proof-loop', 'scheduler', 'prooflauncher-once'];
  const sourceEvents = events.filter((event) => allowedSources.includes(String(event.source ?? '')));
  check(checks, 'truth-files-present', 'Real worker truth files exist.', files.length > 0, { files });
  check(checks, 'regular-worker-events', 'Real regular-worker events exist.', workers.has('regular-worker'));
  check(checks, 'playback-worker-events', 'Real playback-worker events exist.', workers.has('playback-worker'));
  check(checks, 'screen-worker-events', 'Real screen-worker events exist.', workers.has('screen-worker'));
  check(checks, 'worker-start-events', 'At least one started/state event exists.', events.some((event) => event.status === 'started' || event.status === 'state'), { stages: [...stages] });
  check(checks, 'worker-source-markers', 'Worker events include source markers.', sourceEvents.length > 0, { allowedSources, sourceEventCount: sourceEvents.length });
  check(checks, 'truth-json-valid', 'Worker truth JSONL contains no malformed lines.', malformed.length === 0, { malformed });
}

const result = proofResult({
  proof: 'v2_real_cron_worker_evidence',
  checks,
  evidenceMode: args.evidence,
  note: args.evidence
    ? 'Evidence proof for real worker truth files. A PASS here means real worker truth exists; use Raspberry cron runtime proof to prove the scheduler source.'
    : 'Static contract proof that the repo exposes cron and worker-truth proof surfaces.',
});

emitProof(result, { write: args.write });
