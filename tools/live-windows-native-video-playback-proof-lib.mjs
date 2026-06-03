/**
 * Live Windows native video playback proof library for PF_login.
 * Keeps video launch evidence separate from the existing image/native proof.
 * Blocks safely unless a real Windows operator opts in and a video item is current/next.
 * Reuses the native playback route proof so production playback behavior stays unchanged.
 * Writes only sanitized, bounded evidence into proof artifacts.
 */
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import {
  isLiveWindowsNativePlaybackProofEnabled,
  requestJson,
  runLiveWindowsNativePlaybackProof,
  selectBrowserPlaybackItem,
  summarizeMediaTypeCoverage,
} from './live-windows-native-playback-proof-lib.mjs';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8787';
const VIDEO_PROOF_FLAG = 'PF_LIVE_WINDOWS_NATIVE_VIDEO_PLAYBACK_PROOF';

/** Returns true only when the operator explicitly enables the Windows video proof. */
export function isLiveWindowsNativeVideoPlaybackProofEnabled(env = process.env) {
  return env[VIDEO_PROOF_FLAG] === '1' || env[VIDEO_PROOF_FLAG] === 'true';
}

/** Builds the video proof route plan for docs/tests without launching a player. */
export function buildLiveWindowsNativeVideoPlaybackRoutePlan() {
  return [
    'GET /api/runtime/playback/current?limit=50',
    'POST /api/native-playback/detect',
    'POST /api/native-playback/start-current',
    'GET /api/native-playback/status',
    'POST /api/native-playback/stop',
  ];
}

/** Returns true when the current/next item is a video item that start-current can launch. */
export function canStartCurrentOrNextVideoItem(playbackPayload) {
  const selected = selectBrowserPlaybackItem(playbackPayload);
  return Boolean(selected && String(selected.mediaType ?? '').toLowerCase() === 'video');
}

/** Creates a safe BLOCKED envelope for unmet video proof prerequisites. */
function buildBlockedVideoProof({ metadata, baseUrl, reason, playbackPayload = null }) {
  return createProofEnvelope({
    proofKind: 'live_windows_native_video_playback',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: 'BLOCKED',
    runtimeMode: 'live_windows_video_opt_in',
    evidence: {
      reason,
      enable_flag: VIDEO_PROOF_FLAG,
      base_url: baseUrl,
      route_plan: buildLiveWindowsNativeVideoPlaybackRoutePlan(),
      browser_item: playbackPayload ? selectBrowserPlaybackItem(playbackPayload) : null,
      media_type_coverage: playbackPayload ? summarizeMediaTypeCoverage(playbackPayload, ['video']) : null,
    },
    knownLimitations: ['No live Windows native video playback was launched because the video proof prerequisites were not satisfied.'],
  });
}

/** Runs the live Windows native video proof against an already-running backend. */
export async function runLiveWindowsNativeVideoPlaybackProof({ metadata, env = process.env }) {
  const baseUrl = env.PF_API_BASE_URL ?? DEFAULT_BASE_URL;
  const runtimeMode = env.PF_LIVE_WINDOWS_NATIVE_PLAYBACK_RUNTIME_MODE ?? 'test';
  if (!isLiveWindowsNativeVideoPlaybackProofEnabled(env)) {
    return buildBlockedVideoProof({ metadata, baseUrl, reason: `Set ${VIDEO_PROOF_FLAG}=1 to run the live Windows native video playback proof.` });
  }
  if (!isLiveWindowsNativePlaybackProofEnabled(env)) {
    return buildBlockedVideoProof({ metadata, baseUrl, reason: 'Set PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF=1 as well; video proof reuses the live native playback safety gate.' });
  }
  if (process.platform !== 'win32') {
    return buildBlockedVideoProof({ metadata, baseUrl, reason: `Live native video playback proof is Windows-only; current platform is ${process.platform}.` });
  }

  const currentResult = await requestJson(baseUrl, { key: 'browser_playback_contract', method: 'GET', path: '/api/runtime/playback/current?limit=50' }, runtimeMode);
  if (!currentResult.ok) {
    return createProofEnvelope({
      proofKind: 'live_windows_native_video_playback',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'FAILED',
      runtimeMode: 'live_windows_video_opt_in',
      evidence: { environment: getProofEnvironment(), base_url: baseUrl, failed_route: currentResult.key, stage_results: [currentResult] },
      knownLimitations: ['The proof could not inspect the browser playback contract.'],
    });
  }
  if (!canStartCurrentOrNextVideoItem(currentResult.payload)) {
    return buildBlockedVideoProof({
      metadata,
      baseUrl,
      playbackPayload: currentResult.payload,
      reason: 'The current/next playback item is not video. Prepare a READY video item as current/next before running this live video proof.',
    });
  }

  const envelope = await runLiveWindowsNativePlaybackProof({
    metadata,
    env: {
      ...env,
      PF_LIVE_WINDOWS_NATIVE_PLAYBACK_EXPECT_MEDIA_TYPES: 'video',
      PF_LIVE_WINDOWS_NATIVE_PLAYBACK_WORKER_AUTOSTART: '',
    },
  });
  return {
    ...envelope,
    proof_kind: 'live_windows_native_video_playback',
    runtime_mode: 'live_windows_video_opt_in',
    known_limitations: [
      ...(envelope.known_limitations ?? []),
      'This video proof proves native route/process status for a video current/next item; it does not inspect monitor pixels.',
    ],
  };
}
