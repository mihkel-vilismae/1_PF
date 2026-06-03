/**
 * Live Windows native playback proof library for PF_login.
 * Keeps real OS fullscreen launch opt-in and Windows-only.
 * Verifies browser/native selected item identity through existing routes.
 * Can additionally exercise playback_worker native auto-start when enabled.
 * Writes only sanitized, bounded evidence into proof artifacts.
 */
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';

const ENABLE_FLAG = 'PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF';
const WORKER_FLAG = 'PF_LIVE_WINDOWS_NATIVE_PLAYBACK_WORKER_AUTOSTART';
const DEFAULT_BASE_URL = 'http://127.0.0.1:8787';
const DEFAULT_EXPECTED_MEDIA_TYPES = Object.freeze(['image', 'video']);

/** Returns true only when the operator explicitly enables real Windows native playback. */
export function isLiveWindowsNativePlaybackProofEnabled(env = process.env) {
  return env[ENABLE_FLAG] === '1' || env[ENABLE_FLAG] === 'true';
}

/** Returns true when the live proof should also exercise playback_worker auto-start. */
export function shouldRunPlaybackWorkerAutoStart(env = process.env) {
  return env[WORKER_FLAG] === '1' || env[WORKER_FLAG] === 'true';
}

/** Parses the comma-separated expected media type list for image/video coverage reporting. */
export function parseExpectedMediaTypes(value = '') {
  const parsed = String(value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const allowed = parsed.filter((entry) => entry === 'image' || entry === 'video');
  return allowed.length ? [...new Set(allowed)] : [...DEFAULT_EXPECTED_MEDIA_TYPES];
}

/** Builds the route plan used by the direct route live proof. */
export function buildLiveWindowsNativePlaybackRoutePlan() {
  return [
    { key: 'browser_playback_contract', method: 'GET', path: '/api/runtime/playback/current?limit=50' },
    { key: 'native_status_before', method: 'GET', path: '/api/native-playback/status' },
    { key: 'native_detect', method: 'POST', path: '/api/native-playback/detect' },
    { key: 'native_start_current', method: 'POST', path: '/api/native-playback/start-current' },
    { key: 'native_status_after_start', method: 'GET', path: '/api/native-playback/status' },
    { key: 'native_stop_owned', method: 'POST', path: '/api/native-playback/stop' },
  ];
}

/** Builds the route plan used after playback_worker native auto-start. */
export function buildLiveWindowsWorkerAutostartRoutePlan() {
  return [
    { key: 'browser_playback_contract', method: 'GET', path: '/api/runtime/playback/current?limit=50' },
    { key: 'native_status_before', method: 'GET', path: '/api/native-playback/status' },
    { key: 'native_detect', method: 'POST', path: '/api/native-playback/detect' },
    { key: 'native_status_after_worker_autostart', method: 'GET', path: '/api/native-playback/status' },
    { key: 'native_stop_owned', method: 'POST', path: '/api/native-playback/stop' },
  ];
}

/** Performs one JSON request against an already-running PF_login backend. */
export async function requestJson(baseUrl, route, runtimeMode = 'test') {
  const response = await fetch(new URL(route.path, baseUrl), {
    method: route.method,
    headers: { 'content-type': 'application/json', 'x-pf-runtime-mode': runtimeMode },
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { parse_error: 'non_json_response', text_tail: text.slice(-1000) };
  }
  return { key: route.key, method: route.method, path: route.path, status: response.status, ok: response.ok, payload: sanitizeEvidence(payload) };
}

/** Extracts the browser playback item that native playback should use. */
export function selectBrowserPlaybackItem(playbackPayload) {
  const playback = playbackPayload?.playback;
  const item = playback?.currentItem ?? playback?.nextItem ?? null;
  return item
    ? {
        mediaAssetId: String(item.mediaAssetId),
        displayName: item.displayName ?? null,
        mediaType: item.mediaType ?? null,
        displayUrl: item.displayUrl ?? null,
        resolvedAddress: item.resolvedAddress ?? null,
        isCurrent: Boolean(item.isCurrent),
      }
    : null;
}

/** Summarizes image/video availability in the browser playback queue. */
export function summarizeMediaTypeCoverage(playbackPayload, expectedMediaTypes = DEFAULT_EXPECTED_MEDIA_TYPES) {
  const items = Array.isArray(playbackPayload?.playback?.items) ? playbackPayload.playback.items : [];
  const present = [...new Set(items.map((item) => String(item.mediaType ?? '').toLowerCase()).filter(Boolean))].sort();
  const missing = expectedMediaTypes.filter((type) => !present.includes(type));
  return { expected: expectedMediaTypes, present, missing, hasAllExpected: missing.length === 0 };
}

/** Parses the playback_worker stdout JSON and extracts the selected media item. */
export function extractWorkerSelectedItem(workerResult) {
  const parsed = parseWorkerStdoutJson(workerResult?.stdout);
  const selected = parsed?.selectedItemSummary ?? parsed?.selection?.selectedItemSummary ?? parsed?.selection?.playback?.selected ?? null;
  return selected?.mediaAssetId
    ? {
        mediaAssetId: String(selected.mediaAssetId),
        displayName: selected.displayName ?? null,
        mediaType: selected.mediaType ?? null,
        addressText: selected.addressText ?? null,
        selectedAt: selected.selectedAt ?? null,
      }
    : null;
}

/**
 * Normalizes legacy sanitizer placeholders so worker stdout remains JSON-parseable.
 * Older proof evidence can contain unquoted [REDACTED] values inside JSON output.
 */
function normalizeSanitizedWorkerJson(text) {
  return String(text ?? '').replace(/:\s*\[REDACTED\](?=\s*[,}])/g, ': "[REDACTED]"');
}

/** Parses worker stdout even when surrounding log lines or sanitized placeholders are present. */
export function parseWorkerStdoutJson(stdout) {
  if (!stdout) {
    return null;
  }
  const text = String(stdout).trim();
  const candidates = [text, normalizeSanitizedWorkerJson(text)];
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }
  const sliced = text.slice(firstBrace, lastBrace + 1);
  for (const candidate of [sliced, normalizeSanitizedWorkerJson(sliced)]) {
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  return null;
}

/** Selects the browser item that should align with the worker-selected item when available. */
export function selectWorkerAutostartComparisonItem(browserItem, workerSelectedItem) {
  return workerSelectedItem?.mediaAssetId ? workerSelectedItem : browserItem;
}

/** Verifies that native status is running the same selected item as the browser contract. */
export function compareNativeAndBrowserItems(browserItem, nativeStatusPayload) {
  const nativeStatus = nativeStatusPayload?.nativePlayback ?? nativeStatusPayload?.nativePlayback?.nativePlayback ?? null;
  const nativeItem = nativeStatusPayload?.nativePlayback ?? null;
  const status = nativeItem?.status ?? nativeStatus?.status ?? null;
  const nativeMediaAssetId = nativeItem?.currentMediaAssetId ?? nativeStatus?.currentMediaAssetId ?? null;
  return {
    browserMediaAssetId: browserItem?.mediaAssetId ?? null,
    nativeMediaAssetId: nativeMediaAssetId ? String(nativeMediaAssetId) : null,
    nativeStatus: status,
    sameMediaAsset: Boolean(browserItem?.mediaAssetId && nativeMediaAssetId && String(browserItem.mediaAssetId) === String(nativeMediaAssetId)),
    nativeMediaType: nativeItem?.currentMediaType ?? nativeStatus?.currentMediaType ?? null,
    nativePidPresent: typeof (nativeItem?.pid ?? nativeStatus?.pid) === 'number',
    commandSummaryPresent: typeof (nativeItem?.lastCommandSummary ?? nativeStatus?.lastCommandSummary) === 'string',
  };
}

/** Builds a BLOCKED proof envelope when live Windows prerequisites are not satisfied. */
export function buildBlockedLiveWindowsNativePlaybackProof({ metadata, baseUrl, reason, expectedMediaTypes }) {
  return createProofEnvelope({
    proofKind: 'live_windows_native_playback',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: 'BLOCKED',
    runtimeMode: 'live_windows_opt_in',
    evidence: {
      reason,
      enable_flag: ENABLE_FLAG,
      worker_flag: WORKER_FLAG,
      base_url: baseUrl,
      planned_routes: buildLiveWindowsNativePlaybackRoutePlan().map((route) => `${route.method} ${route.path}`),
      expected_media_types: expectedMediaTypes,
      safety: [
        'Native playback remains disabled by default.',
        'The proof must be explicitly enabled before launching a real OS player.',
        'Stop action targets the owned native playback process only.',
      ],
    },
    knownLimitations: ['No real native player was launched because the live Windows proof prerequisites were not satisfied.'],
  });
}

/** Runs the optional playback_worker auto-start path using the repo CLI entrypoint. */
async function runPlaybackWorkerAutoStart({ cwd, env }) {
  const command = process.execPath;
  const args = ['--import', 'tsx', 'server/index.ts', '--scheduler', 'playback-worker'];
  return runCommand(command, args, {
    cwd,
    env: {
      ...process.env,
      ...env,
      NATIVE_PLAYBACK_ENABLED: 'true',
      NATIVE_PLAYBACK_AUTO_START_ON_WORKER: 'true',
      NATIVE_PLAYBACK_FULLSCREEN: 'true',
      NATIVE_PLAYBACK_PLAYER: env.NATIVE_PLAYBACK_PLAYER ?? 'mpv',
    },
    timeoutMs: Number(env.PF_LIVE_WINDOWS_NATIVE_PLAYBACK_WORKER_TIMEOUT_MS ?? '45000'),
    forceKillGraceMs: 5000,
  });
}

/** Runs the Windows-only live proof against an already-running backend. */
export async function runLiveWindowsNativePlaybackProof({ metadata, cwd = process.cwd(), env = process.env }) {
  const baseUrl = env.PF_API_BASE_URL ?? DEFAULT_BASE_URL;
  const runtimeMode = env.PF_LIVE_WINDOWS_NATIVE_PLAYBACK_RUNTIME_MODE ?? 'test';
  const expectedMediaTypes = parseExpectedMediaTypes(env.PF_LIVE_WINDOWS_NATIVE_PLAYBACK_EXPECT_MEDIA_TYPES);
  if (!isLiveWindowsNativePlaybackProofEnabled(env)) {
    return buildBlockedLiveWindowsNativePlaybackProof({ metadata, baseUrl, expectedMediaTypes, reason: `Set ${ENABLE_FLAG}=1 to run the live Windows native playback proof.` });
  }
  if (process.platform !== 'win32') {
    return buildBlockedLiveWindowsNativePlaybackProof({ metadata, baseUrl, expectedMediaTypes, reason: `Live native fullscreen proof is Windows-only; current platform is ${process.platform}.` });
  }

  const stageResults = [];
  const routePlan = buildLiveWindowsNativePlaybackRoutePlan();
  const currentResult = await requestJson(baseUrl, routePlan[0], runtimeMode);
  stageResults.push(currentResult);
  const browserItem = selectBrowserPlaybackItem(currentResult.payload);
  const mediaTypeCoverage = summarizeMediaTypeCoverage(currentResult.payload, expectedMediaTypes);
  if (!currentResult.ok || !browserItem) {
    return createProofEnvelope({
      proofKind: 'live_windows_native_playback',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'FAILED',
      runtimeMode: 'live_windows_opt_in',
      evidence: { environment: getProofEnvironment(), base_url: baseUrl, stage_results: stageResults, browser_item: browserItem, media_type_coverage: mediaTypeCoverage },
      knownLimitations: ['The browser playback contract did not expose a current or next playback item.'],
    });
  }

  const workerRequired = shouldRunPlaybackWorkerAutoStart(env);
  let workerResult = null;
  let workerSelectedItem = null;
  let comparisonTargetItem = browserItem;

  const initialStatusResult = await requestJson(baseUrl, routePlan[1], runtimeMode);
  stageResults.push(initialStatusResult);
  if (!initialStatusResult.ok) {
    return createProofEnvelope({
      proofKind: 'live_windows_native_playback',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'FAILED',
      runtimeMode: 'live_windows_opt_in',
      evidence: { environment: getProofEnvironment(), base_url: baseUrl, failed_route: initialStatusResult.key, stage_results: stageResults, browser_item: browserItem, media_type_coverage: mediaTypeCoverage },
      knownLimitations: ['The proof stopped at the first failed native playback status route.'],
    });
  }

  const detectResult = await requestJson(baseUrl, routePlan[2], runtimeMode);
  stageResults.push(detectResult);
  if (!detectResult.ok) {
    return createProofEnvelope({
      proofKind: 'live_windows_native_playback',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'FAILED',
      runtimeMode: 'live_windows_opt_in',
      evidence: { environment: getProofEnvironment(), base_url: baseUrl, failed_route: detectResult.key, stage_results: stageResults, browser_item: browserItem, media_type_coverage: mediaTypeCoverage },
      knownLimitations: ['The proof stopped at the native playback detection route.'],
    });
  }

  if (workerRequired) {
    workerResult = await runPlaybackWorkerAutoStart({ cwd, env });
    workerSelectedItem = extractWorkerSelectedItem(workerResult);
    comparisonTargetItem = selectWorkerAutostartComparisonItem(browserItem, workerSelectedItem);

    const workerStatusResult = await requestJson(baseUrl, { key: 'native_status_after_worker_autostart', method: 'GET', path: '/api/native-playback/status' }, runtimeMode);
    stageResults.push(workerStatusResult);
    if (!workerStatusResult.ok) {
      return createProofEnvelope({
        proofKind: 'live_windows_native_playback',
        baselineVersion: metadata.version,
        gitCommit: metadata.gitCommit,
        proofStatus: 'FAILED',
        runtimeMode: 'live_windows_opt_in',
        evidence: { environment: getProofEnvironment(), base_url: baseUrl, failed_route: workerStatusResult.key, stage_results: stageResults, browser_item: browserItem, worker_selected_item: workerSelectedItem, media_type_coverage: mediaTypeCoverage, worker_result: workerResult },
        knownLimitations: ['The worker-autostart proof could not read native playback status after playback_worker ran.'],
      });
    }

    const stopResult = await requestJson(baseUrl, routePlan[5], runtimeMode);
    stageResults.push(stopResult);
    if (!stopResult.ok) {
      return createProofEnvelope({
        proofKind: 'live_windows_native_playback',
        baselineVersion: metadata.version,
        gitCommit: metadata.gitCommit,
        proofStatus: 'FAILED',
        runtimeMode: 'live_windows_opt_in',
        evidence: { environment: getProofEnvironment(), base_url: baseUrl, failed_route: stopResult.key, stage_results: stageResults, browser_item: browserItem, worker_selected_item: workerSelectedItem, media_type_coverage: mediaTypeCoverage, worker_result: workerResult },
        knownLimitations: ['The worker-autostart proof could not stop the owned native playback process.'],
      });
    }
  } else {
    for (const route of routePlan.slice(3)) {
      const result = await requestJson(baseUrl, route, runtimeMode);
      stageResults.push(result);
      if (!result.ok) {
        return createProofEnvelope({
          proofKind: 'live_windows_native_playback',
          baselineVersion: metadata.version,
          gitCommit: metadata.gitCommit,
          proofStatus: 'FAILED',
          runtimeMode: 'live_windows_opt_in',
          evidence: { environment: getProofEnvironment(), base_url: baseUrl, failed_route: route.key, stage_results: stageResults, browser_item: browserItem, media_type_coverage: mediaTypeCoverage, worker_result: workerResult },
          knownLimitations: ['The proof stopped at the first failed live native playback route.'],
        });
      }
    }
  }

  const nativeAfterStart = stageResults.find((entry) => entry.key === 'native_status_after_worker_autostart' || entry.key === 'native_status_after_start')?.payload;
  const itemComparison = compareNativeAndBrowserItems(comparisonTargetItem, nativeAfterStart);
  const stopPayload = stageResults.find((entry) => entry.key === 'native_stop_owned')?.payload;
  const stoppedOwned = stopPayload?.nativePlayback?.status === 'stopped';
  const workerPassed = !workerRequired || (workerResult?.exitCode === 0 && !workerResult?.timedOut && Boolean(workerSelectedItem?.mediaAssetId));
  const livePassed = itemComparison.sameMediaAsset && itemComparison.nativeStatus === 'running' && itemComparison.nativePidPresent && stoppedOwned && workerPassed;
  const imageVideoCoverageLimitation = mediaTypeCoverage.hasAllExpected
    ? 'The queue contained the expected image/video media type coverage; the live launch still proves the selected item only.'
    : `The queue did not contain all expected media types: missing ${mediaTypeCoverage.missing.join(', ')}. This is recorded as a coverage limitation, not as failure of image-only native playback proof.`;

  return createProofEnvelope({
    proofKind: 'live_windows_native_playback',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: livePassed ? 'PASSED' : 'FAILED',
    runtimeMode: 'live_windows_opt_in',
    evidence: {
      environment: getProofEnvironment(),
      base_url: baseUrl,
      runtime_mode_header: runtimeMode,
      browser_item: browserItem,
      worker_selected_item: workerSelectedItem,
      comparison_target_item: comparisonTargetItem,
      proof_mode: workerRequired ? 'worker_autostart_native_playback' : 'direct_route_native_playback',
      media_type_coverage: mediaTypeCoverage,
      item_comparison: itemComparison,
      worker_autostart_requested: workerRequired,
      worker_result: workerResult,
      stage_results: stageResults,
      stopped_owned_native_process: stoppedOwned,
    },
    knownLimitations: [
      imageVideoCoverageLimitation,
      'This proof is Windows-only and does not prove Raspberry HDMI or Raspberry cron behavior.',
      'This proof observes native route/process status; it cannot visually inspect monitor focus or pixels without an external screen capture proof.',
      'Restart recovery is not proven unless the operator runs this proof after a real restart with native auto-start enabled.',
    ],
  });
}
