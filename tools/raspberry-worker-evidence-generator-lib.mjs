/**
 * Raspberry worker evidence generator.
 *
 * Produces the PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE consumed by
 * proof:raspberry-cron-worker-runtime, without inventing missing worker facts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';
import { RASPBERRY_CRON_WORKER_LANES, evaluateCronRows, parseCrontabRows, evaluateWorkerEvidence } from './raspberry-cron-worker-runtime-proof-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

export const WORKER_EVIDENCE_STATUS_FILES = Object.freeze({
  regular_stage_worker: 'regular-stage-worker-status.json',
  playback_worker: 'playback-worker-status.json',
  screen_on_off_worker: 'screen-on-off-worker-status.json',
});

export const WORKER_EVIDENCE_LOCK_FILES = Object.freeze({
  regular_stage_worker: 'regular-stage-worker-lock.json',
  playback_worker: 'playback-worker-lock.json',
  screen_on_off_worker: 'screen-on-off-worker-lock.json',
});

export function readJsonIfPresent(path) {
  if (!existsSync(path)) return { exists: false, data: null, error: null };
  try {
    return { exists: true, data: JSON.parse(readFileSync(path, 'utf8')), error: null };
  } catch (error) {
    return { exists: true, data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function buildWorkerLaneEvidenceFromStatus({ lane, statusRead, lockRead }) {
  const status = statusRead.data ?? {};
  const lock = lockRead.data ?? {};
  const lastInvocationAt = firstString(status.last_invocation_at, status.lastInvocationAt, status.finishedAt, status.finished_at, status.updatedAt, status.updated_at, status.startedAt, status.started_at, status.timestamp);
  const singleton = status.same_worker_singleton ?? status.sameWorkerSingleton ?? {};
  const staleLock = status.stale_lock ?? status.staleLock ?? {};
  const crossWorkerIndependence = status.cross_worker_independence ?? status.crossWorkerIndependence;
  return {
    name: lane.name,
    source_files: {
      status_file: statusRead.path,
      status_file_exists: statusRead.exists,
      status_file_error: statusRead.error,
      lock_file: lockRead.path,
      lock_file_exists: lockRead.exists,
      lock_file_error: lockRead.error,
    },
    invocation_observed: Boolean(lastInvocationAt || status.invocation_observed === true),
    last_invocation_at: lastInvocationAt,
    same_worker_singleton: {
      first_acquired: singleton.first_acquired === true || singleton.firstAcquired === true,
      duplicate_skipped: singleton.duplicate_skipped === true || singleton.duplicateSkipped === true,
      source: singleton.source ?? 'worker-status-file',
    },
    cross_worker_independence: crossWorkerIndependence === true,
    stale_lock: {
      reclaimed: staleLock.reclaimed === true || staleLock.reclaimed_after_dirty_shutdown === true || staleLock.reclaimedAfterDirtyShutdown === true,
      source: staleLock.source ?? (lockRead.exists ? 'lock-file-and-status-file' : 'worker-status-file'),
      current_lock_present: lockRead.exists,
      current_lock_owner: firstString(lock.owner, lock.workerId, lock.worker_id, lock.pid),
    },
  };
}

export function collectWorkerEvidenceFromRuntimeFiles({ runtimeDirectory = join(repoRoot, 'runtime_data', 'scheduler') } = {}) {
  const worker_lanes = RASPBERRY_CRON_WORKER_LANES.map((lane) => {
    const statusPath = join(runtimeDirectory, WORKER_EVIDENCE_STATUS_FILES[lane.name]);
    const lockPath = join(runtimeDirectory, WORKER_EVIDENCE_LOCK_FILES[lane.name]);
    return buildWorkerLaneEvidenceFromStatus({
      lane,
      statusRead: { ...readJsonIfPresent(statusPath), path: statusPath },
      lockRead: { ...readJsonIfPresent(lockPath), path: lockPath },
    });
  });
  return { generated_at: new Date().toISOString(), runtime_directory: runtimeDirectory, worker_lanes };
}

export async function readSystemCrontabForEvidence() {
  const result = await runCommand('crontab', ['-l'], { timeoutMs: 10000, detached: false, sanitize: false });
  return { available: result.exitCode === 0, result, rows: parseCrontabRows(result.stdout) };
}

export function evaluateGeneratedEvidence({ target, crontab, generatedEvidence }) {
  const cronRows = evaluateCronRows(crontab.rows ?? []);
  const workerCompleteness = evaluateWorkerEvidence({ data: generatedEvidence });
  const blockReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (!crontab.available) blockReasons.push('crontab is unavailable or could not be read');
  const missingRows = cronRows.filter((row) => !row.present).map((row) => row.name);
  if (missingRows.length) blockReasons.push(`missing managed cron rows for: ${missingRows.join(', ')}`);
  const incompleteWorkers = workerCompleteness.filter((worker) => !worker.complete).map((worker) => worker.name);
  if (incompleteWorkers.length) blockReasons.push(`worker evidence is incomplete for: ${incompleteWorkers.join(', ')}`);
  return {
    proofStatus: blockReasons.length ? 'BLOCKED' : 'PASSED',
    blockReasons,
    cronRows,
    workerCompleteness,
    missingRows,
    incompleteWorkers,
  };
}

export async function writeWorkerEvidenceFile(generatedEvidence, { outputDirectory = join(repoRoot, 'runtime_data', 'raspberry_worker_evidence') } = {}) {
  await mkdir(outputDirectory, { recursive: true });
  const timestamp = String(generatedEvidence.generated_at ?? new Date().toISOString()).replace(/[:.]/g, '-');
  const outputPath = join(outputDirectory, `raspberry_cron_worker_evidence_${timestamp}.json`);
  await writeFile(outputPath, `${JSON.stringify(sanitizeEvidence(generatedEvidence), null, 2)}\n`, 'utf8');
  return outputPath;
}

export async function buildRaspberryWorkerEvidenceGeneratorProof({ metadata, env = process.env, runtimeDirectory, generatedEvidence = null, currentCrontab = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const crontab = currentCrontab === null ? await readSystemCrontabForEvidence() : { available: true, result: null, rows: parseCrontabRows(currentCrontab) };
  const evidence = generatedEvidence ?? collectWorkerEvidenceFromRuntimeFiles({ runtimeDirectory });
  const evidenceFile = await writeWorkerEvidenceFile(evidence);
  const evaluation = evaluateGeneratedEvidence({ target, crontab, generatedEvidence: evidence });
  return createProofEnvelope({
    proofKind: 'raspberry_worker_evidence_generator',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: 'raspberry_worker_evidence_generation',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      generated_evidence_file: evidenceFile,
      generated_evidence_env: `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE=${evidenceFile}`,
      expected_worker_lanes: RASPBERRY_CRON_WORKER_LANES,
      cron: { available: crontab.available, rows: crontab.rows, row_evidence: evaluation.cronRows, command_result: crontab.result },
      worker_evidence_preview: evidence.worker_lanes,
      worker_completeness: evaluation.workerCompleteness,
      status_reasons: evaluation,
      pass_criteria: 'PASSED only when Raspberry target, managed cron rows, and complete worker status evidence exist for all three lanes. Incomplete evidence stays BLOCKED and is not fabricated.',
      non_claims: ['does not invoke destructive worker actions', 'does not install cron', 'does not reboot the Raspberry', 'does not perform physical power-loss recovery', 'does not fake missing regular/screen worker evidence'],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED'
      ? ['The generated file can be used as PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE for the cron worker runtime proof.']
      : ['Generated evidence file was written, but it is incomplete or off-target; proof:raspberry-cron-worker-runtime should remain blocked or fail until real worker evidence exists.'],
  });
}
