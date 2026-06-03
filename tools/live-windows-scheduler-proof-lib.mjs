/**
 * Live Windows scheduler proof library for PF_login.
 * Separates real/scheduled worker evidence from deterministic CronEmulator contract checks.
 * Blocks unless explicitly enabled on a Windows target machine.
 * Requires worker call timestamps/counts and lock evidence before claiming live scheduler pass.
 * Writes sanitized evidence without claiming Raspberry cron or Windows reboot behavior.
 */
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { buildWindowsCronEmulatorProof } from './windows-cronemulator-proof-lib.mjs';

const SCHEDULER_FLAG = 'PF_LIVE_WINDOWS_SCHEDULER_PROOF';

/** Returns true only when the live Windows scheduler proof is explicitly enabled. */
export function isLiveWindowsSchedulerProofEnabled(env = process.env) {
  return env[SCHEDULER_FLAG] === '1' || env[SCHEDULER_FLAG] === 'true';
}

/** Builds the expected live scheduler proof stages for docs/tests. */
export function buildLiveWindowsSchedulerProofPlan() {
  return [
    'verify CronEmulator deterministic contract proof',
    'install or activate proof-only scheduler configuration',
    'wait for regular worker scheduled invocation',
    'wait for playback worker scheduled invocation',
    'wait for screen-on-off worker scheduled invocation',
    'collect worker status/count/timestamp evidence',
    'verify duplicate worker lock protection',
    'stop proof-only scheduler and export sanitized evidence',
  ];
}

/** Evaluates worker call evidence for the three required Windows scheduler workers. */
export function evaluateScheduledWorkerEvidence(evidence) {
  const workers = evidence?.worker_calls ?? {};
  const required = ['regular_worker', 'playback_worker', 'screen_on_off_worker'];
  const checks = required.map((worker) => {
    const entry = workers[worker] ?? {};
    return {
      worker,
      called: Boolean(entry.called),
      count: Number(entry.count ?? 0),
      firstCalledAt: entry.firstCalledAt ?? null,
      lastCalledAt: entry.lastCalledAt ?? null,
      passed: Boolean(entry.called) && Number(entry.count ?? 0) > 0 && Boolean(entry.firstCalledAt || entry.lastCalledAt),
    };
  });
  return { checks, passed: checks.every((entry) => entry.passed) };
}

/** Builds a safe BLOCKED envelope for live scheduler prerequisites. */
function buildBlockedSchedulerProof({ metadata, reason, deterministicProof = null }) {
  return createProofEnvelope({
    proofKind: 'live_windows_scheduler',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: 'BLOCKED',
    runtimeMode: 'live_windows_scheduler_opt_in',
    evidence: sanitizeEvidence({
      reason,
      enable_flag: SCHEDULER_FLAG,
      plan: buildLiveWindowsSchedulerProofPlan(),
      deterministic_cronemulator_status: deterministicProof?.proof_status ?? null,
      scheduler_boundary: 'Live scheduler proof must label CronEmulator vs Task Scheduler and must not claim Raspberry cron.',
    }),
    knownLimitations: ['No live scheduled worker execution was performed because target-machine proof prerequisites were not satisfied.'],
  });
}

/** Runs live Windows scheduler proof preflight and blocks unless target evidence is provided. */
export async function runLiveWindowsSchedulerProof({ repoRoot, metadata, env = process.env, deterministicProof = null, liveEvidence = null }) {
  const cronProof = deterministicProof ?? await buildWindowsCronEmulatorProof({ repoRoot, metadata, runPytest: false });
  if (!isLiveWindowsSchedulerProofEnabled(env)) {
    return buildBlockedSchedulerProof({ metadata, reason: `Set ${SCHEDULER_FLAG}=1 to run the live Windows scheduler proof.`, deterministicProof: cronProof });
  }
  if (process.platform !== 'win32') {
    return buildBlockedSchedulerProof({ metadata, reason: `Live Windows scheduler proof is Windows-only; current platform is ${process.platform}.`, deterministicProof: cronProof });
  }
  if (!liveEvidence) {
    return buildBlockedSchedulerProof({ metadata, reason: 'Live scheduler evidence was not supplied by a proof-owned Windows scheduler launcher.', deterministicProof: cronProof });
  }

  const workerEvidence = evaluateScheduledWorkerEvidence(liveEvidence);
  const locksPassed = Boolean(liveEvidence?.locks?.duplicateBlocked);
  const schedulerActive = Boolean(liveEvidence?.scheduler?.active);
  const proofStatus = workerEvidence.passed && locksPassed && schedulerActive ? 'PASSED' : 'FAILED';
  return createProofEnvelope({
    proofKind: 'live_windows_scheduler',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'live_windows_scheduler_opt_in',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      deterministic_cronemulator_status: cronProof.proof_status,
      scheduler: liveEvidence.scheduler,
      worker_evidence: workerEvidence,
      locks: liveEvidence.locks,
      playback: liveEvidence.playback,
    }),
    knownLimitations: [
      'This proof does not prove Raspberry cron or Raspberry power recovery.',
      'This proof does not prove Windows reboot unless the launcher explicitly performs and records a reboot.',
      'Scheduler mode must be read from evidence; CronEmulator evidence is not the same as Task Scheduler evidence.',
    ],
  });
}
