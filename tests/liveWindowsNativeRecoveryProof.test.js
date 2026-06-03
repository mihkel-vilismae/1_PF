/**
 * Verifies the live Windows native recovery proof contract.
 * Keeps restart/recovery tests deterministic and target-safe.
 * Ensures the proof distinguishes controlled API restart from OS reboot proof.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLiveWindowsNativeRecoveryPlan,
  compareRecoverySelectedItems,
  isLiveWindowsNativeRecoveryProofEnabled,
  runLiveWindowsNativeRecoveryProof,
} from '../tools/live-windows-native-recovery-proof-lib.mjs';

const metadata = { version: '0.8.11', gitCommit: 'test' };

test('live Windows native recovery proof is opt-in only', async () => {
  assert.equal(isLiveWindowsNativeRecoveryProofEnabled({}), false);
  assert.equal(isLiveWindowsNativeRecoveryProofEnabled({ PF_LIVE_WINDOWS_NATIVE_RECOVERY_PROOF: 'true' }), true);
  const envelope = await runLiveWindowsNativeRecoveryProof({ metadata, env: {} });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.boundary, /Controlled API restart/);
});

test('recovery proof plan separates controlled API restart from OS reboot', () => {
  const plan = buildLiveWindowsNativeRecoveryPlan();
  assert.ok(plan.some((step) => step.includes('stop proof-owned API process')));
  assert.ok(plan.some((step) => step.includes('restart proof-owned API process')));
  assert.ok(!plan.some((step) => step.toLowerCase().includes('reboot windows')));
});

test('recovery item comparison requires stable selected media asset identity', () => {
  assert.equal(compareRecoverySelectedItems({ mediaAssetId: 1 }, { mediaAssetId: '1' }).sameMediaAsset, true);
  assert.equal(compareRecoverySelectedItems({ mediaAssetId: 1 }, { mediaAssetId: '2' }).sameMediaAsset, false);
  assert.equal(compareRecoverySelectedItems(null, { mediaAssetId: '2' }).sameMediaAsset, false);
});
