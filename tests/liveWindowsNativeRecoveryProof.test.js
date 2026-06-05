/**
 * Verifies the live Windows native recovery proof contract.
 * Keeps restart/recovery tests deterministic and target-safe.
 * Ensures the proof distinguishes controlled API restart from OS reboot proof.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildControlledRecoveryStageKeys,
  buildLiveWindowsNativeRecoveryPlan,
  compareRecoverySelectedItems,
  evaluateControlledRecoveryEvidence,
  isLiveWindowsNativeRecoveryProofEnabled,
  runLiveWindowsNativeRecoveryProof,
  shouldOrchestrateWindowsNativeRecovery,
} from '../tools/live-windows-native-recovery-proof-lib.mjs';

const metadata = { version: '0.8.25', gitCommit: 'test' };

test('live Windows native recovery proof is opt-in only', async () => {
  assert.equal(isLiveWindowsNativeRecoveryProofEnabled({}), false);
  assert.equal(isLiveWindowsNativeRecoveryProofEnabled({ PF_LIVE_WINDOWS_NATIVE_RECOVERY_PROOF: 'true' }), true);
  const envelope = await runLiveWindowsNativeRecoveryProof({ metadata, env: {} });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.boundary, /Controlled API restart/);
});

test('live Windows native recovery requires explicit orchestration ownership', async () => {
  assert.equal(shouldOrchestrateWindowsNativeRecovery({}), false);
  assert.equal(shouldOrchestrateWindowsNativeRecovery({ PF_LIVE_WINDOWS_NATIVE_RECOVERY_ORCHESTRATE: '1' }), true);
  const envelope = await runLiveWindowsNativeRecoveryProof({
    metadata,
    env: {
      PF_LIVE_WINDOWS_NATIVE_RECOVERY_PROOF: '1',
      PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF: '1',
    },
  });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.reason, /ORCHESTRATE/);
});

test('recovery proof plan separates controlled API restart from OS reboot', () => {
  const plan = buildLiveWindowsNativeRecoveryPlan();
  assert.ok(plan.some((step) => step.includes('stop proof-owned API process')));
  assert.ok(plan.some((step) => step.includes('restart proof-owned API process')));
  assert.ok(!plan.some((step) => step.toLowerCase().includes('reboot windows')));
});

test('recovery stage keys show before restart, restart, relaunch, and owned stop', () => {
  assert.deepEqual(buildControlledRecoveryStageKeys(), [
    'api_start_before_restart',
    'api_ready_before_restart',
    'before_restart_playback_contract',
    'before_restart_native_detect',
    'before_restart_native_start_current',
    'before_restart_native_status_after_start',
    'api_stop_for_restart',
    'api_start_after_restart',
    'api_ready_after_restart',
    'after_restart_playback_contract',
    'after_restart_native_start_current',
    'after_restart_native_status_after_relaunch',
    'after_restart_native_stop_owned',
  ]);
});

test('recovery item comparison requires stable selected media asset identity', () => {
  assert.equal(compareRecoverySelectedItems({ mediaAssetId: 1 }, { mediaAssetId: '1' }).sameMediaAsset, true);
  assert.equal(compareRecoverySelectedItems({ mediaAssetId: 1 }, { mediaAssetId: '2' }).sameMediaAsset, false);
  assert.equal(compareRecoverySelectedItems(null, { mediaAssetId: '2' }).sameMediaAsset, false);
});

test('controlled recovery evaluation requires same item, running native status, pid, and owned stop', () => {
  const passed = evaluateControlledRecoveryEvidence({
    selectedComparison: { sameMediaAsset: true },
    beforeNativeComparison: { sameMediaAsset: true, nativeStatus: 'running', nativePidPresent: true },
    afterNativeComparison: { sameMediaAsset: true, nativeStatus: 'running', nativePidPresent: true },
    stopPayload: { nativePlayback: { status: 'stopped' } },
  });
  assert.equal(passed.passed, true);

  const failed = evaluateControlledRecoveryEvidence({
    selectedComparison: { sameMediaAsset: true },
    beforeNativeComparison: { sameMediaAsset: true, nativeStatus: 'running', nativePidPresent: true },
    afterNativeComparison: { sameMediaAsset: false, nativeStatus: 'running', nativePidPresent: true },
    stopPayload: { nativePlayback: { status: 'stopped' } },
  });
  assert.equal(failed.passed, false);
});
