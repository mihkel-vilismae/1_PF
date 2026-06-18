/**
 * Windows CronEmulator proof library.
 * Verifies the emulator's local scheduling/tooling boundary without claiming Raspberry hardware proof.
 * Inspects CronEmulator files, entrypoints, duplicate-run protection, and deterministic pytest results.
 * Builds sanitized proof envelopes under the standard runtime_data/proofs location.
 * Keeps Windows emulator evidence separate from production boot or Raspberry recovery claims.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';

const CRON_ROOT = 'tools/CronEmulator';
const REQUIRED_FILES = [
  'tools/CronEmulator/crontab_emulated.example.txt',
  'tools/CronEmulator/entrypoints/regular_stage_worker.ps1',
  'tools/CronEmulator/entrypoints/playback_worker.ps1',
  'tools/CronEmulator/entrypoints/screen_on_off_worker.ps1',
  'tools/CronEmulator/src/cronemulator/cron_parser.py',
  'tools/CronEmulator/src/cronemulator/scheduler.py',
  'tools/CronEmulator/src/cronemulator/executor.py',
  'tools/CronEmulator/src/cronemulator/state.py',
  'tools/CronEmulator/tests/test_cron_parser.py',
  'tools/CronEmulator/tests/test_scheduler.py',
  'tools/CronEmulator/tests/test_executor.py',
  'tools/CronEmulator/tests/test_state.py'
];

const EXPECTED_ENTRYPOINTS = [
  'regular_stage_worker.ps1',
  'playback_worker.ps1',
  'screen_on_off_worker.ps1'
];

/** Reads a repository file as UTF-8 text. */
async function readRepoFile(repoRoot, relativePath) {
  return readFile(join(repoRoot, relativePath), 'utf8');
}

/** Checks whether all required CronEmulator files exist. */
export function verifyRequiredCronEmulatorFiles(repoRoot) {
  const checks = REQUIRED_FILES.map((relativePath) => ({ relativePath, exists: existsSync(join(repoRoot, relativePath)) }));
  return { checks, missing: checks.filter((entry) => !entry.exists).map((entry) => entry.relativePath) };
}

/** Inspects the example crontab for the expected Windows worker entrypoints. */
export async function inspectCronEmulatorCrontab(repoRoot) {
  const crontabText = await readRepoFile(repoRoot, 'tools/CronEmulator/crontab_emulated.example.txt');
  const entrypointChecks = EXPECTED_ENTRYPOINTS.map((entrypoint) => ({ entrypoint, referenced: crontabText.includes(entrypoint) }));
  const activeRows = crontabText.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
  return { activeRows, entrypointChecks, allEntrypointsReferenced: entrypointChecks.every((entry) => entry.referenced) };
}

/** Inspects SchedulerLoop source for duplicate-run protection semantics. */
export async function inspectSchedulerDuplicateProtection(repoRoot) {
  const schedulerSource = await readRepoFile(repoRoot, 'tools/CronEmulator/src/cronemulator/scheduler.py');
  const checks = {
    tracks_running_job_ids: schedulerSource.includes('_running_job_ids'),
    tracks_last_run_keys: schedulerSource.includes('_last_run_keys'),
    protects_with_lock: schedulerSource.includes('with self._lock'),
    skips_duplicate_active_job: schedulerSource.includes('job.id in self._running_job_ids'),
    skips_same_minute_duplicate: schedulerSource.includes('run_key in self._last_run_keys'),
    removes_running_job_in_finally: schedulerSource.includes('finally') && schedulerSource.includes('discard(job.id)')
  };
  return { checks, passed: Object.values(checks).every(Boolean) };
}

/** Inspects executor source for bounded command execution behavior. */
export async function inspectCronExecutorBoundary(repoRoot) {
  const executorSource = await readRepoFile(repoRoot, 'tools/CronEmulator/src/cronemulator/executor.py');
  const checks = {
    uses_single_execution_boundary: executorSource.includes('def run_command('),
    captures_stdout_stderr: executorSource.includes('capture_output=True'),
    has_timeout: executorSource.includes('timeout=timeout_seconds'),
    returns_timeout_status: executorSource.includes('status="timeout"'),
    documents_shell_boundary: executorSource.includes('shell=True') && executorSource.includes('only place that runs')
  };
  return { checks, passed: Object.values(checks).every(Boolean) };
}

/** Runs CronEmulator's Python tests and returns sanitized command evidence. */
export async function runCronEmulatorPytest(repoRoot) {
  const python = process.platform === 'win32' ? 'python' : 'python3';
  const result = await runCommand(python, ['-m', 'pytest', 'tools/CronEmulator/tests'], { cwd: repoRoot, timeoutMs: 120000 });
  if (result.exitCode === 0 && !result.timedOut) return { status: 'PASSED', result };
  if (result.timedOut) return { status: 'TIMED_OUT', result };
  const output = `${result.stdout ?? ''}
${result.stderr ?? ''}`;
  if (/No module named pytest|pytest: not found|No module named pytest/i.test(output)) return { status: 'BLOCKED', result, blockReason: 'pytest is not installed on this target' };
  return { status: 'FAILED', result };
}

/** Builds a deterministic Windows CronEmulator proof envelope. */
export async function buildWindowsCronEmulatorProof({ repoRoot, metadata, runPytest = true }) {
  const files = verifyRequiredCronEmulatorFiles(repoRoot);
  const crontab = files.missing.length === 0 ? await inspectCronEmulatorCrontab(repoRoot) : { activeRows: [], entrypointChecks: [], allEntrypointsReferenced: false };
  const scheduler = files.missing.length === 0 ? await inspectSchedulerDuplicateProtection(repoRoot) : { checks: {}, passed: false };
  const executor = files.missing.length === 0 ? await inspectCronExecutorBoundary(repoRoot) : { checks: {}, passed: false };
  const pytest = runPytest ? await runCronEmulatorPytest(repoRoot) : { status: 'BLOCKED', result: { skipped: true, reason: 'runPytest=false' }, blockReason: 'pytest execution disabled by caller' };
  const staticChecksPassed = crontab.allEntrypointsReferenced && scheduler.passed && executor.passed;
  const proofStatus = files.missing.length > 0 ? 'FAILED'
    : pytest.status === 'TIMED_OUT' ? 'TIMED_OUT'
    : staticChecksPassed && pytest.status === 'PASSED' ? 'PASSED'
    : staticChecksPassed && pytest.status === 'BLOCKED' ? 'BLOCKED'
    : 'FAILED';

  return createProofEnvelope({
    proofKind: 'windows_cronemulator',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'windows_emulator',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      cronemulator_root: CRON_ROOT,
      required_files: files,
      crontab,
      scheduler_duplicate_run_protection: scheduler,
      executor_boundary: executor,
      python_tests: pytest,
      block_reasons: proofStatus === 'BLOCKED' ? [pytest.blockReason ?? 'CronEmulator pytest run is blocked'] : [],
      separation_from_hardware_proof: {
        raspberry_power_loss_proven: false,
        windows_cronemulator_is_hardware_proof: false,
        intended_claim: 'Proves Windows emulator parsing/scheduling/execution boundaries only.'
      }
    }),
    knownLimitations: [
      'This proof does not prove Raspberry hardware power-loss recovery.',
      'This proof does not install Windows Task Scheduler entries or system services.',
      'This proof does not execute real iCloudPD provider downloads.',
      'This proof validates CronEmulator local behavior and duplicate-run protection only.'
    ]
  });
}
