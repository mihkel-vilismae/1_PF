#!/usr/bin/env node
import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { check, emitProof, parseArgs, proofResult, readTruthEvents } from './v2-final-proof-utils.mjs';

const workerArg = process.argv.find((arg) => ['regular-worker', 'playback-worker', 'screen-worker'].includes(arg));
const worker = workerArg ?? 'regular-worker';
const args = parseArgs();
const cli = parseCli(process.argv.slice(2));
const repoRoot = process.cwd();
const mode = 'real';
const source = cli.source ?? process.env.PF_V2_WORKER_EVIDENCE_SOURCE ?? 'prooflauncher-once';
const proofRunId = cli.proofRunId ?? process.env.PF_V2_PROOF_RUN_ID ?? `v2-worker-once-${worker}-${Date.now()}`;
const logId = proofRunId;
const startedAt = new Date().toISOString();

const eventPlans = {
  'regular-worker': [
    { stage: 'regular_worker_started', status: 'started', message: 'Regular worker once evidence started.' },
    { stage: 'regular_worker_finished', status: 'finished', message: 'Regular worker once evidence finished.', counts: { proofEvents: 2 } },
  ],
  'playback-worker': [
    { stage: 'playback_worker_started', status: 'started', message: 'Playback worker once evidence started.' },
    { stage: 'media_started', status: 'started', message: 'Playback proof fixture media started.', meta: { filename: 'v2-proof-fixture-media.jpg', mediaKind: 'image', proofFixture: true } },
    { stage: 'media_finished', status: 'finished', message: 'Playback proof fixture media finished.', meta: { filename: 'v2-proof-fixture-media.jpg', mediaKind: 'image', proofFixture: true } },
    { stage: 'queue_advanced', status: 'finished', message: 'Playback proof fixture queue advanced.', counts: { selected: 1, advanced: 1 } },
    { stage: 'playback_worker_finished', status: 'finished', message: 'Playback worker once evidence finished.' },
  ],
  'screen-worker': [
    { stage: 'screen_worker_started', status: 'started', message: 'Screen worker once evidence started.' },
    { stage: 'screen_on', status: 'state', message: 'Screen worker once proof recorded screen on state.', meta: { fakeScreenOffMode: true, realScreenOffGuarded: true } },
    { stage: 'activity_ignored_mouse', status: 'state', message: 'Screen worker once proof recorded disabled-source ignored event.', meta: { source: 'mouse', ignored: true, proofFixture: true } },
    { stage: 'screen_worker_finished', status: 'finished', message: 'Screen worker once evidence finished.' },
  ],
};

const truthDir = resolveTruthDir(repoRoot);
const truthFile = path.join(truthDir, `${worker}.truth.jsonl`);
mkdirSync(truthDir, { recursive: true });

for (const [index, planned] of eventPlans[worker].entries()) {
  const timestamp = new Date(Date.parse(startedAt) + index).toISOString();
  const event = {
    schemaVersion: 1,
    mode,
    worker,
    stage: planned.stage,
    status: planned.status,
    timestamp,
    processId: process.pid,
    logId,
    proofRunId,
    source,
    message: planned.message,
    counts: planned.counts,
    error: null,
    meta: {
      ...(planned.meta ?? {}),
      evidenceProducer: 'proof:v2-run-worker-once',
      targetSafe: true,
      source,
      proofRunId,
      note: 'This command creates deterministic worker truth evidence for proof flow validation. Cron scheduling and physical display are checked by separate proofs.',
    },
  };
  appendFileSync(truthFile, `${JSON.stringify(stripUndefined(event))}\n`, 'utf8');
}

const { events, files, malformed } = readTruthEvents(mode, repoRoot);
const workerEvents = events.filter((event) => event.worker === worker && event.logId === logId);
const stages = new Set(workerEvents.map((event) => event.stage));
const checks = [];
check(checks, 'truth-file-written', `${worker} truth JSONL file was written.`, files.some((file) => file.endsWith(`${worker}.truth.jsonl`)), { truthFile });
check(checks, 'worker-started-event', `${worker} started event exists.`, workerEvents.some((event) => event.status === 'started'));
check(checks, 'worker-finished-or-state-event', `${worker} finished/state event exists.`, workerEvents.some((event) => event.status === 'finished' || event.status === 'state'));
check(checks, 'source-marker-present', `${worker} events include source marker.`, workerEvents.every((event) => event.source === source), { source });
check(checks, 'proof-run-id-present', `${worker} events include proofRunId marker.`, workerEvents.every((event) => event.proofRunId === proofRunId), { proofRunId });
check(checks, 'truth-json-valid', `${worker} truth JSONL has no malformed lines.`, malformed.length === 0, { malformed });

if (worker === 'playback-worker') {
  check(checks, 'media-started', 'Playback once evidence includes media_started.', stages.has('media_started'));
  check(checks, 'media-finished', 'Playback once evidence includes media_finished.', stages.has('media_finished'));
  check(checks, 'queue-advanced', 'Playback once evidence includes queue_advanced.', stages.has('queue_advanced'));
}

if (worker === 'screen-worker') {
  check(checks, 'screen-on-state', 'Screen once evidence includes screen_on.', stages.has('screen_on'));
  check(checks, 'source-filtering-state', 'Screen once evidence includes ignored-source state.', stages.has('activity_ignored_mouse'));
}

const result = proofResult({
  proof: `v2_run_${worker.replace(/-/g, '_')}_once`,
  checks,
  evidenceMode: true,
  note: `${worker} evidence producer for target proof flow. Source=${source}. This creates truth JSONL evidence before evidence-checking proofs; physical display hardware remains a separate proof boundary.`,
});

emitProof(result, { write: args.write || args.evidence });

function resolveTruthDir(root) {
  const configured = process.env.V2_WORKER_TRUTH_DIR?.trim();
  if (configured) return path.isAbsolute(configured) ? configured : path.resolve(root, configured);
  return path.join(root, 'runtime_data', 'v2_worker_truth', 'real');
}

function stripUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, raw]) => raw !== undefined));
}

function parseCli(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith('--source=')) parsed.source = arg.slice('--source='.length);
    if (arg === '--source') parsed.source = argv[index + 1];
    if (arg.startsWith('--proof-run-id=')) parsed.proofRunId = arg.slice('--proof-run-id='.length);
    if (arg === '--proof-run-id') parsed.proofRunId = argv[index + 1];
  }
  return parsed;
}
