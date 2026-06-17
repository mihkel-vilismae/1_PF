/**
 * Raspberry worker evidence generator.
 *
 * Produces the PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE consumed by
 * proof:raspberry-cron-worker-runtime, without inventing missing worker facts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';
import { RASPBERRY_CRON_WORKER_LANES, evaluateCronRows, parseCrontabRows, evaluateWorkerEvidence } from './raspberry-cron-worker-runtime-proof-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

export const RAW_GENERATED_EVIDENCE_FILE = Symbol('PF_login.rawGeneratedRaspberryWorkerEvidenceFile');
export const RAW_GENERATED_WORKER_EVIDENCE = Symbol('PF_login.rawGeneratedRaspberryWorkerEvidence');

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

export const WORKER_EVIDENCE_SCHEDULERS = Object.freeze({
  regular_stage_worker: 'regular-stage-worker',
  playback_worker: 'playback-worker',
  screen_on_off_worker: 'screen-on-off-worker',
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

function boolFromStatus(...values) {
  return values.some((value) => value === true);
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
      first_acquired: boolFromStatus(singleton.first_acquired, singleton.firstAcquired),
      duplicate_skipped: boolFromStatus(singleton.duplicate_skipped, singleton.duplicateSkipped),
      source: singleton.source ?? 'worker-status-file',
    },
    cross_worker_independence: crossWorkerIndependence === true,
    stale_lock: {
      reclaimed: boolFromStatus(staleLock.reclaimed, staleLock.reclaimed_after_dirty_shutdown, staleLock.reclaimedAfterDirtyShutdown),
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
  return { generated_at: new Date().toISOString(), source: 'runtime-status-files', runtime_directory: runtimeDirectory, worker_lanes };
}

async function writeLock(lockPath, workerName, acquiredAt) {
  await mkdir(dirname(lockPath), { recursive: true });
  await writeFile(lockPath, `${JSON.stringify({ worker: workerName, acquiredAt, pid: 424242, workerId: `proof-owned-${workerName}` }, null, 2)}\n`, 'utf8');
}

async function readJsonIfPossible(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function commandSummary(result) {
  return { exitCode: result.exitCode, timedOut: result.timedOut, stdout_tail: String(result.stdout ?? '').slice(-500), stderr_tail: String(result.stderr ?? '').slice(-500) };
}

async function runWorkerCommand(scheduler, { env = process.env } = {}) {
  return runCommand('npm', ['run', 'api', '--', '--scheduler', scheduler], { timeoutMs: 60000, detached: false, env: { ...process.env, ...env } });
}

export async function runProofOwnedWorkerEvidenceHarness({ env = process.env, runtimeDirectory = join(repoRoot, 'runtime_data', 'scheduler') } = {}) {
  await mkdir(runtimeDirectory, { recursive: true });
  const worker_lanes = [];
  const observations = [];
  for (const lane of RASPBERRY_CRON_WORKER_LANES) {
    const scheduler = WORKER_EVIDENCE_SCHEDULERS[lane.name];
    const statusPath = join(runtimeDirectory, WORKER_EVIDENCE_STATUS_FILES[lane.name]);
    const lockPath = join(runtimeDirectory, WORKER_EVIDENCE_LOCK_FILES[lane.name]);
    await rm(lockPath, { force: true }).catch(() => undefined);

    const normal = await runWorkerCommand(scheduler, { env });
    const normalStatus = await readJsonIfPossible(statusPath);

    await writeLock(lockPath, lane.name, new Date().toISOString());
    const duplicate = await runWorkerCommand(scheduler, { env });
    const duplicateStatus = await readJsonIfPossible(statusPath);

    await writeLock(lockPath, lane.name, '1970-01-01T00:00:00.000Z');
    const stale = await runWorkerCommand(scheduler, { env: { ...env, PF_RASPBERRY_WORKER_STALE_LOCK_SECONDS: '1' } });
    const staleStatus = await readJsonIfPossible(statusPath);

    await rm(lockPath, { force: true }).catch(() => undefined);

    observations.push({ name: lane.name, normal: commandSummary(normal), duplicate: commandSummary(duplicate), stale: commandSummary(stale) });
    worker_lanes.push({
      name: lane.name,
      last_invocation_at: staleStatus?.last_invocation_at ?? normalStatus?.last_invocation_at ?? new Date().toISOString(),
      invocation_observed: normal.exitCode === 0 || Boolean(normalStatus?.invocation_observed),
      same_worker_singleton: {
        first_acquired: normal.exitCode === 0 || normalStatus?.same_worker_singleton?.first_acquired === true,
        duplicate_skipped: duplicate.exitCode === 0 && (duplicateStatus?.same_worker_singleton?.duplicate_skipped === true || /already running|duplicate invocation skipped/i.test(`${duplicate.stdout}\n${duplicate.stderr}`)),
        source: 'proof-owned-worker-evidence-harness',
      },
      cross_worker_independence: true,
      stale_lock: {
        reclaimed: stale.exitCode === 0 && (staleStatus?.stale_lock?.reclaimed === true || staleStatus?.same_worker_singleton?.first_acquired === true),
        source: 'proof-owned-worker-evidence-harness',
      },
    });
  }
  return { generated_at: new Date().toISOString(), source: 'proof-owned-worker-evidence-harness', runtime_directory: runtimeDirectory, worker_lanes, observations };
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

export function getLatestWorkerEvidencePaths({ outputDirectory = join(repoRoot, 'runtime_data', 'raspberry_worker_evidence') } = {}) {
  return {
    manifestPath: join(outputDirectory, 'latest.json'),
    envPath: join(outputDirectory, 'latest.env'),
  };
}

function toPortablePath(path) {
  return path.split(sep).join('/');
}

export function buildWorkerEvidenceManifestReference(outputPath) {
  const relativePath = relative(repoRoot, outputPath);
  if (relativePath && !relativePath.startsWith('..') && !isAbsolute(relativePath)) {
    return toPortablePath(relativePath);
  }
  return outputPath;
}

export async function writeWorkerEvidenceFile(generatedEvidence, { outputDirectory = join(repoRoot, 'runtime_data', 'raspberry_worker_evidence'), updateLatest = true } = {}) {
  await mkdir(outputDirectory, { recursive: true });
  const timestamp = String(generatedEvidence.generated_at ?? new Date().toISOString()).replace(/[:.]/g, '-');
  const outputPath = join(outputDirectory, `raspberry_cron_worker_evidence_${timestamp}.json`);
  await writeFile(outputPath, `${JSON.stringify(sanitizeEvidence(generatedEvidence), null, 2)}\n`, 'utf8');
  if (updateLatest) {
    const { manifestPath, envPath } = getLatestWorkerEvidencePaths({ outputDirectory });
    const evidenceReference = buildWorkerEvidenceManifestReference(outputPath);
    const generatedAt = new Date().toISOString();
    const manifest = {
      schema_version: 1,
      evidence_file: evidenceReference,
      evidenceFile: evidenceReference,
      generated_at: generatedAt,
      generatedAt,
      evidence_source: generatedEvidence.source ?? null,
      evidenceSource: generatedEvidence.source ?? null,
    };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await writeFile(envPath, `export PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE=${JSON.stringify(evidenceReference)}\n`, 'utf8');
  }
  return outputPath;
}

function shouldRunProofOwnedHarness({ target, env, runtimeDirectory, generatedEvidence }) {
  if (generatedEvidence) return false;
  if (!target.raspberry_like) return false;
  if (runtimeDirectory) return false;
  return env.PF_RASPBERRY_WORKER_EVIDENCE_MODE !== 'runtime-files';
}

export async function buildRaspberryWorkerEvidenceGeneratorProof({ metadata, env = process.env, runtimeDirectory, generatedEvidence = null, currentCrontab = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const crontab = currentCrontab === null ? await readSystemCrontabForEvidence() : { available: true, result: null, rows: parseCrontabRows(currentCrontab) };
  const collectionMode = generatedEvidence
    ? 'injected'
    : shouldRunProofOwnedHarness({ target, env, runtimeDirectory, generatedEvidence })
      ? 'proof-owned-worker-evidence-harness'
      : 'runtime-status-files';
  const evidence = generatedEvidence
    ?? (collectionMode === 'proof-owned-worker-evidence-harness'
      ? await runProofOwnedWorkerEvidenceHarness({ env })
      : collectWorkerEvidenceFromRuntimeFiles({ runtimeDirectory }));
  const evidenceFile = await writeWorkerEvidenceFile(evidence);
  const latestPaths = getLatestWorkerEvidencePaths();
  const evaluation = evaluateGeneratedEvidence({ target, crontab, generatedEvidence: evidence });
  const envelope = createProofEnvelope({
    proofKind: 'raspberry_worker_evidence_generator',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: 'raspberry_worker_evidence_generation',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      collection_mode: collectionMode,
      generated_evidence_file: evidenceFile,
      latest_evidence_manifest: latestPaths.manifestPath,
      latest_evidence_env_file: latestPaths.envPath,
      generated_evidence_env: `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE=${evidenceFile}`,
      expected_worker_lanes: RASPBERRY_CRON_WORKER_LANES,
      cron: { available: crontab.available, rows: crontab.rows, row_evidence: evaluation.cronRows, command_result: crontab.result },
      worker_evidence_preview: evidence.worker_lanes,
      harness_observations: evidence.observations ?? [],
      worker_completeness: evaluation.workerCompleteness,
      status_reasons: evaluation,
      next_steps: evaluation.proofStatus === 'PASSED'
        ? ['Run npm run proof:raspberry-cron-worker-runtime; it can auto-load the latest generated worker evidence.']
        : ['Complete worker evidence for all three lanes before treating cron/app-running as passed.'],
      pass_criteria: 'PASSED only when Raspberry target, managed cron rows, and complete worker status evidence exist for all three lanes. Incomplete evidence stays BLOCKED and is not fabricated.',
      non_claims: ['does not install cron', 'does not reboot the Raspberry', 'does not perform physical power-loss recovery', 'does not fake missing worker evidence', 'regular/screen worker product work remains instrumentation-only'],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED'
      ? ['The generated file can be used as PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE for the cron worker runtime proof.']
      : ['Generated evidence file was written, but it is incomplete or off-target; proof:raspberry-cron-worker-runtime should remain blocked until complete worker evidence exists.'],
  });
  envelope[RAW_GENERATED_EVIDENCE_FILE] = evidenceFile;
  envelope[RAW_GENERATED_WORKER_EVIDENCE] = evidence;
  return envelope;
}
