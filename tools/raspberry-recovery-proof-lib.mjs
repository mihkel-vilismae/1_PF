/**
 * Raspberry power-loss recovery proof library.
 * Keeps hardware proof separate from Windows CronEmulator evidence.
 * Builds honest PASSED/BLOCKED/PARTIAL proof envelopes from operator input.
 * Sanitizes hostnames, paths, and log excerpts before artifacts are written.
 * Does not claim hardware proof from source code or tests alone.
 */
import { createProofEnvelope, sanitizeEvidence } from './proof-utils.mjs';

/** Tells callers whether Raspberry hardware proof collection is explicitly enabled. */
export function isRaspberryRecoveryProofEnabled(env = process.env) { return env.PF_PROOF_ENABLE_RASPBERRY_RECOVERY === 'true'; }

/** Normalizes operator-provided worker names into a stable proof list. */
export function parseWorkerList(rawWorkers = '') { return String(rawWorkers).split(',').map((entry) => entry.trim()).filter(Boolean); }

/** Returns the proof status for hardware evidence without overclaiming. */
export function determineRaspberryRecoveryStatus({ enabled, powerLossPerformed, workersStarted, playbackSafe }) {
  if (!enabled || !powerLossPerformed) return 'BLOCKED';
  if (workersStarted && playbackSafe) return 'PASSED';
  if (workersStarted || playbackSafe) return 'PARTIAL';
  return 'FAILED';
}

/** Builds the Raspberry recovery proof envelope from explicit operator evidence. */
export function buildRaspberryRecoveryProof({ metadata, env = process.env, evidence = {} }) {
  const enabled = isRaspberryRecoveryProofEnabled(env);
  const powerLossPerformed = evidence.powerLossPerformed === true || env.PF_RASPBERRY_POWER_LOSS_PERFORMED === 'true';
  const workersStarted = evidence.workersStarted === true || env.PF_RASPBERRY_WORKERS_STARTED === 'true';
  const playbackSafe = evidence.playbackSafe === true || env.PF_RASPBERRY_PLAYBACK_SAFE === 'true';
  const status = determineRaspberryRecoveryStatus({ enabled, powerLossPerformed, workersStarted, playbackSafe });
  return createProofEnvelope({ proofKind: 'raspberry_power_loss_recovery', baselineVersion: metadata.version, gitCommit: metadata.gitCommit, proofStatus: status, runtimeMode: 'hardware', evidence: sanitizeEvidence({ device: { platform: 'raspberry_pi', hostname: evidence.hostname ?? env.PF_RASPBERRY_HOSTNAME ?? '[not provided]', os_summary: evidence.osSummary ?? env.PF_RASPBERRY_OS_SUMMARY ?? '[not provided]' }, boot: { power_loss_test_performed: powerLossPerformed, startup_mechanism: evidence.startupMechanism ?? env.PF_RASPBERRY_STARTUP_MECHANISM ?? 'unknown', boot_detected_at: evidence.bootDetectedAt ?? env.PF_RASPBERRY_BOOT_DETECTED_AT ?? null }, workers: { expected_workers: parseWorkerList(evidence.expectedWorkers ?? env.PF_RASPBERRY_EXPECTED_WORKERS ?? 'download_worker,index_worker,playback_worker'), workers_started: workersStarted, worker_statuses: evidence.workerStatuses ?? [] }, playback_recovery: { checkpoint_found: evidence.checkpointFound ?? env.PF_RASPBERRY_CHECKPOINT_FOUND === 'true', current_media_safe: playbackSafe, restore_user_triggered_or_auto: evidence.restoreMode ?? env.PF_RASPBERRY_RESTORE_MODE ?? 'unknown' }, logs: { sanitized_log_excerpt_included: Boolean(evidence.logExcerpt || env.PF_RASPBERRY_LOG_EXCERPT), excerpt: evidence.logExcerpt ?? env.PF_RASPBERRY_LOG_EXCERPT ?? '' }, windows_cron_emulator_is_not_hardware_proof: true }), knownLimitations: status === 'PASSED' ? ['This proof applies only to the specific Raspberry device and startup mechanism observed.'] : ['Hardware proof is not complete until an actual power-loss test is performed and worker/playback recovery is observed.'] });
}
