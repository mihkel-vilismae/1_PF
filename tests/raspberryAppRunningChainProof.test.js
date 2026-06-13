import test from 'node:test';
import assert from 'node:assert/strict';
import { determineAppRunningChainStatus, buildRaspberryAppRunningChainProof } from '../tools/raspberry-app-running-chain-proof-lib.mjs';

test('app-running chain status passes only when all steps pass', () => {
  assert.equal(determineAppRunningChainStatus({ generatorProof: { proof_status: 'PASSED' }, cronProof: { proof_status: 'PASSED' }, appStatusProof: { proof_status: 'PASSED' } }), 'PASSED');
  assert.equal(determineAppRunningChainStatus({ generatorProof: { proof_status: 'BLOCKED' }, cronProof: { proof_status: 'PASSED' }, appStatusProof: { proof_status: 'PASSED' } }), 'BLOCKED');
  assert.equal(determineAppRunningChainStatus({ generatorProof: { proof_status: 'PASSED' }, cronProof: { proof_status: 'FAILED' }, appStatusProof: { proof_status: 'PASSED' } }), 'FAILED');
});

test('app-running chain can pass with complete generated evidence and target override', async () => {
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
  const envelope = await buildRaspberryAppRunningChainProof({ metadata: { version: '0.8.50', gitCommit: 'test' }, env: { PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET: 'true' }, generatedEvidence, currentCrontab });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.chain.at(-1).app_running, true);
});

test('app-running chain remains blocked with incomplete evidence', async () => {
  const envelope = await buildRaspberryAppRunningChainProof({ metadata: { version: '0.8.50', gitCommit: 'test' }, env: {}, generatedEvidence: { generated_at: '2026-06-13T00:00:00Z', worker_lanes: [] }, currentCrontab: '' });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.non_claims.join('\n'), /does not reboot/);
});
