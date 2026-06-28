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
import {
  SUPPORTED_RECOVERY_SNAPSHOT_SCHEMA_VERSIONS,
  isRecoverySnapshot,
  normalizeRecoveryMode,
  normalizeRecoverySnapshot,
  nowIso,
} from '../recoverySnapshotContract.ts';

function notImplemented(operation: string, mode: 'test' | 'real' = 'real'): RecoveryMutationResult {
  return {
    schemaVersion: 'recovery.mutation.v1',
    recoveryEngine: 'v2-stub',
    mode,
    status: 'not_implemented',
    operation,
    createdAt: nowIso(),
    warnings: ['v2-stub is selectable to prove strategy decoupling, but it intentionally does not persist recovery state in this slice.'],
    errors: [],
  };
}

export function createRecoveryV2StubEngine(_options: RecoveryServiceOptions): RecoveryEngine {
  return {
    getActiveEngine: () => 'v2-stub',
    getEngineInfo: (): RecoveryEngineInfo => ({
      engineId: 'v2-stub',
      label: 'Recovery V2 Stub Strategy',
      version: '0.10.87-stub',
      storage: 'stub',
      implemented: false,
      strategyRole: 'stub-strategy',
      supportedSnapshotSchemaVersions: [...SUPPORTED_RECOVERY_SNAPSHOT_SCHEMA_VERSIONS],
      notes: [
        'Selectable stub for future recovery strategies.',
        'Understands the canonical recovery.snapshot.v1 schema but does not persist durable recovery state.',
      ],
    }),
    async saveState(input: SaveRecoveryStateInput = {}) {
      const snapshot = normalizeRecoverySnapshot(input, { createdByEngine: 'v2-stub' });
      snapshot.validation.warnings.push('v2-stub normalized canonical state but did not persist it durably.');
      return snapshot;
    },
    async loadLatestState(_input: LoadRecoveryStateInput = {}) {
      return null;
    },
    async markUncleanShutdown(input: MarkUncleanShutdownInput = {}) {
      return notImplemented('markUncleanShutdown', normalizeRecoveryMode(input.mode));
    },
    async clearUncleanShutdown(input: ClearUncleanShutdownInput = {}) {
      return notImplemented('clearUncleanShutdown', normalizeRecoveryMode(input.mode));
    },
    async checkRestart(input: RecoveryCheckInput = {}): Promise<RecoveryCheckResult> {
      const mode = normalizeRecoveryMode(input.mode);
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
        warnings: ['v2-stub selected; restart detection strategy is intentionally not implemented yet.'],
        errors: [],
      };
    },
    async getPlaybackResumeTarget(input: PlaybackResumeInput = {}): Promise<PlaybackResumeTarget> {
      const mode = normalizeRecoveryMode(input.mode);
      const canonicalSnapshot = isRecoverySnapshot(input.snapshot)
        ? normalizeRecoverySnapshot({ snapshot: input.snapshot }, { createdByEngine: input.snapshot.metadata?.createdByEngine ?? 'v2-stub' })
        : null;
      return {
        schemaVersion: 'recovery.playbackResumeTarget.v1',
        recoveryEngine: 'v2-stub',
        mode: canonicalSnapshot?.mode ?? mode,
        decision: 'none',
        reason: canonicalSnapshot?.validation.ok
          ? 'v2-stub understood the canonical snapshot schema but has no production resume strategy yet.'
          : 'v2-stub recovery strategy is selectable but not operational yet.',
        confidence: 'low',
      };
    },
    async recordWorkerCheckpoint(input: WorkerRecoveryCheckpointInput) {
      return notImplemented(`recordWorkerCheckpoint:${input.worker}:${input.event}`, normalizeRecoveryMode(input.mode));
    },
  };
}
