/*
 * Defines the B4 playback rendering contract shared by preview and fullscreen modes.
 * The module is state-only today; later UI and worker slices can consume it without
 * inventing separate rendering libraries for each presentation mode.
 */

export const PLAYBACK_RENDERING_LIBRARY = Object.freeze({
  id: 'browser-native-media-renderer',
  label: 'Browser native media renderer',
  summary: 'Uses the same browser image/video rendering path for preview-window and fullscreen presentation.',
});

export const PLAYBACK_RENDERING_MODES = Object.freeze({
  withoutRendering: 'playback-without-rendering',
  previewWindow: 'show-real-rendering-in-preview-window',
  fullscreen: 'switch-to-fullscreen',
} as const);

export const PLAYBACK_RENDERING_PLATFORMS = Object.freeze({
  windows: 'windows',
  raspberryOs: 'raspberry-os',
} as const);

export type PlaybackRenderingMode = (typeof PLAYBACK_RENDERING_MODES)[keyof typeof PLAYBACK_RENDERING_MODES];
export type PlaybackRenderingPlatform = (typeof PLAYBACK_RENDERING_PLATFORMS)[keyof typeof PLAYBACK_RENDERING_PLATFORMS];

export type PlaybackRenderingState = {
  mode: PlaybackRenderingMode;
  platform: PlaybackRenderingPlatform;
};

export type PlaybackRenderingOption = {
  value: PlaybackRenderingMode;
  label: string;
  description: string;
  usesSharedRenderer: boolean;
  enabled: boolean;
};

export type PlaybackRenderingPlatformOption = {
  value: PlaybackRenderingPlatform;
  label: string;
  description: string;
};

export const PLAYBACK_RENDERING_MODE_OPTIONS = Object.freeze([
  {
    value: PLAYBACK_RENDERING_MODES.withoutRendering,
    label: 'Playback without rendering',
    description: 'Selects the backend playback item without rendering media in the dashboard.',
    usesSharedRenderer: false,
  },
  {
    value: PLAYBACK_RENDERING_MODES.previewWindow,
    label: 'Show real rendering in preview window',
    description: 'Uses the shared browser-native media renderer inside the B4 preview window.',
    usesSharedRenderer: true,
  },
  {
    value: PLAYBACK_RENDERING_MODES.fullscreen,
    label: 'Switch to fullscreen',
    description: 'Uses the same browser-native media renderer, presented through fullscreen mode.',
    usesSharedRenderer: true,
  },
] as const);

export const PLAYBACK_RENDERING_PLATFORM_OPTIONS = Object.freeze([
  {
    value: PLAYBACK_RENDERING_PLATFORMS.windows,
    label: 'Windows',
    description: 'Windows rendering target; playback selection stays backend-owned and unchanged.',
  },
  {
    value: PLAYBACK_RENDERING_PLATFORMS.raspberryOs,
    label: 'Raspberry OS',
    description: 'Raspberry OS rendering target; playback selection stays backend-owned and unchanged.',
  },
] as const);

// Creates the default B4 rendering state used before the Run action selects media.
export function createDefaultPlaybackRenderingState(): PlaybackRenderingState {
  return {
    mode: PLAYBACK_RENDERING_MODES.withoutRendering,
    platform: PLAYBACK_RENDERING_PLATFORMS.windows,
  };
}

// Returns rendering options with preview/fullscreen gated behind active playback.
export function buildPlaybackRenderingOptions(playbackReady: boolean): PlaybackRenderingOption[] {
  return PLAYBACK_RENDERING_MODE_OPTIONS.map((option) => ({
    ...option,
    enabled: option.value === PLAYBACK_RENDERING_MODES.withoutRendering || playbackReady,
  }));
}

// Confirms preview-window and fullscreen modes are bound to the same renderer.
export function getSharedPlaybackRendererId(mode: PlaybackRenderingMode): string | null {
  if (mode === PLAYBACK_RENDERING_MODES.previewWindow || mode === PLAYBACK_RENDERING_MODES.fullscreen) {
    return PLAYBACK_RENDERING_LIBRARY.id;
  }
  return null;
}

// Normalizes persisted or UI-provided rendering state to the supported B4 contract.
export function normalizePlaybackRenderingState(value: Partial<PlaybackRenderingState> | null | undefined): PlaybackRenderingState {
  const modes = new Set<PlaybackRenderingMode>(Object.values(PLAYBACK_RENDERING_MODES));
  const platforms = new Set<PlaybackRenderingPlatform>(Object.values(PLAYBACK_RENDERING_PLATFORMS));
  const fallback = createDefaultPlaybackRenderingState();
  return {
    mode: modes.has(value?.mode as PlaybackRenderingMode) ? value?.mode as PlaybackRenderingMode : fallback.mode,
    platform: platforms.has(value?.platform as PlaybackRenderingPlatform) ? value?.platform as PlaybackRenderingPlatform : fallback.platform,
  };
}
