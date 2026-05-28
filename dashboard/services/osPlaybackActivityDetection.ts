/*
 * Adapts the proven View B/B5 activity source model for OS fullscreen playback.
 * This module stays presentation/state focused and does not claim real PIR input
 * unless a verified backend or hardware source is introduced by a later slice.
 */
import {
  B5_ACTIVITY_SOURCES,
  getB5ActivitySourceLabel,
  type B5ActivitySource,
} from './viewBActivityDetection.ts';

export const OS_PLAYBACK_ACTIVITY_KEEP_AWAKE_SECONDS = 30;
export const OS_PLAYBACK_ACTIVITY_SOURCES = B5_ACTIVITY_SOURCES;

export type OsPlaybackActivitySource = B5ActivitySource;
export type OsPlaybackActivityStatus = 'idle' | 'monitoring' | 'activity_detected' | 'unavailable';
export type OsPlaybackActivityAvailability = 'backend_dependent' | 'available' | 'unavailable';

export type OsPlaybackActivityState = {
  selectedSources: Record<OsPlaybackActivitySource, boolean>;
  monitoring: boolean;
  lastActivityAtIso: string | null;
  lastActivitySource: OsPlaybackActivitySource | null;
  keepAwakeUntilIso: string | null;
  pirAvailability: OsPlaybackActivityAvailability;
  statusMessage: string;
};

export type OsPlaybackActivityEventOptions = {
  nowIso: string;
  source: OsPlaybackActivitySource;
  keepAwakeSeconds?: number;
};

// Builds neutral fullscreen playback activity state from the same sources proven in View B/B5.
export function createDefaultOsPlaybackActivityState(): OsPlaybackActivityState {
  return {
    selectedSources: {
      pir: true,
      mouse: true,
      keyboard: true,
    },
    monitoring: false,
    lastActivityAtIso: null,
    lastActivitySource: null,
    keepAwakeUntilIso: null,
    pirAvailability: 'backend_dependent',
    statusMessage: 'Fullscreen activity monitoring is idle.',
  };
}

// Creates a safe clone of playback activity state with missing fields restored.
export function normalizeOsPlaybackActivityState(value: unknown): OsPlaybackActivityState {
  const fallback = createDefaultOsPlaybackActivityState();
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }

  const candidate = value as Partial<OsPlaybackActivityState>;
  return {
    ...fallback,
    ...candidate,
    selectedSources: {
      ...fallback.selectedSources,
      ...(candidate.selectedSources ?? {}),
    },
  };
}

// Starts playback activity monitoring while preserving any selected-source preferences.
export function startOsPlaybackActivityMonitoring(value: unknown): OsPlaybackActivityState {
  const state = normalizeOsPlaybackActivityState(value);
  return {
    ...state,
    monitoring: true,
    statusMessage: 'Fullscreen playback is monitoring selected activity sources.',
  };
}

// Stops playback activity monitoring without erasing the last visible activity summary.
export function stopOsPlaybackActivityMonitoring(value: unknown): OsPlaybackActivityState {
  const state = normalizeOsPlaybackActivityState(value);
  return {
    ...state,
    monitoring: false,
    keepAwakeUntilIso: null,
    statusMessage: 'Fullscreen activity monitoring is idle.',
  };
}

// Applies one selected activity event and extends the presentation keep-awake window.
export function applyOsPlaybackActivityEvent(
  value: unknown,
  options: OsPlaybackActivityEventOptions,
): OsPlaybackActivityState {
  const state = normalizeOsPlaybackActivityState(value);
  if (!state.monitoring || !state.selectedSources[options.source]) {
    return state;
  }
  if (options.source === 'pir' && state.pirAvailability !== 'available') {
    return {
      ...state,
      statusMessage: 'PIR activity is unavailable until a verified backend source is added.',
    };
  }

  const keepAwakeSeconds = options.keepAwakeSeconds ?? OS_PLAYBACK_ACTIVITY_KEEP_AWAKE_SECONDS;
  const keepAwakeUntilIso = new Date(Date.parse(options.nowIso) + keepAwakeSeconds * 1000).toISOString();
  return {
    ...state,
    lastActivityAtIso: options.nowIso,
    lastActivitySource: options.source,
    keepAwakeUntilIso,
    statusMessage: `${getB5ActivitySourceLabel(options.source)} detected; fullscreen keep-awake window extended.`,
  };
}

// Returns the shared human-readable label for a playback activity source.
export function getOsPlaybackActivitySourceLabel(source: OsPlaybackActivitySource): string {
  return getB5ActivitySourceLabel(source);
}
