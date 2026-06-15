import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RASPBERRY_CRON_WORKER_LANES,
  evaluateCronRows,
  evaluateWorkerEvidence,
  determineCronWorkerRuntimeStatus,
  buildCronWorkerRuntimeNextSteps,
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
