import type {
  ClearUncleanShutdownInput,
  LoadRecoveryStateInput,
  MarkUncleanShutdownInput,
  PlaybackResumeInput,
  PlaybackResumeTarget,
  RecoveryCheckInput,
  RecoveryCheckResult,
  RecoveryEngine,
  RecoveryEngineInfo,
  RecoveryMutationResult,
  RecoveryServiceOptions,
  SaveRecoveryStateInput,
  WorkerRecoveryCheckpointInput,
} from '../recoveryContract.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function notImplemented(operation: string, mode: 'test' | 'real' = 'real'): RecoveryMutationResult {
  return {
    schemaVersion: 'recovery.mutation.v1',
    recoveryEngine: 'v2-stub',
    mode,
    status: 'not_implemented',
    operation,
    createdAt: nowIso(),
    warnings: ['v2-stub is selectable to prove decoupling, but it intentionally does not persist recovery state in v0.10.86.'],
    errors: [],
  };
}

function normalizeMode(value: unknown): 'test' | 'real' {
  return value === 'test' ? 'test' : 'real';
}

export function createRecoveryV2StubEngine(_options: RecoveryServiceOptions): RecoveryEngine {
  return {
    getActiveEngine: () => 'v2-stub',
    getEngineInfo: (): RecoveryEngineInfo => ({
      engineId: 'v2-stub',
      label: 'Recovery V2 Stub Engine',
      version: '0.10.86-stub',
      storage: 'stub',
      implemented: false,
      notes: ['Selectable stub for future truth-replay or DB-backed recovery engines.'],
    }),
    async saveState(input: SaveRecoveryStateInput = {}) {
      const mode = normalizeMode(input.mode);
      return {
        schemaVersion: 'recovery.snapshot.v1',
        recoveryEngine: 'v2-stub',
        snapshotId: `v2-stub-${Date.now()}`,
        createdAt: nowIso(),
        mode,
        source: input.source ?? 'manual',
        validation: {
          ok: false,
          warnings: ['v2-stub selected; no durable state was written.'],
          errors: ['v2-stub recovery engine is not implemented in v0.10.86.'],
        },
      };
    },
    async loadLatestState(_input: LoadRecoveryStateInput = {}) {
      return null;
    },
    async markUncleanShutdown(input: MarkUncleanShutdownInput = {}) {
      return notImplemented('markUncleanShutdown', normalizeMode(input.mode));
    },
    async clearUncleanShutdown(input: ClearUncleanShutdownInput = {}) {
      return notImplemented('clearUncleanShutdown', normalizeMode(input.mode));
    },
    async checkRestart(input: RecoveryCheckInput = {}): Promise<RecoveryCheckResult> {
      const mode = normalizeMode(input.mode);
      return {
        schemaVersion: 'recovery.check.v1',
        recoveryEngine: 'v2-stub',
        checkedAt: nowIso(),
        mode,
        status: 'not_implemented',
        possibleRestartDetected: false,
        uncleanShutdownFlagPresent: false,
        snapshotFound: false,
        snapshotValid: false,
        warnings: ['v2-stub selected; restart detection is intentionally not implemented in v0.10.86.'],
        errors: [],
      };
    },
    async getPlaybackResumeTarget(input: PlaybackResumeInput = {}): Promise<PlaybackResumeTarget> {
      return {
        schemaVersion: 'recovery.playbackResumeTarget.v1',
        recoveryEngine: 'v2-stub',
        mode: normalizeMode(input.mode),
        decision: 'none',
        reason: 'v2-stub recovery engine is selectable but not operational in v0.10.86.',
        confidence: 'low',
      };
    },
    async recordWorkerCheckpoint(input: WorkerRecoveryCheckpointInput) {
      return notImplemented(`recordWorkerCheckpoint:${input.worker}:${input.event}`, normalizeMode(input.mode));
    },
  };
}
