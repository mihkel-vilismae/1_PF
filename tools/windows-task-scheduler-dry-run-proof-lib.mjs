/**
 * Windows Task Scheduler dry-run proof library for PF_login.
 * Defines a safe contract for future Windows Task Scheduler installation without creating tasks.
 * Verifies command shape, repo-local paths, cleanup commands, and non-claim boundaries.
 * Keeps tools/mpv and tools/ffmpeg local-only ignored directories out of task definitions.
 * Produces sanitized proof evidence that distinguishes dry-run inspection from live scheduled execution.
 */
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';

const PROOF_KIND = 'windows_task_scheduler_dry_run';
const SCHEDULER_PROOF_BASE_URL = 'http://127.0.0.1:4301';
const TASK_FOLDER = '\\PF_login_Proof';
const WORKERS = Object.freeze([
  { key: 'regular_worker', label: 'Regular worker', cadence: 'PT1M', entrypoint: join('tools', 'CronEmulator', 'entrypoints', 'regular_stage_worker.ps1') },
  { key: 'playback_worker', label: 'Playback worker', cadence: 'PT30S', entrypoint: join('tools', 'CronEmulator', 'entrypoints', 'playback_worker.ps1') },
  { key: 'screen_on_off_worker', label: 'Screen on/off worker', cadence: 'PT2M', entrypoint: join('tools', 'CronEmulator', 'entrypoints', 'screen_on_off_worker.ps1') },
]);

/** Returns the stable proof kind used for artifact names and docs. */
export function getWindowsTaskSchedulerDryRunProofKind() {
  return PROOF_KIND;
}

/** Converts a relative repo path to a Windows-style path for human-readable dry-run evidence. */
function toWindowsPath(pathValue) {
  return String(pathValue).replaceAll('/', '\\');
}

/** Builds one Task Scheduler dry-run task definition without installing it. */
export function buildWindowsTaskSchedulerDryRunTask({ repoRoot, worker }) {
  const entrypointAbsolutePath = join(repoRoot, worker.entrypoint);
  const taskName = `${TASK_FOLDER}\\${worker.key}`;
  const actionExecutable = 'powershell.exe';
  const actionArguments = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', entrypointAbsolutePath];
  const environment = {
    PF_BACKEND_URL: SCHEDULER_PROOF_BASE_URL,
    PF_TASK_SCHEDULER_PROOF_MODE: 'dry-run-inspection',
  };
  return {
    worker: worker.key,
    label: worker.label,
    taskName,
    cadence: worker.cadence,
    entrypointRelativePath: toWindowsPath(worker.entrypoint),
    entrypointExists: existsSync(entrypointAbsolutePath),
    workingDirectory: repoRoot,
    action: {
      executable: actionExecutable,
      arguments: actionArguments,
    },
    environment,
    createCommandPreview: [
      'schtasks.exe',
      '/Create',
      '/TN',
      taskName,
      '/SC',
      worker.cadence === 'PT30S' ? 'MINUTE' : 'MINUTE',
      '/MO',
      worker.cadence === 'PT2M' ? '2' : '1',
      '/TR',
      `${actionExecutable} ${actionArguments.map((part) => `"${part}"`).join(' ')}`,
      '/F',
    ],
    cleanupCommandPreview: ['schtasks.exe', '/Delete', '/TN', taskName, '/F'],
    installed: false,
    dryRunOnly: true,
  };
}

/** Builds the complete dry-run contract for the three Windows scheduler worker tasks. */
export function buildWindowsTaskSchedulerDryRunContract({ repoRoot }) {
  return {
    schedulerMode: 'windows-task-scheduler-dry-run-inspection',
    proofScope: 'dry-run only; no schtasks command is executed and no persistent scheduled task is installed',
    taskFolder: TASK_FOLDER,
    workers: WORKERS.map((worker) => buildWindowsTaskSchedulerDryRunTask({ repoRoot, worker })),
    cleanupPolicy: {
      proofOwnedOnly: true,
      cleanupCommandsArePreviewOnly: true,
      notes: ['Future real-install proof must delete only tasks under the PF_login proof task folder.'],
    },
    localToolBoundary: {
      mpv: 'tools/mpv is intentionally local-only and ignored; no Task Scheduler task may vendor or track it.',
      ffmpeg: 'tools/ffmpeg is intentionally local-only and ignored; no Task Scheduler task may vendor or track it.',
    },
    nonClaims: [
      'Does not install Windows Task Scheduler tasks.',
      'Does not prove Windows Task Scheduler runtime execution.',
      'Does not prove Windows reboot recovery.',
      'Does not prove Raspberry cron, reboot, or power-loss recovery.',
      'Does not vendor tools/mpv or tools/ffmpeg.',
    ],
  };
}

/** Validates the dry-run contract without creating scheduled tasks. */
export function validateWindowsTaskSchedulerDryRunContract(contract) {
  const checks = [];
  const workers = contract?.workers ?? [];
  checks.push({ key: 'three_worker_tasks_defined', passed: workers.length === 3, detail: workers.map((worker) => worker.worker).join(', ') });
  for (const worker of workers) {
    checks.push({ key: `${worker.worker}_entrypoint_exists`, passed: Boolean(worker.entrypointExists), detail: worker.entrypointRelativePath });
    checks.push({ key: `${worker.worker}_uses_powershell`, passed: worker.action?.executable === 'powershell.exe', detail: worker.action?.executable ?? null });
    checks.push({ key: `${worker.worker}_is_dry_run`, passed: worker.installed === false && worker.dryRunOnly === true, detail: worker.taskName });
    checks.push({ key: `${worker.worker}_cleanup_preview_only`, passed: Array.isArray(worker.cleanupCommandPreview) && worker.cleanupCommandPreview.includes('/Delete'), detail: worker.cleanupCommandPreview?.join(' ') ?? null });
    checks.push({ key: `${worker.worker}_uses_proof_backend_url`, passed: worker.environment?.PF_BACKEND_URL === SCHEDULER_PROOF_BASE_URL, detail: worker.environment?.PF_BACKEND_URL ?? null });
  }
  const serializedTaskDefinitions = JSON.stringify(contract.workers ?? []);
  checks.push({ key: 'no_mpv_or_ffmpeg_task_paths', passed: !/tools[\\/]mpv|tools[\\/]ffmpeg/i.test(serializedTaskDefinitions), detail: 'Task definitions must not reference local-only media tool bundles.' });
  checks.push({ key: 'non_claims_include_no_install', passed: contract.nonClaims?.some((claim) => /does not install/i.test(claim)) === true, detail: contract.nonClaims?.join(' | ') ?? null });
  checks.push({ key: 'cleanup_is_proof_owned_only', passed: contract.cleanupPolicy?.proofOwnedOnly === true, detail: JSON.stringify(contract.cleanupPolicy ?? {}) });
  return { checks, passed: checks.every((check) => check.passed) };
}

/** Creates the dry-run proof envelope from contract validation evidence. */
export function runWindowsTaskSchedulerDryRunProof({ repoRoot, metadata }) {
  const contract = buildWindowsTaskSchedulerDryRunContract({ repoRoot });
  const validation = validateWindowsTaskSchedulerDryRunContract(contract);
  return createProofEnvelope({
    proofKind: PROOF_KIND,
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: validation.passed ? 'PASSED' : 'FAILED',
    runtimeMode: 'windows_task_scheduler_dry_run_inspection',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      repoRoot: relative(repoRoot, repoRoot) || '.',
      contract,
      validation,
    }),
    knownLimitations: [
      'Dry-run inspection only; no Windows Task Scheduler task was installed.',
      'Does not prove Windows Task Scheduler runtime execution.',
      'Does not prove Windows reboot, Raspberry cron, Raspberry reboot, or power-loss recovery.',
    ],
  });
}
