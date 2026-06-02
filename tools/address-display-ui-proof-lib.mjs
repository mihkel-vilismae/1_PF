/**
 * Deterministic dashboard UI proof for address display rendering.
 * Builds local runtime state and renders the display-facing playback UI only.
 * Asserts semantic fragments instead of brittle full-page snapshots.
 * Proves address, missing-address fallback, and path redaction boundaries.
 * Does not call or mutate production backend behavior.
 */
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { OS_PLAYBACK_PLATFORMS } from '../dashboard/services/osPlaybackViewModel.ts';
import { renderOsPlaybackFullscreenOverlay, renderOsPlaybackView } from '../dashboard/views/osPlaybackView.ts';

const EXPECTED_ADDRESS = 'Tartu maantee 1, Tallinn, Estonia';
const EXPECTED_DISPLAY_NAME = 'address-display-ui-proof.jpg';
const FALLBACK_DISPLAY_NAME = 'missing-address-ui-proof.jpg';
const MISSING_ADDRESS_FALLBACK = 'Address pending until GPS/geocode stages produce a resolved address.';
const SAFE_DISPLAY_URL = '/api/runtime/playback/media?assetId=7001';
const SAFE_FALLBACK_DISPLAY_URL = '/api/runtime/playback/media?assetId=7002';
const UNSAFE_PATH_FIXTURES = Object.freeze([
  'C:\\Users\\mihke\\Pictures\\private\\address-display-ui-proof.jpg',
  '/home/mihkel/private/address-display-ui-proof.jpg',
  'runtime_data/downloads/private/address-display-ui-proof.jpg',
]);
const UNSAFE_OUTPUT_PATTERNS = Object.freeze([
  /C:\\Users\\/i,
  /\/home\/[^\s"'<>]+/i,
  /runtime_data\/downloads/i,
  /test_runtime_data\/downloads/i,
  /canonicalPath/i,
  /private\\address-display-ui-proof/i,
  /private\/address-display-ui-proof/i,
]);

/** Builds deterministic runtime state for a selected item with address evidence. */
function buildSelectedAddressState({ fullscreen = false } = {}) {
  const state = createInitialState();
  state.osPlayback = {
    windows: {
      status: 'ready',
      contract: {
        status: 'ready',
        messages: ['Current playback item has resolved address evidence.'],
        mediaBasePath: UNSAFE_PATH_FIXTURES[0],
        playback: {
          currentItem: {
            mediaAssetId: 7001,
            displayName: EXPECTED_DISPLAY_NAME,
            mediaType: 'image',
            queueStatus: 'READY',
            resolvedAddress: EXPECTED_ADDRESS,
            hasResolvedAddress: true,
            displayUrl: SAFE_DISPLAY_URL,
            canonicalPath: UNSAFE_PATH_FIXTURES[1],
            rawFilesystemPath: UNSAFE_PATH_FIXTURES[2],
          },
          items: [
            {
              mediaAssetId: 7001,
              displayName: EXPECTED_DISPLAY_NAME,
              mediaType: 'image',
              queueStatus: 'READY',
              resolvedAddress: EXPECTED_ADDRESS,
              hasResolvedAddress: true,
              displayUrl: SAFE_DISPLAY_URL,
              canonicalPath: UNSAFE_PATH_FIXTURES[1],
              rawFilesystemPath: UNSAFE_PATH_FIXTURES[2],
            },
          ],
          queue: { totalCount: 1, readyCount: 1, failedCount: 0, returnedCount: 1 },
        },
      },
    },
  };
  state.osPlaybackRotation = {
    windows: {
      activeIndex: 0,
      paused: true,
      fullscreen,
      intervalSeconds: 12,
    },
  };
  return state;
}

/** Builds deterministic runtime state for a selected item that lacks address evidence. */
function buildMissingAddressState({ fullscreen = false } = {}) {
  const state = createInitialState();
  state.osPlayback = {
    windows: {
      status: 'ready',
      contract: {
        status: 'ready',
        messages: ['Current playback item is selected but has no resolved address yet.'],
        mediaBasePath: UNSAFE_PATH_FIXTURES[0],
        playback: {
          currentItem: {
            mediaAssetId: 7002,
            displayName: FALLBACK_DISPLAY_NAME,
            mediaType: 'image',
            queueStatus: 'READY',
            hasResolvedAddress: false,
            displayUrl: SAFE_FALLBACK_DISPLAY_URL,
            canonicalPath: UNSAFE_PATH_FIXTURES[1],
          },
          items: [
            {
              mediaAssetId: 7002,
              displayName: FALLBACK_DISPLAY_NAME,
              mediaType: 'image',
              queueStatus: 'READY',
              hasResolvedAddress: false,
              displayUrl: SAFE_FALLBACK_DISPLAY_URL,
              canonicalPath: UNSAFE_PATH_FIXTURES[1],
            },
          ],
          queue: { totalCount: 1, readyCount: 1, failedCount: 0, returnedCount: 1 },
        },
      },
    },
  };
  state.osPlaybackRotation = {
    windows: {
      activeIndex: 0,
      paused: true,
      fullscreen,
      intervalSeconds: 12,
    },
  };
  return state;
}

/** Returns whether every unsafe fixture pattern is absent from rendered markup. */
function hasNoUnsafeFilesystemExposure(markup) {
  return UNSAFE_OUTPUT_PATTERNS.every((pattern) => !pattern.test(markup));
}

/** Evaluates address-display UI semantics without storing full rendered snapshots. */
export function evaluateAddressDisplayUiProof() {
  const selectedViewMarkup = renderOsPlaybackView(buildSelectedAddressState(), OS_PLAYBACK_PLATFORMS.windows);
  const selectedFullscreenMarkup = renderOsPlaybackFullscreenOverlay(buildSelectedAddressState({ fullscreen: true }));
  const missingViewMarkup = renderOsPlaybackView(buildMissingAddressState(), OS_PLAYBACK_PLATFORMS.windows);
  const missingFullscreenMarkup = renderOsPlaybackFullscreenOverlay(buildMissingAddressState({ fullscreen: true }));

  const assertions = {
    selected_view_has_playback_stage: selectedViewMarkup.includes('data-os-playback-stage="windows"'),
    selected_view_has_media_name: selectedViewMarkup.includes(EXPECTED_DISPLAY_NAME),
    selected_view_has_resolved_address_label: selectedViewMarkup.includes('Resolved address'),
    selected_view_has_expected_address: selectedViewMarkup.includes(EXPECTED_ADDRESS),
    selected_view_uses_safe_media_url: selectedViewMarkup.includes(`src="${SAFE_DISPLAY_URL}`),
    selected_fullscreen_has_overlay: selectedFullscreenMarkup.includes('data-os-playback-fullscreen-overlay="windows"'),
    selected_fullscreen_has_expected_address: selectedFullscreenMarkup.includes(EXPECTED_ADDRESS),
    selected_fullscreen_uses_safe_media_url: selectedFullscreenMarkup.includes(`src="${SAFE_DISPLAY_URL}`),
    missing_view_has_fallback_copy: missingViewMarkup.includes(MISSING_ADDRESS_FALLBACK),
    missing_fullscreen_has_fallback_copy: missingFullscreenMarkup.includes(MISSING_ADDRESS_FALLBACK),
    selected_view_omits_unsafe_paths: hasNoUnsafeFilesystemExposure(selectedViewMarkup),
    selected_fullscreen_omits_unsafe_paths: hasNoUnsafeFilesystemExposure(selectedFullscreenMarkup),
    missing_view_omits_unsafe_paths: hasNoUnsafeFilesystemExposure(missingViewMarkup),
    missing_fullscreen_omits_unsafe_paths: hasNoUnsafeFilesystemExposure(missingFullscreenMarkup),
  };

  return {
    expectedAddress: EXPECTED_ADDRESS,
    fallbackAddressCopy: MISSING_ADDRESS_FALLBACK,
    unsafePathFixtureCount: UNSAFE_PATH_FIXTURES.length,
    renderedMarkupMetrics: {
      selectedViewLength: selectedViewMarkup.length,
      selectedFullscreenLength: selectedFullscreenMarkup.length,
      missingViewLength: missingViewMarkup.length,
      missingFullscreenLength: missingFullscreenMarkup.length,
    },
    semanticFragments: [
      { name: 'playback-stage-container', present: assertions.selected_view_has_playback_stage },
      { name: 'selected-media-name', present: assertions.selected_view_has_media_name },
      { name: 'resolved-address-label', present: assertions.selected_view_has_resolved_address_label },
      { name: 'selected-address-text', present: assertions.selected_view_has_expected_address },
      { name: 'safe-backend-media-url', present: assertions.selected_view_uses_safe_media_url },
      { name: 'fullscreen-overlay', present: assertions.selected_fullscreen_has_overlay },
      { name: 'fullscreen-address-text', present: assertions.selected_fullscreen_has_expected_address },
      { name: 'missing-address-fallback-view', present: assertions.missing_view_has_fallback_copy },
      { name: 'missing-address-fallback-fullscreen', present: assertions.missing_fullscreen_has_fallback_copy },
    ],
    assertions,
  };
}

/** Runs the deterministic dashboard UI proof and returns a sanitized proof envelope. */
export async function runAddressDisplayUiProof({ metadata }) {
  const evaluated = evaluateAddressDisplayUiProof();
  const proofPassed = Object.values(evaluated.assertions).every(Boolean);

  return createProofEnvelope({
    proofKind: 'address_display_ui',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: proofPassed ? 'PASSED' : 'FAILED',
    runtimeMode: 'deterministic_local_ui_render',
    evidence: {
      environment: getProofEnvironment(),
      expected_address: evaluated.expectedAddress,
      fallback_address_copy: evaluated.fallbackAddressCopy,
      semantic_fragments: evaluated.semanticFragments,
      assertions: evaluated.assertions,
      rendered_markup_metrics: evaluated.renderedMarkupMetrics,
      unsafe_path_fixture_count: evaluated.unsafePathFixtureCount,
      snapshot_policy: 'Full HTML snapshots are intentionally not stored; only semantic fragment assertions and markup metrics are recorded.',
      verified_contracts: [
        'selected playback item with address evidence renders into the Windows playback surface',
        'selected playback item with address evidence renders into the fullscreen display overlay',
        'missing-address selected item renders the existing pending-address fallback copy',
        'raw filesystem path-like fields are ignored by the display-facing renderer',
      ],
    },
    knownLimitations: proofPassed
      ? ['This proof renders deterministic dashboard HTML in Node; it does not launch a browser, backend server, or physical display.']
      : ['One or more deterministic dashboard UI semantic assertions failed.'],
  });
}
