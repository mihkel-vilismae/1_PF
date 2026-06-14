import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWorkerEvidence } from '../tools/raspberry-cron-worker-runtime-proof-lib.mjs';
import {
  collectWorkerEvidenceFromRuntimeFiles,
  evaluateGeneratedEvidence,
  buildWorkerLaneEvidenceFromStatus,
} from '../tools/raspberry-worker-evidence-generator-lib.mjs';

test('worker evidence generator builds cron-runtime-compatible lane evidence', () => {
  const lane = { name: 'regular_stage_worker' };
  const evidence = buildWorkerLaneEvidenceFromStatus({
    lane,
    statusRead: { path: '/tmp/status.json', exists: true, error: null, data: {
      last_invocation_at: '2026-06-13T00:00:00Z',
      same_worker_singleton: { first_acquired: true, duplicate_skipped: true },
      cross_worker_independence: true,
      stale_lock: { reclaimed: true },
    } },
    lockRead: { path: '/tmp/lock.json', exists: false, error: null, data: null },
  });
  assert.equal(evaluateWorkerEvidence({ data: { worker_lanes: [evidence] } })[0].complete, true);
});

test('generated evidence remains blocked when any worker lane evidence is missing', () => {
  const generatedEvidence = collectWorkerEvidenceFromRuntimeFiles({ runtimeDirectory: '/tmp/nonexistent-pf-worker-evidence' });
  const evaluation = evaluateGeneratedEvidence({ target: { raspberry_like: true }, crontab: { available: true, rows: [
    '*/10 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler regular-stage-worker',
    '* * * * * cd "$HOME/1_PF" && npm run api -- --scheduler playback-worker',
    '*/3 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler screen-on-off-worker',
  ] }, generatedEvidence });
  assert.equal(evaluation.proofStatus, 'BLOCKED');
  assert.deepEqual(evaluation.incompleteWorkers, ['regular_stage_worker', 'playback_worker', 'screen_on_off_worker']);
});

test('generated evidence passes only with target, crontab rows, and complete all-lane evidence', () => {
  const worker_lanes = ['regular_stage_worker', 'playback_worker', 'screen_on_off_worker'].map((name) => ({
    name,
    last_invocation_at: '2026-06-13T00:00:00Z',
    same_worker_singleton: { first_acquired: true, duplicate_skipped: true },
    cross_worker_independence: true,
    stale_lock: { reclaimed: true },
  }));
  const evaluation = evaluateGeneratedEvidence({ target: { raspberry_like: true }, crontab: { available: true, rows: [
    '*/10 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler regular-stage-worker',
    '* * * * * cd "$HOME/1_PF" && npm run api -- --scheduler playback-worker',
    '*/3 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler screen-on-off-worker',
  ] }, generatedEvidence: { worker_lanes } });
  assert.equal(evaluation.proofStatus, 'PASSED');
});


test('generated evidence recognizes managed cron rows with absolute Raspberry paths', () => {
  const worker_lanes = ['regular_stage_worker', 'playback_worker', 'screen_on_off_worker'].map((name) => ({
    name,
    last_invocation_at: '2026-06-13T00:00:00Z',
    same_worker_singleton: { first_acquired: true, duplicate_skipped: true },
    cross_worker_independence: true,
    stale_lock: { reclaimed: true },
  }));
  const evaluation = evaluateGeneratedEvidence({ target: { raspberry_like: true }, crontab: { available: true, rows: [
    '*/10 * * * * cd "/home/mihkel/0.8.58-pf" && npm run api -- --scheduler regular-stage-worker >>"/home/mihkel/0.8.58-pf/runtime_data/cron/regular-stage-worker.log" 2>&1',
    '* * * * * cd "/home/mihkel/0.8.58-pf" && npm run api -- --scheduler playback-worker >>"/home/mihkel/0.8.58-pf/runtime_data/cron/playback-worker.log" 2>&1',
    '*/3 * * * * cd "/home/mihkel/0.8.58-pf" && npm run api -- --scheduler screen-on-off-worker >>"/home/mihkel/0.8.58-pf/runtime_data/cron/screen-on-off-worker.log" 2>&1',
  ] }, generatedEvidence: { worker_lanes } });
  assert.equal(evaluation.proofStatus, 'PASSED');
});
