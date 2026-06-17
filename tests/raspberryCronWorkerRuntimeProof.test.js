import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  RASPBERRY_CRON_WORKER_LANES,
  evaluateCronRows,
  evaluateWorkerEvidence,
  determineCronWorkerRuntimeStatus,
  buildCronWorkerRuntimeNextSteps,
  loadOperatorEvidence,
} from '../tools/raspberry-cron-worker-runtime-proof-lib.mjs';

test('cron worker proof defines the three required worker lanes and cadences', () => {
  assert.deepEqual(RASPBERRY_CRON_WORKER_LANES.map((lane) => [lane.name, lane.cadence]), [
    ['regular_stage_worker', '*/10 * * * *'],
    ['playback_worker', '* * * * *'],
    ['screen_on_off_worker', '*/3 * * * *'],
  ]);
});

test('cron row evaluator requires all three scheduler fragments', () => {
  const rows = [
    '*/10 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler regular-stage-worker',
    '* * * * * cd "$HOME/1_PF" && npm run api -- --scheduler playback-worker',
    '*/3 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler screen-on-off-worker',
  ];
  assert.deepEqual(evaluateCronRows(rows).map((row) => row.present), [true, true, true]);
});

test('worker evidence requires invocation, duplicate skip, independence, and stale-lock reclaim', () => {
  const evidence = { data: { worker_lanes: RASPBERRY_CRON_WORKER_LANES.map((lane) => ({
    name: lane.name,
    last_invocation_at: '2026-06-13T00:00:00Z',
    same_worker_singleton: { first_acquired: true, duplicate_skipped: true },
    cross_worker_independence: true,
    stale_lock: { reclaimed: true },
  })) } };
  assert.equal(evaluateWorkerEvidence(evidence).every((row) => row.complete), true);
});

test('status blocks off-target or without operator evidence and passes complete target evidence', () => {
  const presentRows = RASPBERRY_CRON_WORKER_LANES.map((lane) => ({ ...lane, present: true }));
  const completeEvidence = RASPBERRY_CRON_WORKER_LANES.map((lane) => ({ name: lane.name, complete: true }));
  assert.equal(determineCronWorkerRuntimeStatus({ target: { raspberry_like: false }, cronAvailable: true, cronRows: presentRows, workerEvidence: completeEvidence, operatorEvidence: { load_error: null } }).proofStatus, 'BLOCKED');
  assert.equal(determineCronWorkerRuntimeStatus({ target: { raspberry_like: true }, cronAvailable: true, cronRows: presentRows, workerEvidence: completeEvidence, operatorEvidence: { load_error: 'missing file' } }).proofStatus, 'BLOCKED');
  assert.equal(determineCronWorkerRuntimeStatus({ target: { raspberry_like: true }, cronAvailable: true, cronRows: presentRows, workerEvidence: completeEvidence, operatorEvidence: { load_error: null } }).proofStatus, 'PASSED');
});


test('cron worker runtime next steps name missing worker evidence requirements', () => {
  const steps = buildCronWorkerRuntimeNextSteps({
    proofStatus: 'FAILED',
    blockReasons: [],
    missingRows: [],
    incompleteEvidence: ['playback_worker'],
  });
  assert.match(steps.join('\n'), /playback_worker/);
  assert.match(steps.join('\n'), /duplicate-skip/);
  assert.match(steps.join('\n'), /stale-lock/);
});


test('cron worker runtime auto-loads latest generated evidence manifest', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-latest-worker-evidence-'));
  try {
    const evidencePath = join(dir, 'evidence.json');
    const latestPath = join(dir, 'latest.json');
    const evidence = { worker_lanes: RASPBERRY_CRON_WORKER_LANES.map((lane) => ({
      name: lane.name,
      last_invocation_at: '2026-06-17T00:00:00Z',
      same_worker_singleton: { first_acquired: true, duplicate_skipped: true },
      cross_worker_independence: true,
      stale_lock: { reclaimed: true },
    })) };
    await writeFile(evidencePath, `${JSON.stringify(evidence)}\n`, 'utf8');
    await writeFile(latestPath, `${JSON.stringify({ evidenceFile: evidencePath })}\n`, 'utf8');
    const loaded = loadOperatorEvidence({ env: {}, latestManifestPath: latestPath });
    assert.equal(loaded.load_error, null);
    assert.equal(loaded.auto_discovered, true);
    assert.equal(loaded.data.worker_lanes.length, 3);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});


test('latest worker evidence manifest rejects redacted machine-readable paths', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-redacted-worker-evidence-'));
  try {
    const manifestPath = join(dir, 'latest.json');
    await writeFile(manifestPath, JSON.stringify({ evidenceFile: '[REDACTED]' }), 'utf8');
    const loaded = loadOperatorEvidence({ env: {}, latestManifestPath: manifestPath });
    assert.equal(loaded.data, null);
    assert.equal(loaded.resolution, 'redacted');
    assert.match(loaded.load_error, /redacted evidence path/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('cron worker runtime treats incomplete loaded worker evidence as blocked not passed', () => {
  const presentRows = RASPBERRY_CRON_WORKER_LANES.map((lane) => ({ ...lane, present: true }));
  const incompleteEvidence = RASPBERRY_CRON_WORKER_LANES.map((lane) => ({ name: lane.name, complete: false }));
  const status = determineCronWorkerRuntimeStatus({
    target: { raspberry_like: true },
    cronAvailable: true,
    cronRows: presentRows,
    workerEvidence: incompleteEvidence,
    operatorEvidence: { load_error: null },
  });
  assert.equal(status.proofStatus, 'BLOCKED');
  assert.match(status.blockReasons.join('\n'), /incomplete worker evidence/);
});
