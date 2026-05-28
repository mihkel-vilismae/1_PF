/*
 * Defines the View B/B5 activity-detection test model.
 * The model is UI/test-state only and does not claim real PIR hardware telemetry.
 * Fullscreen playback reuse is intentionally deferred to the later Goal 3 slice.
 */
export const B5_ACTIVITY_SOURCES = ['pir', 'mouse', 'keyboard'] as const;

export type B5ActivitySource = (typeof B5_ACTIVITY_SOURCES)[number];
export type B5ActivityPhase = 'idle' | 'countdown' | 'detecting' | 'complete';
export type B5ActivityResultStatus = 'pending' | 'detected' | 'not_detected' | 'skipped' | 'unavailable';

export type B5ActivityResult = {
  status: B5ActivityResultStatus;
  message: string;
};

export type B5ActivityDetectionState = {
  selectedSources: Record<B5ActivitySource, boolean>;
  phase: B5ActivityPhase;
  countdownValue: number | null;
  detectionWindowSeconds: number;
  startedAt: string | null;
  completedAt: string | null;
  pirAvailability: 'backend_dependent' | 'available' | 'unavailable';
  results: Record<B5ActivitySource, B5ActivityResult>;
};

// Builds the neutral View B/B5 activity-test state used before any run starts.
export function createDefaultB5ActivityDetectionState(): B5ActivityDetectionState {
  return {
    selectedSources: {
      pir: true,
      mouse: true,
      keyboard: true,
    },
    phase: 'idle',
    countdownValue: null,
    detectionWindowSeconds: 5,
    startedAt: null,
    completedAt: null,
    pirAvailability: 'backend_dependent',
    results: {
      pir: buildB5ActivityResult('pending'),
      mouse: buildB5ActivityResult('pending'),
      keyboard: buildB5ActivityResult('pending'),
    },
  };
}

// Builds a stable display result for one activity source.
export function buildB5ActivityResult(status: B5ActivityResultStatus): B5ActivityResult {
  const messages: Record<B5ActivityResultStatus, string> = {
    pending: 'Waiting for test run.',
    detected: 'Activity detected during the test window.',
    not_detected: 'No activity detected during the test window.',
    skipped: 'Source skipped because it was not selected.',
    unavailable: 'No verified real source is available in this repo yet.',
  };

  return { status, message: messages[status] };
}

// Returns a human-readable source label for View B/B5 rendering and history logs.
export function getB5ActivitySourceLabel(source: B5ActivitySource): string {
  const labels: Record<B5ActivitySource, string> = {
    pir: 'PIR sensor',
    mouse: 'Mouse movement',
    keyboard: 'Keyboard activity',
  };
  return labels[source];
}

// Narrows arbitrary UI/input values to known View B/B5 activity sources.
export function isB5ActivitySource(value: unknown): value is B5ActivitySource {
  return typeof value === 'string' && (B5_ACTIVITY_SOURCES as readonly string[]).includes(value);
}

// Creates a safe clone of the activity state with defaults filled in.
export function normalizeB5ActivityDetectionState(value: unknown): B5ActivityDetectionState {
  const fallback = createDefaultB5ActivityDetectionState();
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }

  const candidate = value as Partial<B5ActivityDetectionState>;
  return {
    ...fallback,
    ...candidate,
    selectedSources: {
      ...fallback.selectedSources,
      ...(candidate.selectedSources ?? {}),
    },
    results: {
      ...fallback.results,
      ...(candidate.results ?? {}),
    },
  };
}
