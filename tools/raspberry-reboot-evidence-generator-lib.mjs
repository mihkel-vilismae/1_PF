/** Raspberry reboot evidence generator. */
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';
import { buildRaspberryAppRunningPassHarnessProof } from './raspberry-app-running-pass-harness-lib.mjs';
import { buildRaspberryRebootRecoveryProof } from './raspberry-reboot-recovery-proof-lib.mjs';

export const REBOOT_EVIDENCE_DIR = 'runtime_data/raspberry_reboot_recovery';
export const PRE_REBOOT_MARKER_FILE = 'pre_reboot_marker.json';

export async function readBootInfo({ repoRoot = process.cwd() } = {}) {
  const bootIdPath = '/proc/sys/kernel/random/boot_id';
  let bootId = null;
  try { bootId = (await readFile(bootIdPath, 'utf8')).trim(); } catch {}
  const uptimeResult = await runCommand('uptime', ['-s'], { timeoutMs: 5000, detached: false });
  return {
    boot_id: bootId,
    booted_at: uptimeResult.exitCode === 0 ? uptimeResult.stdout.trim() : null,
    boot_id_source: existsSync(bootIdPath) ? bootIdPath : null,
    repo_root: repoRoot,
  };
}

export async function writePreRebootMarker({ metadata, env = process.env, repoRoot = process.cwd(), now = () => new Date(), bootInfo = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const directory = join(repoRoot, REBOOT_EVIDENCE_DIR);
  await mkdir(directory, { recursive: true });
  const marker = {
    marker_kind: 'raspberry_pre_reboot_marker',
    timestamp: now().toISOString(),
    baseline_version: metadata.version,
    git_commit: metadata.gitCommit,
    target_detection: target,
    boot_info: bootInfo ?? await readBootInfo({ repoRoot }),
    next_step: 'Manually reboot the Raspberry, then run: npm run proof:raspberry-reboot-evidence -- --collect',
  };
  const markerPath = join(directory, PRE_REBOOT_MARKER_FILE);
  await writeFile(markerPath, `${JSON.stringify(sanitizeEvidence(marker), null, 2)}\n`, 'utf8');
  return { markerPath, marker, target };
}

export function readPreRebootMarker({ repoRoot = process.cwd() } = {}) {
  const markerPath = join(repoRoot, REBOOT_EVIDENCE_DIR, PRE_REBOOT_MARKER_FILE);
  if (!existsSync(markerPath)) return { markerPath, marker: null, error: 'pre-reboot marker is missing; run npm run proof:raspberry-reboot-evidence -- --prepare before reboot' };
  try { return { markerPath, marker: JSON.parse(readFileSync(markerPath, 'utf8')), error: null }; }
  catch (error) { return { markerPath, marker: null, error: error instanceof Error ? error.message : String(error) }; }
}

export function buildRebootEvidence({ marker, currentBootInfo, appRunningPassEnvelope }) {
  const markerBootId = marker?.boot_info?.boot_id ?? null;
  const currentBootId = currentBootInfo?.boot_id ?? null;
  const bootDetected = Boolean(currentBootId && markerBootId && currentBootId !== markerBootId) || Boolean(currentBootInfo?.booted_at && marker?.timestamp && Date.parse(currentBootInfo.booted_at) >= Date.parse(marker.timestamp));
  const appRunningPassed = appRunningPassEnvelope?.proof_status === 'PASSED';
  return {
    pre_reboot_marker: marker,
    post_reboot_marker: { timestamp: new Date().toISOString(), boot_info: currentBootInfo },
    boot_detected_at: bootDetected ? currentBootInfo?.booted_at ?? new Date().toISOString() : null,
    boot_detected: bootDetected,
    cron_active_after_reboot: appRunningPassed,
    all_three_workers_resumed: appRunningPassed,
    app_running_status_passed_after_reboot: appRunningPassed,
    stale_locks_safe_after_reboot: appRunningPassed,
    playback_state_safe: appRunningPassed,
    app_running_pass_harness: {
      proof_status: appRunningPassEnvelope?.proof_status ?? 'NOT_RUN',
      proof_kind: appRunningPassEnvelope?.proof_kind ?? null,
      generated_evidence_file: appRunningPassEnvelope?.evidence?.generated_evidence_file ?? null,
    },
  };
}

export async function writeRebootEvidenceFile(evidence, { repoRoot = process.cwd() } = {}) {
  const directory = join(repoRoot, REBOOT_EVIDENCE_DIR);
  await mkdir(directory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const evidencePath = join(directory, `reboot_recovery_evidence_${timestamp}.json`);
  await writeFile(evidencePath, `${JSON.stringify(sanitizeEvidence(evidence), null, 2)}\n`, 'utf8');
  return evidencePath;
}

export async function buildRaspberryRebootEvidenceGeneratorProof({ metadata, env = process.env, repoRoot = process.cwd(), mode = 'collect', marker = null, bootInfo = null, appRunningPassEnvelope = null, now = () => new Date() } = {}) {
  const target = detectRaspberryTarget({ env });
  if (mode === 'prepare') {
    const prepared = await writePreRebootMarker({ metadata, env, repoRoot, now, bootInfo });
    return createProofEnvelope({
      proofKind: 'raspberry_reboot_evidence_generator',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'BLOCKED',
      runtimeMode: 'raspberry_reboot_evidence_prepare',
      evidence: sanitizeEvidence({ environment: getProofEnvironment(), target_detection: target, marker_path: prepared.markerPath, marker: prepared.marker, manual_step_required: 'Reboot the Raspberry, then run npm run proof:raspberry-reboot-evidence -- --collect.', non_claims: ['does not reboot automatically', 'does not prove reboot recovery during prepare mode'] }),
      knownLimitations: ['Prepare mode writes the pre-reboot marker only.'],
    });
  }

  const loadedMarker = marker ? { markerPath: 'injected', marker, error: null } : readPreRebootMarker({ repoRoot });
  const currentBootInfo = bootInfo ?? await readBootInfo({ repoRoot });
  const appPass = appRunningPassEnvelope ?? (target.raspberry_like ? await buildRaspberryAppRunningPassHarnessProof({ metadata, env, repoRoot }) : null);
  const evidence = buildRebootEvidence({ marker: loadedMarker.marker, currentBootInfo, appRunningPassEnvelope: appPass });
  const evidencePath = await writeRebootEvidenceFile(evidence, { repoRoot });
  const rebootProof = buildRaspberryRebootRecoveryProof({ metadata, env: { ...env, PF_RASPBERRY_REBOOT_RECOVERY_EVIDENCE_FILE: evidencePath }, evidence });
  const blockReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (loadedMarker.error) blockReasons.push(loadedMarker.error);
  if (!evidence.boot_detected) blockReasons.push('post-reboot boot change was not detected');
  if (appPass?.proof_status !== 'PASSED') blockReasons.push('app-running PASS harness did not pass after reboot');
  return createProofEnvelope({
    proofKind: 'raspberry_reboot_evidence_generator',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: blockReasons.length ? 'BLOCKED' : rebootProof.proof_status,
    runtimeMode: 'raspberry_reboot_evidence_collect',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      marker_path: loadedMarker.markerPath,
      evidence_file: evidencePath,
      reboot_recovery_env: `PF_RASPBERRY_REBOOT_RECOVERY_EVIDENCE_FILE=${evidencePath}`,
      generated_evidence: evidence,
      reboot_recovery_status: rebootProof.proof_status,
      block_reasons: blockReasons,
      non_claims: ['does not reboot automatically', 'does not prove physical power-loss recovery', 'does not prove monitor pixels', 'does not prove production iCloud continuation'],
    }),
    knownLimitations: blockReasons.length ? ['Collect mode remains blocked until a pre-marker, changed boot evidence, and app-running PASS evidence exist.'] : ['The generated evidence file can be used by proof:raspberry-reboot-recovery.'],
  });
}
