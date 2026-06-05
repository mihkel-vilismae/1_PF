/**
 * Live Windows native recovery proof library for PF_login.
 * Defines controlled API-restart recovery proof without claiming OS reboot evidence.
 * Verifies selected playback identity before and after a proof-owned API restart.
 * Keeps normal native playback disabled unless the proof launcher explicitly opts in.
 * Writes sanitized evidence and returns BLOCKED when target-machine prerequisites are absent.
 */
import { spawn } from 'node:child_process';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { compareNativeAndBrowserItems, isLiveWindowsNativePlaybackProofEnabled, requestJson, selectBrowserPlaybackItem } from './live-windows-native-playback-proof-lib.mjs';

const RECOVERY_FLAG = 'PF_LIVE_WINDOWS_NATIVE_RECOVERY_PROOF';
const ORCHESTRATE_FLAG = 'PF_LIVE_WINDOWS_NATIVE_RECOVERY_ORCHESTRATE';
const DEFAULT_BASE_URL = 'http://127.0.0.1:4301';
const DEFAULT_TIMEOUT_MS = 45000;

/** Returns true only when the controlled Windows native recovery proof is enabled. */
export function isLiveWindowsNativeRecoveryProofEnabled(env = process.env) {
  return env[RECOVERY_FLAG] === '1' || env[RECOVERY_FLAG] === 'true';
}

/** Returns true when the proof runner should own the API stop/restart lifecycle. */
export function shouldOrchestrateWindowsNativeRecovery(env = process.env) {
  return env[ORCHESTRATE_FLAG] === '1' || env[ORCHESTRATE_FLAG] === 'true';
}

/** Builds the controlled recovery proof plan for docs/tests. */
export function buildLiveWindowsNativeRecoveryPlan() {
  return [
    'start proof-owned API with native playback enabled',
    'read selected playback contract before restart',
    'start native playback for selected item',
    'stop proof-owned API process only',
    'restart proof-owned API process with same proof env file',
    'read selected playback contract after restart',
    'relaunch native playback for restored selected item',
    'stop owned native playback and proof API',
  ];
}

/** Builds the observable route keys expected in a complete controlled recovery proof. */
export function buildControlledRecoveryStageKeys() {
  return [
    'api_start_before_restart',
    'api_ready_before_restart',
    'before_restart_playback_contract',
    'before_restart_native_detect',
    'before_restart_native_start_current',
    'before_restart_native_status_after_start',
    'api_stop_for_restart',
    'api_start_after_restart',
    'api_ready_after_restart',
    'after_restart_playback_contract',
    'after_restart_native_start_current',
    'after_restart_native_status_after_relaunch',
    'after_restart_native_stop_owned',
  ];
}

/** Compares selected item identity before and after controlled API restart. */
export function compareRecoverySelectedItems(beforeItem, afterItem) {
  return {
    beforeMediaAssetId: beforeItem?.mediaAssetId ?? null,
    afterMediaAssetId: afterItem?.mediaAssetId ?? null,
    sameMediaAsset: Boolean(beforeItem?.mediaAssetId && afterItem?.mediaAssetId && String(beforeItem.mediaAssetId) === String(afterItem.mediaAssetId)),
    beforeDisplayName: beforeItem?.displayName ?? null,
    afterDisplayName: afterItem?.displayName ?? null,
    beforeMediaType: beforeItem?.mediaType ?? null,
    afterMediaType: afterItem?.mediaType ?? null,
  };
}

/** Evaluates the target-machine recovery evidence without weakening route checks. */
export function evaluateControlledRecoveryEvidence({ selectedComparison, beforeNativeComparison, afterNativeComparison, stopPayload }) {
  const stoppedOwned = stopPayload?.nativePlayback?.status === 'stopped';
  return {
    sameMediaAssetAfterRestart: Boolean(selectedComparison?.sameMediaAsset),
    beforeNativeRunningSameItem: Boolean(beforeNativeComparison?.sameMediaAsset && beforeNativeComparison?.nativeStatus === 'running' && beforeNativeComparison?.nativePidPresent),
    afterNativeRunningSameItem: Boolean(afterNativeComparison?.sameMediaAsset && afterNativeComparison?.nativeStatus === 'running' && afterNativeComparison?.nativePidPresent),
    ownedStopSucceeded: stoppedOwned,
    passed: Boolean(selectedComparison?.sameMediaAsset && beforeNativeComparison?.sameMediaAsset && beforeNativeComparison?.nativeStatus === 'running' && beforeNativeComparison?.nativePidPresent && afterNativeComparison?.sameMediaAsset && afterNativeComparison?.nativeStatus === 'running' && afterNativeComparison?.nativePidPresent && stoppedOwned),
  };
}

/** Builds a safe blocked envelope for missing controlled recovery prerequisites. */
function buildBlockedRecoveryProof({ metadata, baseUrl, reason }) {
  return createProofEnvelope({
    proofKind: 'live_windows_native_recovery',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: 'BLOCKED',
    runtimeMode: 'live_windows_recovery_opt_in',
    evidence: {
      reason,
      enable_flag: RECOVERY_FLAG,
      orchestration_flag: ORCHESTRATE_FLAG,
      base_url: baseUrl,
      plan: buildLiveWindowsNativeRecoveryPlan(),
      boundary: 'Controlled API restart only; this does not claim Windows reboot, Raspberry recovery, or power-loss recovery.',
    },
    knownLimitations: ['No recovery proof was run because target-machine opt-in prerequisites were not satisfied.'],
  });
}

/** Sleeps for a bounded async wait between API readiness polls. */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Extracts the port number that the owned API process must bind to. */
function readApiPort(baseUrl, env) {
  if (env.PORT) {
    return String(env.PORT);
  }
  try {
    return new URL(baseUrl).port || '8787';
  } catch {
    return '4301';
  }
}

/** Starts a proof-owned API process using the same proof env file as the launcher. */
function startOwnedApiProcess({ baseUrl, env }) {
  const port = readApiPort(baseUrl, env);
  const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
      PORT: port,
    },
    stdio: 'ignore',
    windowsHide: false,
  });
  return child;
}

/** Stops only the proof-owned API process that this recovery proof started. */
async function stopOwnedApiProcess(child) {
  if (!child || child.killed || child.exitCode !== null) {
    return { key: 'api_stop_for_restart', ok: true, status: 'already_stopped', pid: child?.pid ?? null };
  }
  const pid = child.pid ?? null;
  child.kill();
  const deadline = Date.now() + 8000;
  while (child.exitCode === null && Date.now() < deadline) {
    await delay(250);
  }
  if (child.exitCode === null) {
    child.kill('SIGKILL');
    await delay(500);
  }
  return { key: 'api_stop_for_restart', ok: true, status: 'stopped', pid, exitCode: child.exitCode };
}

/** Waits until the owned API responds and native playback is enabled. */
async function waitForOwnedApiReady({ baseUrl, runtimeMode, stageKey, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const status = await requestJson(baseUrl, { key: stageKey, method: 'GET', path: '/api/native-playback/status' }, runtimeMode);
      if (status.ok && status.payload?.config?.enabled === true) {
        return { ...status, key: stageKey };
      }
      lastError = status;
    } catch (error) {
      lastError = { message: error instanceof Error ? error.message : String(error) };
    }
    await delay(750);
  }
  return { key: stageKey, method: 'GET', path: '/api/native-playback/status', ok: false, status: 'timeout', payload: sanitizeEvidence(lastError) };
}

/** Appends a route result and returns early-failure envelope data when the route failed. */
function buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute, beforeItem = null, afterItem = null }) {
  return createProofEnvelope({
    proofKind: 'live_windows_native_recovery',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: 'FAILED',
    runtimeMode: 'live_windows_recovery_opt_in',
    evidence: sanitizeEvidence({ environment: getProofEnvironment(), base_url: baseUrl, runtime_mode_header: runtimeMode, failed_route: failedRoute, stage_results: stageResults, before_item: beforeItem, after_item: afterItem }),
    knownLimitations: ['The controlled API restart proof stopped at the first failed recovery route.'],
  });
}

/** Runs the full proof-owned controlled API restart/recovery orchestration. */
async function runOrchestratedWindowsNativeRecovery({ metadata, env }) {
  const baseUrl = env.PF_API_BASE_URL ?? DEFAULT_BASE_URL;
  const runtimeMode = env.PF_LIVE_WINDOWS_NATIVE_PLAYBACK_RUNTIME_MODE ?? 'real';
  const timeoutMs = Number(env.PF_LIVE_WINDOWS_NATIVE_RECOVERY_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const stageResults = [];
  let beforeApi = null;
  let afterApi = null;

  try {
    beforeApi = startOwnedApiProcess({ baseUrl, env });
    stageResults.push({ key: 'api_start_before_restart', ok: true, pid: beforeApi.pid ?? null });

    const beforeReady = await waitForOwnedApiReady({ baseUrl, runtimeMode, stageKey: 'api_ready_before_restart', timeoutMs });
    stageResults.push(beforeReady);
    if (!beforeReady.ok) return buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute: beforeReady.key });

    const before = await requestJson(baseUrl, { key: 'before_restart_playback_contract', method: 'GET', path: '/api/runtime/playback/current?limit=50' }, runtimeMode);
    stageResults.push(before);
    const beforeItem = selectBrowserPlaybackItem(before.payload);
    if (!before.ok || !beforeItem) return buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute: before.key, beforeItem });

    const detect = await requestJson(baseUrl, { key: 'before_restart_native_detect', method: 'POST', path: '/api/native-playback/detect' }, runtimeMode);
    stageResults.push(detect);
    if (!detect.ok) return buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute: detect.key, beforeItem });

    const beforeStart = await requestJson(baseUrl, { key: 'before_restart_native_start_current', method: 'POST', path: '/api/native-playback/start-current' }, runtimeMode);
    stageResults.push(beforeStart);
    if (!beforeStart.ok) return buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute: beforeStart.key, beforeItem });

    const beforeStatus = await requestJson(baseUrl, { key: 'before_restart_native_status_after_start', method: 'GET', path: '/api/native-playback/status' }, runtimeMode);
    stageResults.push(beforeStatus);
    if (!beforeStatus.ok) return buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute: beforeStatus.key, beforeItem });
    const beforeNativeComparison = compareNativeAndBrowserItems(beforeItem, beforeStatus.payload);

    const stoppedBeforeApi = await stopOwnedApiProcess(beforeApi);
    stageResults.push(stoppedBeforeApi);
    beforeApi = null;

    afterApi = startOwnedApiProcess({ baseUrl, env });
    stageResults.push({ key: 'api_start_after_restart', ok: true, pid: afterApi.pid ?? null });

    const afterReady = await waitForOwnedApiReady({ baseUrl, runtimeMode, stageKey: 'api_ready_after_restart', timeoutMs });
    stageResults.push(afterReady);
    if (!afterReady.ok) return buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute: afterReady.key, beforeItem });

    const after = await requestJson(baseUrl, { key: 'after_restart_playback_contract', method: 'GET', path: '/api/runtime/playback/current?limit=50' }, runtimeMode);
    stageResults.push(after);
    const afterItem = selectBrowserPlaybackItem(after.payload);
    if (!after.ok || !afterItem) return buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute: after.key, beforeItem, afterItem });

    const selectedComparison = compareRecoverySelectedItems(beforeItem, afterItem);

    const afterStart = await requestJson(baseUrl, { key: 'after_restart_native_start_current', method: 'POST', path: '/api/native-playback/start-current' }, runtimeMode);
    stageResults.push(afterStart);
    if (!afterStart.ok) return buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute: afterStart.key, beforeItem, afterItem });

    const afterStatus = await requestJson(baseUrl, { key: 'after_restart_native_status_after_relaunch', method: 'GET', path: '/api/native-playback/status' }, runtimeMode);
    stageResults.push(afterStatus);
    if (!afterStatus.ok) return buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute: afterStatus.key, beforeItem, afterItem });
    const afterNativeComparison = compareNativeAndBrowserItems(afterItem, afterStatus.payload);

    const stopNative = await requestJson(baseUrl, { key: 'after_restart_native_stop_owned', method: 'POST', path: '/api/native-playback/stop' }, runtimeMode);
    stageResults.push(stopNative);
    if (!stopNative.ok) return buildRouteFailureEnvelope({ metadata, baseUrl, runtimeMode, stageResults, failedRoute: stopNative.key, beforeItem, afterItem });

    const recoveryEvaluation = evaluateControlledRecoveryEvidence({ selectedComparison, beforeNativeComparison, afterNativeComparison, stopPayload: stopNative.payload });
    return createProofEnvelope({
      proofKind: 'live_windows_native_recovery',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: recoveryEvaluation.passed ? 'PASSED' : 'FAILED',
      runtimeMode: 'live_windows_recovery_opt_in',
      evidence: sanitizeEvidence({
        environment: getProofEnvironment(),
        base_url: baseUrl,
        runtime_mode_header: runtimeMode,
        proof_mode: 'controlled_api_restart_native_recovery',
        before_item: beforeItem,
        after_item: afterItem,
        selected_item_comparison: selectedComparison,
        before_native_comparison: beforeNativeComparison,
        after_native_comparison: afterNativeComparison,
        recovery_evaluation: recoveryEvaluation,
        stage_results: stageResults,
      }),
      knownLimitations: [
        'This proof performs a controlled proof-owned API process restart only; it does not prove full Windows reboot behavior.',
        'This proof does not prove Raspberry cron, Raspberry HDMI, or power-loss recovery behavior.',
        'This proof observes native route/process status; it cannot visually inspect monitor focus or pixels without an external screen capture proof.',
      ],
    });
  } finally {
    if (beforeApi) await stopOwnedApiProcess(beforeApi);
    if (afterApi) await stopOwnedApiProcess(afterApi);
  }
}

/** Runs a bounded controlled recovery proof against a target Windows machine. */
export async function runLiveWindowsNativeRecoveryProof({ metadata, env = process.env }) {
  const baseUrl = env.PF_API_BASE_URL ?? DEFAULT_BASE_URL;
  const runtimeMode = env.PF_LIVE_WINDOWS_NATIVE_PLAYBACK_RUNTIME_MODE ?? 'test';
  if (!isLiveWindowsNativeRecoveryProofEnabled(env)) {
    return buildBlockedRecoveryProof({ metadata, baseUrl, reason: `Set ${RECOVERY_FLAG}=1 to run the controlled Windows native recovery proof.` });
  }
  if (!isLiveWindowsNativePlaybackProofEnabled(env)) {
    return buildBlockedRecoveryProof({ metadata, baseUrl, reason: 'Set PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF=1 as well; recovery proof reuses the live native playback safety gate.' });
  }
  if (!shouldOrchestrateWindowsNativeRecovery(env)) {
    return buildBlockedRecoveryProof({ metadata, baseUrl, reason: `Set ${ORCHESTRATE_FLAG}=1 so the proof runner can own API stop/restart orchestration.` });
  }
  if (process.platform !== 'win32') {
    return buildBlockedRecoveryProof({ metadata, baseUrl, reason: `Controlled native recovery proof is Windows-only; current platform is ${process.platform}.` });
  }

  return runOrchestratedWindowsNativeRecovery({ metadata, env: { ...env, PF_LIVE_WINDOWS_NATIVE_PLAYBACK_RUNTIME_MODE: runtimeMode } });
}
