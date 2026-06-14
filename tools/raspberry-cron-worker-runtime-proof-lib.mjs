/**
 * Raspberry cron worker runtime proof library.
 * Implements an honest app-running evidence collector for the three worker lanes.
 */
import { existsSync, readFileSync } from 'node:fs';
import { runCommand, createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

export const RASPBERRY_CRON_WORKER_LANES = Object.freeze([
  { name: 'regular_stage_worker', cadence: '*/10 * * * *', scheduler: 'regular-stage-worker', requiredFragments: ['*/10', '--scheduler regular-stage-worker'] },
  { name: 'playback_worker', cadence: '* * * * *', scheduler: 'playback-worker', requiredFragments: ['--scheduler playback-worker'] },
  { name: 'screen_on_off_worker', cadence: '*/3 * * * *', scheduler: 'screen-on-off-worker', requiredFragments: ['*/3', '--scheduler screen-on-off-worker'] },
]);

export function parseCrontabRows(text = '') {
  return String(text).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
}

export function evaluateCronRows(rows = [], lanes = RASPBERRY_CRON_WORKER_LANES) {
  return lanes.map((lane) => {
    const matchingRows = rows.filter((row) => lane.requiredFragments.every((fragment) => row.includes(fragment)));
    return { ...lane, present: matchingRows.length > 0, matching_rows: matchingRows };
  });
}

export function loadOperatorEvidence({ env = process.env, evidence = null } = {}) {
  if (evidence) return { source: 'injected', data: evidence, load_error: null };
  const file = env.PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE;
  if (!file) return { source: 'none', data: null, load_error: 'PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE is not set' };
  try {
    return { source: file, data: JSON.parse(readFileSync(file, 'utf8')), load_error: null };
  } catch (error) {
    return { source: file, data: null, load_error: error instanceof Error ? error.message : String(error) };
  }
}

export function evaluateWorkerEvidence(operatorEvidence, lanes = RASPBERRY_CRON_WORKER_LANES) {
  const data = operatorEvidence?.data ?? {};
  const laneEvidence = data.worker_lanes ?? data.workers ?? [];
  return lanes.map((lane) => {
    const found = laneEvidence.find((entry) => entry.name === lane.name);
    const sameWorkerSingleton = Boolean(found?.same_worker_singleton?.first_acquired && found?.same_worker_singleton?.duplicate_skipped);
    const invocationObserved = Boolean(found?.last_invocation_at || found?.invocation_observed);
    const crossWorkerIndependent = Boolean(found?.cross_worker_independence === true || data.cross_worker_independence?.[lane.name] === true);
    const staleLockRecovered = Boolean(found?.stale_lock?.reclaimed === true || found?.stale_lock_reclaim === true);
    return {
      name: lane.name,
      invocation_observed: invocationObserved,
      same_worker_singleton: sameWorkerSingleton,
      duplicate_skip_observed: sameWorkerSingleton,
      cross_worker_independence_observed: crossWorkerIndependent,
      stale_lock_reclaim_observed: staleLockRecovered,
      complete: invocationObserved && sameWorkerSingleton && crossWorkerIndependent && staleLockRecovered,
      evidence: found ?? null,
    };
  });
}

export function determineCronWorkerRuntimeStatus({ target, cronAvailable, cronRows, workerEvidence, operatorEvidence }) {
  const blockReasons = [];
  const failedReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (!cronAvailable) blockReasons.push('crontab is unavailable or could not be read');
  const missingRows = cronRows.filter((row) => !row.present).map((row) => row.name);
  if (missingRows.length) blockReasons.push(`missing managed cron rows for: ${missingRows.join(', ')}`);
  if (operatorEvidence.load_error) blockReasons.push(operatorEvidence.load_error);
  const incompleteEvidence = workerEvidence.filter((row) => !row.complete).map((row) => row.name);
  if (!operatorEvidence.load_error && incompleteEvidence.length) failedReasons.push(`incomplete worker evidence for: ${incompleteEvidence.join(', ')}`);
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, failedReasons, missingRows, incompleteEvidence };
  if (failedReasons.length) return { proofStatus: 'FAILED', blockReasons, failedReasons, missingRows, incompleteEvidence };
  return { proofStatus: 'PASSED', blockReasons, failedReasons, missingRows, incompleteEvidence };
}

export async function readSystemCrontab() {
  const result = await runCommand('crontab', ['-l'], { timeoutMs: 10000, detached: false, sanitize: false });
  return { available: result.exitCode === 0, result, rows: parseCrontabRows(result.stdout) };
}

export async function buildRaspberryCronWorkerRuntimeProof({ metadata, env = process.env, currentCrontab = null, operatorEvidence = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const crontab = currentCrontab === null ? await readSystemCrontab() : { available: true, result: null, rows: parseCrontabRows(currentCrontab) };
  const cronRows = evaluateCronRows(crontab.rows);
  const loadedEvidence = loadOperatorEvidence({ env, evidence: operatorEvidence });
  const workerEvidence = evaluateWorkerEvidence(loadedEvidence);
  const status = determineCronWorkerRuntimeStatus({ target, cronAvailable: crontab.available, cronRows, workerEvidence, operatorEvidence: loadedEvidence });
  return createProofEnvelope({
    proofKind: 'raspberry_cron_worker_runtime',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: status.proofStatus,
    runtimeMode: 'raspberry_cron_worker_runtime',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      expected_worker_lanes: RASPBERRY_CRON_WORKER_LANES,
      cron: { available: crontab.available, rows: crontab.rows, row_evidence: cronRows, command_result: crontab.result },
      operator_evidence: { source: loadedEvidence.source, load_error: loadedEvidence.load_error },
      worker_evidence: workerEvidence,
      status_reasons: status,
      pass_criteria: 'PASSED only when target is Raspberry-like, managed cron rows exist for all three lanes, and operator evidence proves invocation, same-worker singleton duplicate-skip, cross-worker independence, and stale-lock reclaim for every lane.',
      non_claims: ['does not install cron', 'does not reboot the Raspberry', 'does not perform physical power-loss recovery', 'does not prove monitor pixels', 'does not prove production iCloud continuation'],
    }),
    knownLimitations: status.proofStatus === 'PASSED'
      ? ['This proof applies only to the observed Raspberry cron configuration and supplied operator evidence.']
      : ['Run on Raspberry with managed cron installed and provide PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE containing all three worker lane observations.'],
  });
}
