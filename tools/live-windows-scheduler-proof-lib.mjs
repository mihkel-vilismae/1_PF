/**
 * Live Windows scheduler proof library for PF_login.
 * Separates proof-owned scheduled worker evidence from deterministic CronEmulator checks.
 * Blocks unless explicitly enabled on a Windows target machine.
 * Requires worker call timestamps/counts and duplicate lock evidence before PASS.
 * Writes sanitized evidence without claiming Raspberry cron, Windows reboot, or power-loss behavior.
 */
import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { buildWindowsCronEmulatorProof } from './windows-cronemulator-proof-lib.mjs';

const SCHEDULER_FLAG = 'PF_LIVE_WINDOWS_SCHEDULER_PROOF';
const ORCHESTRATE_FLAG = 'PF_LIVE_WINDOWS_SCHEDULER_ORCHESTRATE';
const DEFAULT_BASE_URL = 'http://127.0.0.1:4301';
const DEFAULT_TIMEOUT_MS = 45000;

/** Returns true only when the live Windows scheduler proof is explicitly enabled. */
export function isLiveWindowsSchedulerProofEnabled(env = process.env) {
  return env[SCHEDULER_FLAG] === '1' || env[SCHEDULER_FLAG] === 'true';
}

/** Returns true when the proof runner should own bounded scheduler evidence collection. */
export function shouldOrchestrateLiveWindowsSchedulerProof(env = process.env) {
  return env[ORCHESTRATE_FLAG] === '1' || env[ORCHESTRATE_FLAG] === 'true';
}

/** Builds the expected live scheduler proof stages for docs/tests. */
export function buildLiveWindowsSchedulerProofPlan() {
  return [
    'verify CronEmulator deterministic contract proof',
    'start proof-owned API for scheduler worker endpoints',
    'activate bounded proof-only scheduler loop',
    'invoke regular worker through proof-only scheduled boundary',
    'invoke playback worker through proof-only scheduled boundary',
    'invoke screen-on-off worker through proof-only scheduled boundary',
    'collect worker status/count/timestamp evidence',
    'verify duplicate worker lock protection',
    'stop proof-owned API and export sanitized evidence',
  ];
}

/** Builds the proof-only crontab text used as scheduler evidence, not a production schedule. */
export function buildProofOwnedSchedulerCrontabText() {
  return [
    '# PF_login proof-only scheduler rows; not installed as production cron.',
    '* * * * * tools/CronEmulator/entrypoints/regular_stage_worker.ps1 # regular_worker',
    '* * * * * tools/CronEmulator/entrypoints/playback_worker.ps1 # playback_worker',
    '* * * * * tools/CronEmulator/entrypoints/screen_on_off_worker.ps1 # screen_on_off_worker',
  ].join('\n');
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
      orchestration_flag: ORCHESTRATE_FLAG,
      plan: buildLiveWindowsSchedulerProofPlan(),
      deterministic_cronemulator_status: deterministicProof?.proof_status ?? null,
      scheduler_boundary: 'Live scheduler proof labels proof-owned scheduler loop evidence separately from CronEmulator, Task Scheduler, Raspberry cron, Windows reboot, and power-loss proof.',
    }),
    knownLimitations: ['No live scheduled worker execution was performed because target-machine proof prerequisites were not satisfied.'],
  });
}

/** Sleeps for a bounded async wait between proof-owned API readiness polls. */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Extracts the port that the proof-owned API process must bind to. */
function readApiPort(baseUrl, env) {
  if (env.PORT) return String(env.PORT);
  try {
    return new URL(baseUrl).port || '8787';
  } catch {
    return '4301';
  }
}

/** Starts a proof-owned API process for regular and screen worker endpoints. */
function startOwnedApiProcess({ repoRoot, baseUrl, env }) {
  const port = readApiPort(baseUrl, env);
  return spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    cwd: repoRoot,
    env: { ...process.env, ...env, PORT: port },
    stdio: 'ignore',
    windowsHide: false,
  });
}

/** Stops only the proof-owned API process started by this proof. */
async function stopOwnedApiProcess(child) {
  if (!child || child.killed || child.exitCode !== null) return { ok: true, status: 'already_stopped', pid: child?.pid ?? null };
  const pid = child.pid ?? null;
  child.kill();
  const deadline = Date.now() + 8000;
  while (child.exitCode === null && Date.now() < deadline) await delay(250);
  if (child.exitCode === null) {
    child.kill('SIGKILL');
    await delay(500);
  }
  return { ok: true, status: 'stopped', pid, exitCode: child.exitCode };
}

/** Waits until the proof-owned API responds to a low-impact version route. */
async function waitForApiReady(baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/version`);
      if (response.ok) return { key: 'api_ready', ok: true, status: response.status, payload: await response.json().catch(() => ({})) };
      lastError = { status: response.status, text: await response.text().catch(() => '') };
    } catch (error) {
      lastError = { message: error instanceof Error ? error.message : String(error) };
    }
    await delay(750);
  }
  return { key: 'api_ready', ok: false, status: 'timeout', payload: sanitizeEvidence(lastError) };
}

/** Builds a Windows PowerShell invocation for one CronEmulator entrypoint. */
function buildWorkerCommand(repoRoot, worker) {
  const fileByWorker = {
    regular_worker: join(repoRoot, 'tools', 'CronEmulator', 'entrypoints', 'regular_stage_worker.ps1'),
    playback_worker: join(repoRoot, 'tools', 'CronEmulator', 'entrypoints', 'playback_worker.ps1'),
    screen_on_off_worker: join(repoRoot, 'tools', 'CronEmulator', 'entrypoints', 'screen_on_off_worker.ps1'),
  };
  return { command: 'powershell', args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', fileByWorker[worker]] };
}

/** Runs one worker command and converts it into live scheduler call evidence. */
async function runScheduledWorker({ repoRoot, baseUrl, worker, env, timeoutMs }) {
  const startedAt = new Date().toISOString();
  const { command, args } = buildWorkerCommand(repoRoot, worker);
  const result = await runCommand(command, args, {
    cwd: repoRoot,
    env: { ...process.env, ...env, PF_BACKEND_URL: baseUrl },
    timeoutMs,
    detached: false,
  });
  const finishedAt = new Date().toISOString();
  return {
    worker,
    called: result.exitCode === 0,
    count: result.exitCode === 0 ? 1 : 0,
    firstCalledAt: startedAt,
    lastCalledAt: finishedAt,
    exitCode: result.exitCode,
    timedOut: result.timedOut,
    durationMs: result.durationMs,
    stdoutSummary: result.stdout.split(/\r?\n/).filter(Boolean).slice(0, 5).join(' '),
    stderrSummary: result.stderr.split(/\r?\n/).filter(Boolean).slice(0, 5).join(' '),
  };
}

/** Verifies playback worker duplicate lock behavior with a pre-existing proof-owned lock file. */
async function verifyPlaybackDuplicateLock({ repoRoot, baseUrl, env, timeoutMs }) {
  const runtimeDirectory = join(repoRoot, 'runtime_data', 'scheduler');
  const lockPath = join(runtimeDirectory, 'playback-worker-lock.json');
  await fs.mkdir(runtimeDirectory, { recursive: true });
  await fs.writeFile(lockPath, JSON.stringify({ worker: 'playback_worker', acquiredAt: new Date().toISOString(), pid: process.pid, workerId: 'live-windows-scheduler-proof-lock-probe' }, null, 2), { encoding: 'utf8' });
  try {
    const { command, args } = buildWorkerCommand(repoRoot, 'playback_worker');
    const result = await runCommand(command, args, {
      cwd: repoRoot,
      env: { ...process.env, ...env, PF_BACKEND_URL: baseUrl },
      timeoutMs,
      detached: false,
    });
    const combined = `${result.stdout}\n${result.stderr}`;
    const duplicateBlocked = result.exitCode !== 0 && /already running|playback_worker is already running/i.test(combined);
    return {
      duplicateBlocked,
      method: 'preexisting-playback-worker-lock-file',
      lockPath,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      stderrSummary: result.stderr.split(/\r?\n/).filter(Boolean).slice(0, 5).join(' '),
    };
  } finally {
    await fs.rm(lockPath, { force: true }).catch(() => undefined);
  }
}

/** Builds an optional playback summary from playback worker stdout. */
function summarizePlaybackWorkerOutput(workerCall) {
  const text = workerCall?.stdoutSummary ?? '';
  const mediaMatch = text.match(/"mediaAssetId"\s*:\s*"?([^",}\s]+)/i);
  return {
    worker: 'playback_worker',
    selectedMediaAssetId: mediaMatch?.[1] ?? null,
    stdoutSummary: text,
  };
}

/** Runs bounded proof-owned scheduler evidence collection on a Windows target. */
async function collectProofOwnedSchedulerEvidence({ repoRoot, env }) {
  const baseUrl = env.PF_API_BASE_URL ?? DEFAULT_BASE_URL;
  const timeoutMs = Number(env.PF_LIVE_WINDOWS_SCHEDULER_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const startedAt = new Date().toISOString();
  const api = startOwnedApiProcess({ repoRoot, baseUrl, env });
  const stageResults = [{ key: 'api_start', ok: true, pid: api.pid ?? null }];
  try {
    const ready = await waitForApiReady(baseUrl, timeoutMs);
    stageResults.push(ready);
    if (!ready.ok) {
      return { scheduler: { mode: 'proof-owned-scheduler-loop', active: false, startedAt, finishedAt: new Date().toISOString(), crontabText: buildProofOwnedSchedulerCrontabText() }, worker_calls: {}, locks: { duplicateBlocked: false }, playback: null, stage_results: stageResults };
    }

    const workerCalls = {};
    for (const worker of ['regular_worker', 'playback_worker', 'screen_on_off_worker']) {
      const call = await runScheduledWorker({ repoRoot, baseUrl, worker, env, timeoutMs });
      workerCalls[worker] = call;
      stageResults.push({ key: `${worker}_scheduled_invocation`, ok: call.called, payload: call });
    }
    const locks = await verifyPlaybackDuplicateLock({ repoRoot, baseUrl, env, timeoutMs });
    stageResults.push({ key: 'playback_worker_duplicate_lock_probe', ok: locks.duplicateBlocked, payload: locks });

    return {
      scheduler: {
        mode: 'proof-owned-scheduler-loop',
        active: true,
        startedAt,
        finishedAt: new Date().toISOString(),
        crontabText: buildProofOwnedSchedulerCrontabText(),
        notes: ['Bounded proof-only loop invoked each worker once; this is not Windows Task Scheduler, Raspberry cron, reboot, or power-loss evidence.'],
      },
      worker_calls: workerCalls,
      locks,
      playback: summarizePlaybackWorkerOutput(workerCalls.playback_worker),
      stage_results: stageResults,
    };
  } finally {
    const stopResult = await stopOwnedApiProcess(api);
    stageResults.push({ key: 'api_stop', ok: true, payload: stopResult });
  }
}

/** Runs live Windows scheduler proof preflight and optional proof-owned scheduler evidence collection. */
export async function runLiveWindowsSchedulerProof({ repoRoot, metadata, env = process.env, deterministicProof = null, liveEvidence = null }) {
  const cronProof = deterministicProof ?? await buildWindowsCronEmulatorProof({ repoRoot, metadata, runPytest: false });
  if (!isLiveWindowsSchedulerProofEnabled(env)) {
    return buildBlockedSchedulerProof({ metadata, reason: `Set ${SCHEDULER_FLAG}=1 to run the live Windows scheduler proof.`, deterministicProof: cronProof });
  }
  const observedEvidence = liveEvidence ?? (shouldOrchestrateLiveWindowsSchedulerProof(env) && process.platform === 'win32' ? await collectProofOwnedSchedulerEvidence({ repoRoot, env }) : null);
  if (!liveEvidence && process.platform !== 'win32') {
    return buildBlockedSchedulerProof({ metadata, reason: `Live Windows scheduler proof is Windows-only; current platform is ${process.platform}.`, deterministicProof: cronProof });
  }
  if (!observedEvidence) {
    return buildBlockedSchedulerProof({ metadata, reason: `Live scheduler evidence was not supplied. Set ${ORCHESTRATE_FLAG}=1 to run bounded proof-owned scheduler collection.`, deterministicProof: cronProof });
  }

  const workerEvidence = evaluateScheduledWorkerEvidence(observedEvidence);
  const locksPassed = Boolean(observedEvidence?.locks?.duplicateBlocked);
  const schedulerActive = Boolean(observedEvidence?.scheduler?.active);
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
      scheduler: observedEvidence.scheduler,
      worker_evidence: workerEvidence,
      worker_calls: observedEvidence.worker_calls,
      locks: observedEvidence.locks,
      playback: observedEvidence.playback,
      stage_results: observedEvidence.stage_results,
    }),
    knownLimitations: [
      'This proof does not prove Raspberry cron or Raspberry power recovery.',
      'This proof does not prove Windows reboot or Windows Task Scheduler unless a future launcher explicitly performs and records that mode.',
      'Scheduler mode is proof-owned-scheduler-loop; it is bounded target-machine scheduled invocation evidence, not production scheduler installation.',
    ],
  });
}
