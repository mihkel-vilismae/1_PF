import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePowerLossRecoveryEvidence, determinePowerLossRecoveryStatus, buildRaspberryPowerLossRecoveryProof } from '../tools/raspberry-power-loss-recovery-proof-lib.mjs';

test('power-loss recovery evaluation requires physical power loss and restored power', () => {
  const evaluation = evaluatePowerLossRecoveryEvidence({ data: { pre_power_loss_marker_present: true, physical_power_loss_performed: true, restored_power_detected: true, boot_detected_after_restored_power: true, cron_active_after_restored_power: true, all_three_workers_resumed: true, app_running_status_passed_after_power_loss: true, stale_locks_reclaimed_after_power_loss: true, playback_state_safe_after_power_loss: true } });
  assert.equal(Object.values(evaluation).every(Boolean), true);
});

test('power-loss recovery blocks without real physical event and passes complete evidence', () => {
  const full = Object.fromEntries(['pre_power_loss_marker_present','physical_power_loss_performed','restored_power_detected','boot_detected_after_restored_power','cron_active_after_restored_power','all_three_workers_resumed','app_running_status_passed_after_power_loss','stale_locks_reclaimed_after_power_loss','playback_state_safe_after_power_loss'].map((key) => [key, true]));
  assert.equal(determinePowerLossRecoveryStatus({ target: { raspberry_like: true }, loadedEvidence: { load_error: null }, evaluation: { ...full, physical_power_loss_performed: false } }).proofStatus, 'BLOCKED');
  assert.equal(determinePowerLossRecoveryStatus({ target: { raspberry_like: true }, loadedEvidence: { load_error: null }, evaluation: full }).proofStatus, 'PASSED');
  assert.equal(determinePowerLossRecoveryStatus({ target: { raspberry_like: true }, loadedEvidence: { load_error: null }, evaluation: { ...full, playback_state_safe_after_power_loss: false } }).proofStatus, 'FAILED');
});

test('power-loss proof preserves no fake event and no CronEmulator hardware claim', () => {
  const envelope = buildRaspberryPowerLossRecoveryProof({ metadata: { version: '0.8.48', gitCommit: 'test' }, env: {}, evidence: {} });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.non_claims.join('\n'), /fake power-loss/);
  assert.match(envelope.evidence.non_claims.join('\n'), /Windows CronEmulator/);
});
