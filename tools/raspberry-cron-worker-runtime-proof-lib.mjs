/**
 * Raspberry cron worker runtime proof library.
 * Implements an honest app-running evidence collector for the three worker lanes.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCommand, createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

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

function defaultLatestWorkerEvidenceManifestPath() {
  return join(repoRoot, 'runtime_data', 'raspberry_worker_evidence', 'latest.json');
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function isRedactedEvidenceReference(value) {
  return /\[REDACTED(?:_PATH)?\]/u.test(String(value ?? ''));
}

function isInsideDirectory(parent, child) {
  const relativePath = relative(parent, child);
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function uniqueCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = normalize(candidate.file);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveLatestWorkerEvidenceReference({ manifestPath, evidenceReference }) {
  if (!evidenceReference) return { file: null, resolution: 'missing', load_error: 'latest worker evidence manifest does not contain evidence_file or evidenceFile' };
  if (isRedactedEvidenceReference(evidenceReference)) {
    return { file: null, resolution: 'redacted', load_error: 'latest worker evidence manifest points to a redacted evidence path; rerun npm run proof:raspberry-worker-evidence with the portable manifest writer' };
  }

  const manifestDir = dirname(manifestPath);
  const candidates = isAbsolute(evidenceReference)
    ? [{ file: evidenceReference, resolution: 'absolute' }]
    : uniqueCandidates([
      { file: resolve(repoRoot, evidenceReference), resolution: 'repo-relative' },
      { file: resolve(manifestDir, evidenceReference), resolution: 'manifest-relative' },
      { file: resolve(manifestDir, evidenceReference.replace(/^runtime_data[\\/]+raspberry_worker_evidence[\\/]+/u, '')), resolution: 'manifest-dir-basename' },
    ]);

  const safeCandidates = candidates.filter((candidate) => isAbsolute(evidenceReference) || isInsideDirectory(repoRoot, candidate.file));
  if (!safeCandidates.length) {
    return { file: null, resolution: 'outside-repo', load_error: 'latest worker evidence manifest points outside the repository; use PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE for explicit external evidence' };
  }

  const existing = safeCandidates.find((candidate) => existsSync(candidate.file));
  if (existing) return { file: existing.file, resolution: existing.resolution, load_error: null };

  return {
    file: safeCandidates[0]?.file ?? null,
    resolution: 'not-found',
    load_error: `latest worker evidence file could not be found for manifest reference: ${evidenceReference}`,
  };
}

export function readLatestEvidenceFileFromManifest(manifestPath) {
  if (!existsSync(manifestPath)) return { file: null, source: 'none', load_error: null, resolution: 'no-manifest' };
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const evidenceReference = firstNonEmptyString(manifest.evidence_file, manifest.evidenceFile, manifest.repo_relative_evidence_file);
    const resolved = resolveLatestWorkerEvidenceReference({ manifestPath, evidenceReference });
    return {
      file: resolved.file,
      source: `latest:${manifestPath}`,
      load_error: resolved.load_error,
      resolution: resolved.resolution,
      manifest_evidence_reference: evidenceReference,
    };
  } catch (error) {
    return { file: null, source: `latest:${manifestPath}`, load_error: error instanceof Error ? error.message : String(error), resolution: 'manifest-read-error' };
  }
}

export function loadOperatorEvidence({ env = process.env, evidence = null, latestManifestPath = defaultLatestWorkerEvidenceManifestPath() } = {}) {
  if (evidence) return { source: 'injected', data: evidence, load_error: null, auto_discovered: false, resolution: 'injected' };
  const explicitFile = env.PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE;
  const discovered = explicitFile
    ? { file: explicitFile, source: explicitFile, load_error: null, resolution: 'explicit-env' }
    : readLatestEvidenceFileFromManifest(latestManifestPath);
  if (discovered.load_error) return { source: discovered.source, data: null, load_error: discovered.load_error, auto_discovered: !explicitFile, file: discovered.file, resolution: discovered.resolution };
  if (!discovered.file) return { source: 'none', data: null, load_error: 'PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE is not set and no latest worker evidence manifest exists', auto_discovered: false, resolution: discovered.resolution ?? 'none' };
  try {
    return { source: discovered.source, data: JSON.parse(readFileSync(discovered.file, 'utf8')), load_error: null, auto_discovered: !explicitFile, file: discovered.file, resolution: discovered.resolution };
  } catch (error) {
    return { source: discovered.source, data: null, load_error: error instanceof Error ? error.message : String(error), auto_discovered: !explicitFile, file: discovered.file, resolution: discovered.resolution };
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
  if (!operatorEvidence.load_error && incompleteEvidence.length) blockReasons.push(`incomplete worker evidence for: ${incompleteEvidence.join(', ')}`);
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, failedReasons, missingRows, incompleteEvidence };
  if (failedReasons.length) return { proofStatus: 'FAILED', blockReasons, failedReasons, missingRows, incompleteEvidence };
  return { proofStatus: 'PASSED', blockReasons, failedReasons, missingRows, incompleteEvidence };
}


export function buildCronWorkerRuntimeNextSteps(status) {
  if (status.proofStatus === 'PASSED') return ['Run npm run proof:raspberry-app-running-status and npm run proof:raspberry-v1-readiness.'];
  const steps = [];
  if (status.missingRows?.length) steps.push(`Install or repair managed cron rows for: ${status.missingRows.join(', ')}.`);
  if (status.blockReasons?.some((reason) => /PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE/.test(reason))) {
    steps.push('Run npm run proof:raspberry-worker-evidence, then rerun this proof; it auto-loads runtime_data/raspberry_worker_evidence/latest.json. You may still export PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE explicitly to override the latest file.');
  }
  if (status.incompleteEvidence?.length) {
    steps.push(`Complete worker evidence for: ${status.incompleteEvidence.join(', ')}; each lane needs invocation, duplicate-skip, cross-worker independence, and stale-lock reclaim evidence.`);
  }
  if (!steps.length) steps.push('Run on Raspberry with managed cron installed and complete operator evidence for all three worker lanes.');
  return steps;
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
      operator_evidence: { source: loadedEvidence.source, load_error: loadedEvidence.load_error, auto_discovered: loadedEvidence.auto_discovered === true, resolution: loadedEvidence.resolution ?? null },
      worker_evidence: workerEvidence,
      status_reasons: status,
      next_steps: buildCronWorkerRuntimeNextSteps(status),
      pass_criteria: 'PASSED only when target is Raspberry-like, managed cron rows exist for all three lanes, and operator evidence proves invocation, same-worker singleton duplicate-skip, cross-worker independence, and stale-lock reclaim for every lane.',
      non_claims: ['does not install cron', 'does not reboot the Raspberry', 'does not perform physical power-loss recovery', 'does not prove monitor pixels', 'does not prove production iCloud continuation'],
    }),
    knownLimitations: status.proofStatus === 'PASSED'
      ? ['This proof applies only to the observed Raspberry cron configuration and supplied operator evidence.']
      : ['Run on Raspberry with managed cron installed and provide PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE containing all three worker lane observations.'],
  });
}
