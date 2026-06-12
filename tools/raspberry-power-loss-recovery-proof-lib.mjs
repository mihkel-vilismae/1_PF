/** Raspberry physical power-loss recovery proof library. */
import { readFileSync } from 'node:fs';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

export function loadPowerLossRecoveryEvidence({ env = process.env, evidence = null } = {}) {
  if (evidence) return { source: 'injected', data: evidence, load_error: null };
  const file = env.PF_RASPBERRY_POWER_LOSS_RECOVERY_EVIDENCE_FILE;
  if (!file) return { source: 'none', data: null, load_error: 'PF_RASPBERRY_POWER_LOSS_RECOVERY_EVIDENCE_FILE is not set' };
  try { return { source: file, data: JSON.parse(readFileSync(file, 'utf8')), load_error: null }; }
  catch (error) { return { source: file, data: null, load_error: error instanceof Error ? error.message : String(error) }; }
}

export function evaluatePowerLossRecoveryEvidence(loadedEvidence) {
  const data = loadedEvidence?.data ?? {};
  return {
    pre_power_loss_marker_present: Boolean(data.pre_power_loss_marker?.timestamp || data.pre_power_loss_marker_present),
    physical_power_loss_performed: Boolean(data.physical_power_loss_performed || data.power_loss_performed),
    restored_power_detected: Boolean(data.restored_power_detected_at || data.restored_power_detected),
    boot_detected_after_restored_power: Boolean(data.boot_detected_after_restored_power || data.boot_detected_at),
    cron_active_after_restored_power: Boolean(data.cron_active_after_restored_power),
    all_three_workers_resumed: Boolean(data.all_three_workers_resumed),
    app_running_status_passed_after_power_loss: Boolean(data.app_running_status_passed_after_power_loss),
    stale_locks_reclaimed_after_power_loss: Boolean(data.stale_locks_reclaimed_after_power_loss),
    playback_state_safe_after_power_loss: Boolean(data.playback_state_safe_after_power_loss),
  };
}

export function determinePowerLossRecoveryStatus({ target, loadedEvidence, evaluation }) {
  const blockReasons = [];
  const failedReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (loadedEvidence.load_error) blockReasons.push(loadedEvidence.load_error);
  if (!evaluation.physical_power_loss_performed) blockReasons.push('physical power-loss event was not explicitly performed');
  if (!evaluation.restored_power_detected) blockReasons.push('restored power was not observed');
  for (const [key, value] of Object.entries(evaluation)) {
    if (!value && !['physical_power_loss_performed', 'restored_power_detected'].includes(key)) failedReasons.push(`missing power-loss recovery evidence: ${key}`);
  }
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, failedReasons };
  if (failedReasons.length) return { proofStatus: 'FAILED', blockReasons, failedReasons };
  return { proofStatus: 'PASSED', blockReasons, failedReasons };
}

export function buildRaspberryPowerLossRecoveryProof({ metadata, env = process.env, evidence = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const loadedEvidence = loadPowerLossRecoveryEvidence({ env, evidence });
  const evaluation = evaluatePowerLossRecoveryEvidence(loadedEvidence);
  const status = determinePowerLossRecoveryStatus({ target, loadedEvidence, evaluation });
  return createProofEnvelope({
    proofKind: 'raspberry_power_loss_recovery_v2',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: status.proofStatus,
    runtimeMode: 'raspberry_physical_power_loss_recovery_manual_pre_post',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      operator_evidence: { source: loadedEvidence.source, load_error: loadedEvidence.load_error },
      evaluation,
      status_reasons: status,
      required_dependency: 'The Raspberry app-running status proof must pass after restored power for all three cron worker lanes.',
      pass_criteria: 'PASSED only after an explicit physical power-loss/restored-power event with pre/post evidence, active cron, all three workers resumed, app-running status passed, stale locks reclaimed, and playback state safe.',
      non_claims: ['does not create a fake power-loss event', 'does not prove monitor pixels', 'does not prove production iCloud continuation', 'does not prove real provider download/geocode chains', 'does not use Windows CronEmulator as hardware proof'],
    }),
    knownLimitations: status.proofStatus === 'PASSED' ? ['This proof applies only to the observed physical power-loss event and device.'] : ['Run the manual physical power-loss evidence flow on Raspberry and provide PF_RASPBERRY_POWER_LOSS_RECOVERY_EVIDENCE_FILE.'],
  });
}
