import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRebootRecoveryEvidence, determineRebootRecoveryStatus, buildRaspberryRebootRecoveryProof } from '../tools/raspberry-reboot-recovery-proof-lib.mjs';

test('reboot recovery evaluation requires all pre/post reboot fields', () => {
  const evaluation = evaluateRebootRecoveryEvidence({ data: { pre_reboot_marker_present: true, post_reboot_marker_present: true, boot_detected: true, cron_active_after_reboot: true, all_three_workers_resumed: true, app_running_status_passed_after_reboot: true, stale_locks_safe_after_reboot: true, playback_state_safe: true } });
  assert.equal(Object.values(evaluation).every(Boolean), true);
});

test('reboot recovery blocks off-target and fails incomplete target evidence', () => {
  const full = Object.fromEntries(['pre_reboot_marker_present','post_reboot_marker_present','boot_detected','cron_active_after_reboot','all_three_workers_resumed','app_running_status_passed_after_reboot','stale_locks_safe_after_reboot','playback_state_safe'].map((key) => [key, true]));
  assert.equal(determineRebootRecoveryStatus({ target: { raspberry_like: false }, loadedEvidence: { load_error: null }, evaluation: full }).proofStatus, 'BLOCKED');
  assert.equal(determineRebootRecoveryStatus({ target: { raspberry_like: true }, loadedEvidence: { load_error: null }, evaluation: { ...full, playback_state_safe: false } }).proofStatus, 'FAILED');
  assert.equal(determineRebootRecoveryStatus({ target: { raspberry_like: true }, loadedEvidence: { load_error: null }, evaluation: full }).proofStatus, 'PASSED');
});

test('reboot recovery proof preserves no automatic reboot and no power-loss claims', () => {
  const envelope = buildRaspberryRebootRecoveryProof({ metadata: { version: '0.8.47', gitCommit: 'test' }, env: {}, evidence: {} });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.non_claims.join('\n'), /does not reboot/);
  assert.match(envelope.evidence.non_claims.join('\n'), /power-loss/);
});
