/**
 * Windows reboot/restart recovery preflight proof library for PF_login.
 * Defines a safe project-owned recovery contract without rebooting Windows.
 * Keeps Windows Task Scheduler out of scope by design.
 * Verifies launcher, evidence, cleanup, and local tool boundaries before target proof work.
 * Produces sanitized proof evidence for documentation-only/preflight validation.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createProofEnvelope, runCommand, sanitizeEvidence } from './proof-utils.mjs';

const REQUIRED_PROJECT_COMMANDS = Object.freeze([
  'start_win_full.cmd',
  'start_live_windows_native_playback_proof.cmd',
  'start_live_windows_native_video_playback_proof.cmd',
  'start_live_windows_native_recovery_proof.cmd',
  'start_live_windows_scheduler_proof.cmd',
]);
const REQUIRED_PROOF_DOCS = Object.freeze([
  'docs/proofs/live_windows_native_playback_proof.md',
  'docs/proofs/live_windows_native_video_playback_proof.md',
  'docs/proofs/live_windows_native_recovery_proof.md',
  'docs/proofs/live_windows_scheduler_proof.md',
  'docs/proofs/windows_native_proof_milestone_v0.8.26.md',
]);
const REQUIRED_PACKAGE_SCRIPTS = Object.freeze([
  'proof:verify-generated-test-data',
  'proof:live-windows-native-playback',
  'proof:live-windows-native-video-playback',
  'proof:live-windows-native-recovery',
  'proof:live-windows-scheduler',
]);

/** Builds the manual proof-owned restart/recovery sequence without executing it. */
export function buildWindowsRebootRecoveryPreflightPlan() {
  return [
    'verify clean repo and active VERSION before restart preparation',
    'run generated fixture validation and native proof launchers before manual restart',
    'write a pre-restart marker under ignored runtime_data/proofs',
    'operator manually restarts Windows outside this preflight',
    'operator runs the resume proof command after login/startup',
    'resume proof validates marker continuity, selected-item state, native playback launch, scheduler-loop readiness, and sanitized evidence export',
    'cleanup removes only proof-owned runtime markers/artifacts, never arbitrary processes or local tool bundles',
  ];
}

/** Lists the explicit proof boundaries and non-claims for this preflight. */
export function buildWindowsRebootRecoveryNonClaims() {
  return [
    'This preflight does not reboot Windows.',
    'This preflight does not prove Windows reboot recovery.',
    'Windows Task Scheduler is not part of PF_login project scope.',
    'This preflight does not use schtasks.exe.',
    'This preflight does not prove Raspberry cron, Raspberry reboot, or Raspberry power-loss recovery.',
    'This preflight does not prove monitor-pixel focus or production iCloud continuation.',
    'tools/mpv/ and tools/ffmpeg/ remain local-only ignored tool bundles and are not vendored into Git.',
  ];
}

/** Resolves a repository-relative path for preflight checks. */
function repoPath(repoRoot, relativePath) {
  return join(repoRoot, ...relativePath.split('/'));
}

/** Checks required project-owned launcher files and proof docs exist. */
function checkRequiredFiles(repoRoot) {
  const commandChecks = REQUIRED_PROJECT_COMMANDS.map((relativePath) => ({ relativePath, exists: existsSync(repoPath(repoRoot, relativePath)) }));
  const proofDocChecks = REQUIRED_PROOF_DOCS.map((relativePath) => ({ relativePath, exists: existsSync(repoPath(repoRoot, relativePath)) }));
  return { commandChecks, proofDocChecks, passed: [...commandChecks, ...proofDocChecks].every((entry) => entry.exists) };
}

/** Checks package proof scripts needed by the manual restart/recovery contract. */
function checkPackageScripts(repoRoot) {
  const packageJson = JSON.parse(readFileSync(repoPath(repoRoot, 'package.json'), 'utf8'));
  const checks = REQUIRED_PACKAGE_SCRIPTS.map((scriptName) => ({ scriptName, exists: Boolean(packageJson.scripts?.[scriptName]) }));
  return { checks, passed: checks.every((entry) => entry.exists) };
}

/** Checks ignored local media-tool bundle rules without requiring the binaries to exist. */
function checkLocalToolBoundaries(repoRoot) {
  const gitignore = readFileSync(repoPath(repoRoot, '.gitignore'), 'utf8');
  return {
    toolsMpvIgnored: /(^|\n)tools\/mpv\//.test(gitignore),
    toolsFfmpegIgnored: /(^|\n)tools\/ffmpeg\//.test(gitignore),
  };
}

/** Checks Git does not currently track local media-tool bundles when Git metadata is available. */
async function checkTrackedLocalTools(repoRoot) {
  const result = await runCommand('git', ['ls-files', 'tools/mpv', 'tools/ffmpeg'], { cwd: repoRoot, timeoutMs: 10000, detached: false });
  return {
    command: 'git ls-files tools/mpv tools/ffmpeg',
    exitCode: result.exitCode,
    trackedEntries: result.stdout.split(/\r?\n/).filter(Boolean),
    passed: result.exitCode === 0 && result.stdout.trim() === '',
  };
}

/** Builds a cleanup contract for the future manual reboot/restart proof. */
function buildCleanupContract() {
  return {
    allowedPaths: ['runtime_data/proofs', 'runtime_data/artifacts', 'runtime_data/reports', 'logs'],
    prohibitedActions: ['do not delete user media', 'do not delete tools/mpv/', 'do not delete tools/ffmpeg/', 'do not kill arbitrary Node/mpv/system processes'],
    expectedArtifacts: [
      'pre-restart marker JSON',
      'post-restart resume proof JSON',
      'native playback/recovery/scheduler evidence ZIPs',
      'sanitized summary file with PASS/BLOCKED/FAILED result',
    ],
  };
}

/** Builds the reboot/restart preflight proof envelope. */
export async function buildWindowsRebootRecoveryPreflightProof({ repoRoot, metadata }) {
  const requiredFiles = checkRequiredFiles(repoRoot);
  const packageScripts = checkPackageScripts(repoRoot);
  const localToolBoundaries = checkLocalToolBoundaries(repoRoot);
  const trackedLocalTools = await checkTrackedLocalTools(repoRoot);
  const nonClaims = buildWindowsRebootRecoveryNonClaims();
  const noTaskSchedulerRuntime = nonClaims.some((entry) => entry.includes('not part of PF_login project scope')) && nonClaims.some((entry) => entry.includes('does not use schtasks.exe'));
  const passed = requiredFiles.passed
    && packageScripts.passed
    && localToolBoundaries.toolsMpvIgnored
    && localToolBoundaries.toolsFfmpegIgnored
    && trackedLocalTools.passed
    && noTaskSchedulerRuntime;
  return createProofEnvelope({
    proofKind: 'windows_reboot_recovery_preflight',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: passed ? 'PASSED' : 'FAILED',
    runtimeMode: 'documentation_preflight_no_reboot',
    evidence: sanitizeEvidence({
      plan: buildWindowsRebootRecoveryPreflightPlan(),
      requiredFiles,
      packageScripts,
      localToolBoundaries,
      trackedLocalTools,
      cleanupContract: buildCleanupContract(),
      nonClaims,
    }),
    knownLimitations: [
      'This proof does not reboot Windows.',
      'This proof does not prove full Windows reboot recovery.',
      'This proof does not use or require Windows Task Scheduler.',
      'A later manual target-machine proof must produce the actual before/after restart evidence.',
    ],
  });
}
