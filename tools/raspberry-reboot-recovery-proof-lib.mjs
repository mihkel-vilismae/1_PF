/** Raspberry reboot/restored-start recovery proof library. */
import { readFileSync } from 'node:fs';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

export function loadRebootRecoveryEvidence({ env = process.env, evidence = null } = {}) {
  if (evidence) return { source: 'injected', data: evidence, load_error: null };
  const file = env.PF_RASPBERRY_REBOOT_RECOVERY_EVIDENCE_FILE;
  if (!file) return { source: 'none', data: null, load_error: 'PF_RASPBERRY_REBOOT_RECOVERY_EVIDENCE_FILE is not set' };
  try { return { source: file, data: JSON.parse(readFileSync(file, 'utf8')), load_error: null }; }
  catch (error) { return { source: file, data: null, load_error: error instanceof Error ? error.message : String(error) }; }
}

export function evaluateRebootRecoveryEvidence(loadedEvidence) {
  const data = loadedEvidence?.data ?? {};
  return {
    pre_reboot_marker_present: Boolean(data.pre_reboot_marker?.timestamp || data.pre_reboot_marker_present),
    post_reboot_marker_present: Boolean(data.post_reboot_marker?.timestamp || data.post_reboot_marker_present),
    boot_detected: Boolean(data.boot_detected_at || data.boot_detected),
    cron_active_after_reboot: Boolean(data.cron_active_after_reboot),
    all_three_workers_resumed: Boolean(data.all_three_workers_resumed),
    app_running_status_passed_after_reboot: Boolean(data.app_running_status_passed_after_reboot),
    stale_locks_safe_after_reboot: Boolean(data.stale_locks_safe_after_reboot),
    playback_state_safe: Boolean(data.playback_state_safe),
  };
}

function hasRebootRecoveryEvidencePayload(loadedEvidence) {
  return Boolean(loadedEvidence?.data && Object.keys(loadedEvidence.data).length > 0);
}

export function determineRebootRecoveryStatus({ target, loadedEvidence, evaluation }) {
  const blockReasons = [];
  const failedReasons = [];
  const hasEvidencePayload = hasRebootRecoveryEvidencePayload(loadedEvidence);
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (loadedEvidence.load_error) blockReasons.push(loadedEvidence.load_error);
  if (!hasEvidencePayload) blockReasons.push('no reboot recovery evidence supplied');
  if (hasEvidencePayload) {
    for (const [key, value] of Object.entries(evaluation)) if (!value) failedReasons.push(`missing reboot recovery evidence: ${key}`);
  }
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, failedReasons };
  if (failedReasons.length) return { proofStatus: 'FAILED', blockReasons, failedReasons };
  return { proofStatus: 'PASSED', blockReasons, failedReasons };
}

export function buildRaspberryRebootRecoveryProof({ metadata, env = process.env, evidence = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const loadedEvidence = loadRebootRecoveryEvidence({ env, evidence });
  const evaluation = evaluateRebootRecoveryEvidence(loadedEvidence);
  const status = determineRebootRecoveryStatus({ target, loadedEvidence, evaluation });
  return createProofEnvelope({
    proofKind: 'raspberry_reboot_recovery',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: status.proofStatus,
    runtimeMode: 'raspberry_reboot_recovery_manual_pre_post',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      operator_evidence: { source: loadedEvidence.source, load_error: loadedEvidence.load_error },
      evaluation,
      status_reasons: status,
      required_dependency: 'The Raspberry app-running status proof must pass after reboot for all three worker lanes.',
      pass_criteria: 'PASSED only with pre-reboot marker, post-reboot/boot evidence, active cron, all three workers resumed, app-running status passed, stale locks safe, and playback state safe.',
      non_claims: ['does not reboot the device automatically', 'does not prove physical sudden power-loss recovery', 'does not prove monitor pixels', 'does not prove production iCloud continuation'],
    }),
    knownLimitations: status.proofStatus === 'PASSED' ? ['This proof applies only to the observed manual reboot event.'] : ['Run the manual pre/post reboot evidence flow on Raspberry and provide PF_RASPBERRY_REBOOT_RECOVERY_EVIDENCE_FILE.'],
  });
}
