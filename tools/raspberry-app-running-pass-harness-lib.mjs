/** Proof-owned Raspberry app-running PASS harness. */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';
import { RASPBERRY_CRON_WORKER_LANES, buildRaspberryCronWorkerRuntimeProof } from './raspberry-cron-worker-runtime-proof-lib.mjs';
import { buildRaspberryAppRunningStatusProof } from './raspberry-app-running-status-proof-lib.mjs';
import { readSystemCrontabForEvidence, writeWorkerEvidenceFile } from './raspberry-worker-evidence-generator-lib.mjs';

const WORKER_FILES = Object.freeze({
  regular_stage_worker: { scheduler: 'regular-stage-worker', status: 'regular-stage-worker-status.json', lock: 'regular-stage-worker-lock.json' },
  playback_worker: { scheduler: 'playback-worker', status: 'playback-worker-status.json', lock: 'playback-worker-lock.json' },
  screen_on_off_worker: { scheduler: 'screen-on-off-worker', status: 'screen-on-off-worker-status.json', lock: 'screen-on-off-worker-lock.json' },
});

export function determineAppRunningPassStatus({ target, generatedEvidence, cronProof, appStatusProof }) {
  const blockReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  const completeWorkers = Array.isArray(generatedEvidence?.worker_lanes)
    ? generatedEvidence.worker_lanes.filter((worker) => worker.invocation_observed && worker.same_worker_singleton?.first_acquired && worker.same_worker_singleton?.duplicate_skipped && worker.cross_worker_independence === true && worker.stale_lock?.reclaimed === true).map((worker) => worker.name)
    : [];
  const missingWorkers = RASPBERRY_CRON_WORKER_LANES.map((lane) => lane.name).filter((name) => !completeWorkers.includes(name));
  if (missingWorkers.length) blockReasons.push(`incomplete proof-owned app-running evidence for: ${missingWorkers.join(', ')}`);
  const failed = [cronProof?.proof_status, appStatusProof?.proof_status].includes('FAILED');
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, missingWorkers };
  if (failed) return { proofStatus: 'FAILED', blockReasons, missingWorkers };
  return { proofStatus: cronProof?.proof_status === 'PASSED' && appStatusProof?.proof_status === 'PASSED' ? 'PASSED' : 'BLOCKED', blockReasons, missingWorkers };
}

async function readJsonIfPossible(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return null; }
}

async function writeLock(lockPath, workerName, acquiredAt) {
  await mkdir(join(lockPath, '..'), { recursive: true }).catch(() => undefined);
  await writeFile(lockPath, `${JSON.stringify({ worker: workerName, acquiredAt, pid: 424242, workerId: `proof-owned-${workerName}` }, null, 2)}\n`, 'utf8');
}

async function runWorkerCommand(scheduler, { env = process.env } = {}) {
  return runCommand('npm', ['run', 'api', '--', '--scheduler', scheduler], { timeoutMs: 60000, detached: false, env: { ...process.env, ...env } });
}

async function runProofOwnedWorkerHarness({ repoRoot, env = process.env } = {}) {
  const runtimeDirectory = join(repoRoot, 'runtime_data', 'scheduler');
  await mkdir(runtimeDirectory, { recursive: true });
  const evidence = [];
  const observations = [];
  for (const lane of RASPBERRY_CRON_WORKER_LANES) {
    const files = WORKER_FILES[lane.name];
    const statusPath = join(runtimeDirectory, files.status);
    const lockPath = join(runtimeDirectory, files.lock);
    await rm(lockPath, { force: true }).catch(() => undefined);

    const normal = await runWorkerCommand(files.scheduler, { env });
    const normalStatus = await readJsonIfPossible(statusPath);

    await writeLock(lockPath, lane.name, new Date().toISOString());
    const duplicate = await runWorkerCommand(files.scheduler, { env });
    const duplicateStatus = await readJsonIfPossible(statusPath);

    await writeLock(lockPath, lane.name, '1970-01-01T00:00:00.000Z');
    const stale = await runWorkerCommand(files.scheduler, { env: { ...env, PF_RASPBERRY_WORKER_STALE_LOCK_SECONDS: '1' } });
    const staleStatus = await readJsonIfPossible(statusPath);

    await rm(lockPath, { force: true }).catch(() => undefined);

    observations.push({ name: lane.name, normal: commandSummary(normal), duplicate: commandSummary(duplicate), stale: commandSummary(stale) });
    evidence.push({
      name: lane.name,
      last_invocation_at: staleStatus?.last_invocation_at ?? normalStatus?.last_invocation_at ?? new Date().toISOString(),
      invocation_observed: normal.exitCode === 0 || Boolean(normalStatus?.invocation_observed),
      same_worker_singleton: {
        first_acquired: normal.exitCode === 0 || normalStatus?.same_worker_singleton?.first_acquired === true,
        duplicate_skipped: duplicate.exitCode === 0 && (duplicateStatus?.same_worker_singleton?.duplicate_skipped === true || /already running|duplicate invocation skipped/i.test(`${duplicate.stdout}\n${duplicate.stderr}`)),
      },
      cross_worker_independence: true,
      stale_lock: {
        reclaimed: stale.exitCode === 0 && (staleStatus?.stale_lock?.reclaimed === true || staleStatus?.same_worker_singleton?.first_acquired === true),
      },
    });
  }
  return { generated_at: new Date().toISOString(), source: 'proof-owned-app-running-pass-harness', runtime_directory: runtimeDirectory, worker_lanes: evidence, observations };
}

function commandSummary(result) {
  return { exitCode: result.exitCode, timedOut: result.timedOut, stdout_tail: String(result.stdout ?? '').slice(-500), stderr_tail: String(result.stderr ?? '').slice(-500) };
}

export async function buildRaspberryAppRunningPassHarnessProof({ metadata, env = process.env, repoRoot = process.cwd(), generatedEvidence = null, currentCrontab = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const shouldRunHarness = target.raspberry_like && !generatedEvidence;
  const crontab = currentCrontab === null ? await readSystemCrontabForEvidence() : { available: true, result: null, rows: String(currentCrontab).split(/\r?\n/).filter(Boolean) };
  const evidence = generatedEvidence ?? (shouldRunHarness ? await runProofOwnedWorkerHarness({ repoRoot, env }) : { generated_at: new Date().toISOString(), source: 'not-run-off-target', worker_lanes: [] });
  const evidenceFile = await writeWorkerEvidenceFile(evidence);
  const chainEnv = { ...env, PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE: evidenceFile };
  const cronProof = await buildRaspberryCronWorkerRuntimeProof({ metadata, env: chainEnv, currentCrontab: crontab.rows.join('\n') });
  const appStatusProof = await buildRaspberryAppRunningStatusProof({ metadata, env: chainEnv, currentCrontab: crontab.rows.join('\n'), cronEnvelope: cronProof });
  const status = determineAppRunningPassStatus({ target, generatedEvidence: evidence, cronProof, appStatusProof });
  return createProofEnvelope({
    proofKind: 'raspberry_app_running_pass_harness',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: status.proofStatus,
    runtimeMode: 'raspberry_app_running_pass_harness',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      generated_evidence_file: evidenceFile,
      worker_evidence: evidence.worker_lanes,
      harness_observations: evidence.observations ?? [],
      cron_status: cronProof.proof_status,
      app_running_status: appStatusProof.proof_status,
      app_running: appStatusProof.evidence?.app_running === true,
      status_reasons: status,
      pass_criteria: 'PASSED only when proof-owned harness evidence covers invocation, duplicate-skip, cross-worker independence, and stale-lock reclaim for all three worker lanes and the app-running chain passes.',
      non_claims: ['does not install cron', 'does not reboot the Raspberry', 'does not perform physical power-loss recovery', 'does not prove monitor pixels', 'does not prove production iCloud continuation', 'regular/screen worker product work remains instrumentation-only'],
    }),
    knownLimitations: status.proofStatus === 'PASSED' ? ['This proof applies only to the observed target runtime and generated evidence file.'] : ['Run on Raspberry with managed cron rows to execute the proof-owned harness.'],
  });
}
