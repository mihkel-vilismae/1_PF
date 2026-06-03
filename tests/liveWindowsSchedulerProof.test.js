/**
 * Verifies the live Windows scheduler proof contract.
 * Keeps scheduler tests deterministic and avoids installing real scheduled jobs.
 * Ensures worker evidence, duplicate locks, and scheduler mode stay explicit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLiveWindowsSchedulerProofPlan,
  evaluateScheduledWorkerEvidence,
  isLiveWindowsSchedulerProofEnabled,
  runLiveWindowsSchedulerProof,
} from '../tools/live-windows-scheduler-proof-lib.mjs';

const metadata = { version: '0.8.12', gitCommit: 'test' };
const repoRoot = process.cwd();

test('live Windows scheduler proof is opt-in only', async () => {
  assert.equal(isLiveWindowsSchedulerProofEnabled({}), false);
  assert.equal(isLiveWindowsSchedulerProofEnabled({ PF_LIVE_WINDOWS_SCHEDULER_PROOF: '1' }), true);
  const envelope = await runLiveWindowsSchedulerProof({ repoRoot, metadata, env: {}, deterministicProof: { proof_status: 'PASSED' } });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.proof_kind, 'live_windows_scheduler');
});

test('scheduler proof plan requires all three worker invocations and lock evidence', () => {
  const plan = buildLiveWindowsSchedulerProofPlan();
  assert.ok(plan.some((step) => step.includes('regular worker')));
  assert.ok(plan.some((step) => step.includes('playback worker')));
  assert.ok(plan.some((step) => step.includes('screen-on-off worker')));
  assert.ok(plan.some((step) => step.includes('duplicate worker lock')));
});

test('scheduled worker evidence requires calls, counts, and timestamps', () => {
  const passed = evaluateScheduledWorkerEvidence({
    worker_calls: {
      regular_worker: { called: true, count: 1, firstCalledAt: 't1' },
      playback_worker: { called: true, count: 2, lastCalledAt: 't2' },
      screen_on_off_worker: { called: true, count: 1, firstCalledAt: 't3' },
    },
  });
  assert.equal(passed.passed, true);
  const failed = evaluateScheduledWorkerEvidence({ worker_calls: { regular_worker: { called: true, count: 1 } } });
  assert.equal(failed.passed, false);
});
