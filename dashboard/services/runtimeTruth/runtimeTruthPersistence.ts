import { loadPersistedRuntimeTruth, savePersistedRuntimeTruth } from '../runtimeTruthPersistenceService.ts';
import { RUNTIME_TRUTH_SEED_PATH, buildInitialTruthState } from './runtimeTruthState.ts';

const RUNTIME_TRUTH_PERSIST_INTERVAL_MS = 250;
const RUNTIME_TRUTH_PERSIST_WARNING_INTERVAL_MS = 10000;
let lastPersistenceWarningAt = 0;

export type RuntimeTruthSnapshot = ReturnType<typeof buildInitialTruthState>;

export interface RuntimeTruthHostState {
  truth: RuntimeTruthSnapshot;
}

export interface RuntimeTruthPersistenceQueueOptions {
  immediate?: boolean;
}

export type RuntimeTruthPatchState<TState extends RuntimeTruthHostState = RuntimeTruthHostState> = (
  mutator: (draft: TState) => void,
) => void;

export type RuntimeTruthHistoryPusher = (
  source: string,
  type: string,
  message: string,
  details?: unknown,
) => void;

export interface RuntimeTruthPersistenceDependencies<TState extends RuntimeTruthHostState = RuntimeTruthHostState> {
  getState: () => TState;
  patchState: RuntimeTruthPatchState<TState>;
  pushHistory: RuntimeTruthHistoryPusher;
  warnPersistence?: (error: unknown) => void;
}

export interface RuntimeTruthPersistenceApi {
  getTruthSignature: (truthState: RuntimeTruthSnapshot) => string;
  queueRuntimeTruthPersistence: (options?: RuntimeTruthPersistenceQueueOptions) => void;
  initializeRuntimeTruthPersistence: () => Promise<void>;
  noteLocalTruthMutation: () => void;
}

export function createRuntimeTruthPersistence<TState extends RuntimeTruthHostState>({
  getState,
  patchState,
  pushHistory,
  warnPersistence = warnRuntimeTruthPersistence,
}: RuntimeTruthPersistenceDependencies<TState>): RuntimeTruthPersistenceApi {
  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  let persistInFlight = false;
  let persistRequestedWhileInFlight = false;
  let hasLocalTruthMutationSinceBoot = false;
  let lastPersistedTruthSignature: string | null = null;

  function queueRuntimeTruthPersistence({ immediate = false }: RuntimeTruthPersistenceQueueOptions = {}): void {
    if (persistTimer !== null) {
      return;
    }
    const delayMs = immediate ? 0 : RUNTIME_TRUTH_PERSIST_INTERVAL_MS;
    persistTimer = setTimeout(() => {
      persistTimer = null;
      void flushRuntimeTruthPersistence();
    }, delayMs);
  }

  async function flushRuntimeTruthPersistence(): Promise<void> {
    const truthSnapshot = normalizeTruthSnapshot(getState().truth);
    const signature = JSON.stringify(truthSnapshot);

    if (signature === lastPersistedTruthSignature) {
      return;
    }

    if (persistInFlight) {
      persistRequestedWhileInFlight = true;
      return;
    }

    persistInFlight = true;
    try {
      const persistedTruth = await savePersistedRuntimeTruth(truthSnapshot);
      lastPersistedTruthSignature = JSON.stringify(normalizeTruthSnapshot(persistedTruth ?? truthSnapshot));
    } catch (error) {
      warnPersistence(error);
    } finally {
      persistInFlight = false;
      if (persistRequestedWhileInFlight) {
        persistRequestedWhileInFlight = false;
        queueRuntimeTruthPersistence({ immediate: true });
      }
    }
  }

  async function initializeRuntimeTruthPersistence(): Promise<void> {
    try {
      const persistedTruth = await loadPersistedRuntimeTruth();
      if (persistedTruth && !hasLocalTruthMutationSinceBoot) {
        // Keep the current boot path honest but hydrate from disk when safe.
        patchState((draft) => {
          draft.truth = normalizeTruthSnapshot(persistedTruth);
        });
        hasLocalTruthMutationSinceBoot = false;
        pushHistory('TRUTH', 'info', 'Runtime truth hydrated from conf/runtime-truth.json.');
      }
      if (persistedTruth) {
        lastPersistedTruthSignature = JSON.stringify(normalizeTruthSnapshot(persistedTruth));
      }
    } catch {
      // Keep local seed as fallback when backend persistence is unavailable.
    } finally {
      queueRuntimeTruthPersistence({ immediate: true });
    }
  }

  function noteLocalTruthMutation(): void {
    hasLocalTruthMutationSinceBoot = true;
  }

  return {
    getTruthSignature,
    queueRuntimeTruthPersistence,
    initializeRuntimeTruthPersistence,
    noteLocalTruthMutation,
  };
}

export function normalizeTruthSnapshot(value: unknown): RuntimeTruthSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return buildInitialTruthState();
  }
  const normalized = structuredClone(value) as RuntimeTruthSnapshot;
  normalized.sourceOfTruth = RUNTIME_TRUTH_SEED_PATH;
  return normalized;
}

export function getTruthSignature(truthState: RuntimeTruthSnapshot): string {
  return JSON.stringify(normalizeTruthSnapshot(truthState));
}

function warnRuntimeTruthPersistence(error: unknown): void {
  const now = Date.now();
  if (now - lastPersistenceWarningAt < RUNTIME_TRUTH_PERSIST_WARNING_INTERVAL_MS) {
    return;
  }
  lastPersistenceWarningAt = now;
  console.warn('[runtimeTruth] Failed to persist conf/runtime-truth.json.', getRuntimeTruthErrorMessage(error));
}

function getRuntimeTruthErrorMessage(error: unknown): unknown {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return error;
}
