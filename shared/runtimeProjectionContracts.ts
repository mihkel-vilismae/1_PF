/**
 * Runtime projection contracts
 *
 * This module defines enums, types and interfaces used for describing runtime state
 * projections in the 12_PF dashboard.  These contracts are framework‑agnostic
 * and may be imported by backend services and frontend UI components alike.
 *
 * Sources denote where each field in a runtime projection originates.
 * Namespaces indicate which runtime data set is being described (real, test, demo).
 * RuntimeField encapsulates a value along with its source of truth.
 *
 * NOTE: This file defines contracts only.  It does not implement any runtime logic
 * and does not perform any I/O.
 */

/**
 * Enumeration of possible sources for runtime projection fields.
 *
 * - db – The value originates from the SQLite database (durable truth).
 * - lock – The value originates from an OS lock file used for process coordination.
 * - heartbeat – The value originates from a periodic heartbeat or health check.
 * - log – The value originates from an application log entry.
 * - computed – The value is derived from other fields or inferred by the backend.
 * - projection – The value comes from another projection (e.g. cached snapshot).
 * - unknown – The origin of the value is unknown or not yet classified.
 */
export const RUNTIME_PROJECTION_SOURCES = Object.freeze({
  db: 'db',
  lock: 'lock',
  heartbeat: 'heartbeat',
  log: 'log',
  computed: 'computed',
  projection: 'projection',
  unknown: 'unknown',
} as const);

/**
 * Type alias for runtime projection sources.
 */
export type RuntimeProjectionSource =
  (typeof RUNTIME_PROJECTION_SOURCES)[keyof typeof RUNTIME_PROJECTION_SOURCES];

/**
 * Enumeration of runtime namespaces.
 *
 * Real runtime refers to the live production environment.
 * Test runtime refers to automated tests or generated data sets.
 * Demo runtime refers to UI simulation or local demo data.
 */
export const RUNTIME_NAMESPACES = Object.freeze({
  realRuntime: 'realRuntime',
  testRuntime: 'testRuntime',
  demoRuntime: 'demoRuntime',
} as const);

/**
 * Type alias for runtime namespaces.
 */
export type RuntimeNamespace = (typeof RUNTIME_NAMESPACES)[keyof typeof RUNTIME_NAMESPACES];

/**
 * Generic wrapper for a runtime projection field.
 *
 * A RuntimeField holds a value of type T along with the source from which it
 * originates.  The value may be null if the field is unavailable; the source
 * must always be specified to avoid conflating derived values with durable truth.
 */
export interface RuntimeField<T> {
  /** The value of the field, or null if unavailable. */
  value: T | null;
  /** The origin of the value. */
  source: RuntimeProjectionSource;
}

/**
 * Minimal shape for worker health state.
 *
 * Additional fields (e.g. lastHeartbeatAt, error messages) may be added in future
 * slices as the runtime monitor evolves.  A simple status string is used here
 * to keep the contract low‑risk for the initial slice.
 */
export interface WorkerHealthState {
  /** The worker's status, such as 'idle', 'running', 'error' or 'unknown'. */
  status: string;
  /** Optional human‑readable message describing the worker's state. */
  message?: string;
}

/**
 * Projection of health for one or more workers.
 *
 * The keys in the projection should correspond to named worker types (e.g.
 * pipeline, playback, screen) and each entry holds a RuntimeField with the
 * worker's health state.
 */
export interface WorkerHealthProjection {
  [workerName: string]: RuntimeField<WorkerHealthState>;
}

/**
 * Projection of the last orchestration run.
 *
 * This projection summarises the most recent completed pipeline orchestration.
 * Fields may be null if the pipeline has never run.  The projection is read‑only.
 */
export interface LastRunProjection {
  /** Identifier of the last run (e.g. a UUID). */
  runId: RuntimeField<string>;
  /** ISO timestamp when the run started. */
  startedAt: RuntimeField<string>;
  /** ISO timestamp when the run completed, or null if still running. */
  completedAt: RuntimeField<string | null>;
  /** High‑level status string (e.g. 'success', 'error', 'partial', 'unknown'). */
  status: RuntimeField<string>;
}

/**
 * Projection of playback state.
 *
 * This projection describes the state of the media playback queue and current
 * playback selection.  It intentionally omits media contents or render details.
 */
export interface PlaybackProjection {
  /** Number of items currently in the queue. */
  queueSize: RuntimeField<number>;
  /** Identifier of the currently selected item, or null if none selected. */
  currentItemId: RuntimeField<string | null>;
  /** Whether playback is actively running. */
  isPlaying: RuntimeField<boolean>;
}

/**
 * Projection of screen state.
 *
 * This projection summarises high‑level screen capabilities and last render time.
 * Details about media rendering, hardware drivers or full screen operations are
 * intentionally omitted in this initial contract.
 */
export interface ScreenProjection {
  /** Whether preview rendering is available. */
  previewAvailable: RuntimeField<boolean>;
  /** Whether fullscreen rendering is available. */
  fullscreenAvailable: RuntimeField<boolean>;
  /** ISO timestamp when content was last rendered on screen, or null if never rendered. */
  lastRenderedAt: RuntimeField<string | null>;
}

/**
 * Combined live runtime projection.
 *
 * This projection aggregates various aspects of runtime state into a single
 * structure used by live monitors (e.g. View D).  Each nested projection uses
 * RuntimeField wrappers to preserve provenance.  Additional fields may be added
 * in future slices.
 */
export interface LiveRuntimeProjection {
  /** The namespace this projection describes (real, test or demo). */
  namespace: RuntimeNamespace;
  /** High‑level run state string (e.g. 'idle', 'running', 'error', 'unknown'). */
  runState: RuntimeField<string>;
  /** Projection of worker health by worker name. */
  workerHealth: WorkerHealthProjection;
  /** Projection of playback state. */
  playback: PlaybackProjection;
  /** Projection of screen state. */
  screen: ScreenProjection;
  /** Optional ISO timestamp for the most recent heartbeat, if applicable. */
  lastHeartbeatAt?: RuntimeField<string>;
}

/**
 * Envelope used by API responses returning a runtime projection.
 *
 * The envelope indicates whether the request was handled successfully (ok) and
 * includes the namespace and the projection payload.  Additional metadata may
 * be added in future slices (e.g. version, timestamp).
 */
export interface RuntimeProjectionEnvelope<T> {
  /** Whether the projection retrieval was successful. */
  ok: boolean;
  /** The namespace of the projection. */
  namespace: RuntimeNamespace;
  /** The projection payload itself. */
  projection: T;
}
