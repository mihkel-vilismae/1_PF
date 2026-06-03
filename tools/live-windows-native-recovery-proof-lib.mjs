/**
 * Live Windows native recovery proof library for PF_login.
 * Defines a controlled API-restart recovery proof without claiming OS reboot evidence.
 * Verifies selected playback identity can be captured before and after a proof-owned restart.
 * Keeps normal native playback disabled unless the proof launcher explicitly opts in.
 * Writes sanitized evidence and returns BLOCKED when target-machine prerequisites are absent.
 */
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { isLiveWindowsNativePlaybackProofEnabled, requestJson, selectBrowserPlaybackItem } from './live-windows-native-playback-proof-lib.mjs';

const RECOVERY_FLAG = 'PF_LIVE_WINDOWS_NATIVE_RECOVERY_PROOF';
const DEFAULT_BASE_URL = 'http://127.0.0.1:4301';

/** Returns true only when the controlled Windows native recovery proof is enabled. */
export function isLiveWindowsNativeRecoveryProofEnabled(env = process.env) {
  return env[RECOVERY_FLAG] === '1' || env[RECOVERY_FLAG] === 'true';
}

/** Builds the controlled recovery proof plan for docs/tests. */
export function buildLiveWindowsNativeRecoveryPlan() {
  return [
    'start proof-owned API with native playback enabled',
    'read selected playback contract before restart',
    'start native playback for selected item',
    'stop proof-owned API process',
    'restart proof-owned API process with same proof env file',
    'read selected playback contract after restart',
    'relaunch native playback for restored selected item',
    'stop owned native playback and proof API',
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
      base_url: baseUrl,
      plan: buildLiveWindowsNativeRecoveryPlan(),
      boundary: 'Controlled API restart only; this does not claim Windows reboot or Raspberry power recovery.',
    },
    knownLimitations: ['No recovery proof was run because target-machine opt-in prerequisites were not satisfied.'],
  });
}

/** Runs a bounded controlled recovery preflight against an already-running API. */
export async function runLiveWindowsNativeRecoveryProof({ metadata, env = process.env }) {
  const baseUrl = env.PF_API_BASE_URL ?? DEFAULT_BASE_URL;
  const runtimeMode = env.PF_LIVE_WINDOWS_NATIVE_PLAYBACK_RUNTIME_MODE ?? 'test';
  if (!isLiveWindowsNativeRecoveryProofEnabled(env)) {
    return buildBlockedRecoveryProof({ metadata, baseUrl, reason: `Set ${RECOVERY_FLAG}=1 to run the controlled Windows native recovery proof.` });
  }
  if (!isLiveWindowsNativePlaybackProofEnabled(env)) {
    return buildBlockedRecoveryProof({ metadata, baseUrl, reason: 'Set PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF=1 as well; recovery proof reuses the live native playback safety gate.' });
  }
  if (process.platform !== 'win32') {
    return buildBlockedRecoveryProof({ metadata, baseUrl, reason: `Controlled native recovery proof is Windows-only; current platform is ${process.platform}.` });
  }

  const before = await requestJson(baseUrl, { key: 'before_restart_playback_contract', method: 'GET', path: '/api/runtime/playback/current?limit=50' }, runtimeMode);
  const beforeItem = selectBrowserPlaybackItem(before.payload);
  if (!before.ok || !beforeItem) {
    return createProofEnvelope({
      proofKind: 'live_windows_native_recovery',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'FAILED',
      runtimeMode: 'live_windows_recovery_opt_in',
      evidence: { environment: getProofEnvironment(), base_url: baseUrl, stage_results: [before], before_item: beforeItem },
      knownLimitations: ['The proof could not capture a selected/current playback item before restart.'],
    });
  }

  return createProofEnvelope({
    proofKind: 'live_windows_native_recovery',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: 'BLOCKED',
    runtimeMode: 'live_windows_recovery_opt_in',
    evidence: {
      environment: getProofEnvironment(),
      base_url: baseUrl,
      before_item: beforeItem,
      plan: buildLiveWindowsNativeRecoveryPlan(),
      next_action: 'Use the dedicated Windows recovery launcher to own API stop/restart before marking this proof PASSED.',
    },
    knownLimitations: ['This runner captured pre-restart state only; controlled API restart orchestration must be performed by the Windows launcher.'],
  });
}
