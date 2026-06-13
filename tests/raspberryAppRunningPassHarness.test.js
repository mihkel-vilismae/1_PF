import test from 'node:test';
import assert from 'node:assert/strict';
import { determineAppRunningPassStatus, buildRaspberryAppRunningPassHarnessProof } from '../tools/raspberry-app-running-pass-harness-lib.mjs';

test('app-running PASS harness requires all three complete worker lanes', () => {
  const complete = { worker_lanes: ['regular_stage_worker','playback_worker','screen_on_off_worker'].map((name) => ({ name, invocation_observed: true, same_worker_singleton: { first_acquired: true, duplicate_skipped: true }, cross_worker_independence: true, stale_lock: { reclaimed: true } })) };
  assert.equal(determineAppRunningPassStatus({ target: { raspberry_like: true }, generatedEvidence: complete, cronProof: { proof_status: 'PASSED' }, appStatusProof: { proof_status: 'PASSED' } }).proofStatus, 'PASSED');
  assert.equal(determineAppRunningPassStatus({ target: { raspberry_like: true }, generatedEvidence: { worker_lanes: complete.worker_lanes.slice(0, 2) }, cronProof: { proof_status: 'PASSED' }, appStatusProof: { proof_status: 'PASSED' } }).proofStatus, 'BLOCKED');
});

test('app-running PASS harness can pass with injected complete evidence and target override', async () => {
  const currentCrontab = [
    '*/10 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler regular-stage-worker',
    '* * * * * cd "$HOME/1_PF" && npm run api -- --scheduler playback-worker',
    '*/3 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler screen-on-off-worker',
  ].join('\n');
  const generatedEvidence = { generated_at: '2026-06-13T00:00:00Z', worker_lanes: ['regular_stage_worker','playback_worker','screen_on_off_worker'].map((name) => ({
    name,
    last_invocation_at: '2026-06-13T00:00:00Z',
    invocation_observed: true,
    same_worker_singleton: { first_acquired: true, duplicate_skipped: true },
    cross_worker_independence: true,
    stale_lock: { reclaimed: true },
  })) };
  const envelope = await buildRaspberryAppRunningPassHarnessProof({ metadata: { version: '0.8.52', gitCommit: 'test' }, env: { PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET: 'true' }, generatedEvidence, currentCrontab });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.app_running, true);
});

test('app-running PASS harness remains blocked off-target', async () => {
  const envelope = await buildRaspberryAppRunningPassHarnessProof({ metadata: { version: '0.8.52', gitCommit: 'test' }, env: {}, generatedEvidence: { generated_at: '2026-06-13T00:00:00Z', worker_lanes: [] }, currentCrontab: '' });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.non_claims.join('\n'), /does not reboot/);
});
