/*
 * Compatibility facade for V2 dashboard recovery endpoints.
 *
 * v0.10.86 routes save/load/restart/emulated power-off behavior through the
 * decoupled recovery service. The legacy envelope shape is preserved so the
 * existing dashboard/API callers keep working while the durable implementation
 * is now swappable through PF_V2_RECOVERY_ENGINE.
 */
import path from 'node:path';
import { createRecoveryService } from '../services/recovery/recoveryService.ts';
import type {
  PlaybackResumeTarget,
  RecoveryCheckResult,
  RecoveryMode,
  RecoverySnapshot,
  RecoverySnapshotSource,
  RecoveryService,
} from '../services/recovery/recoveryContract.ts';
import {
  V2_RECOVERY_STATE_SCHEMA_VERSION,
  createEmptyV2RecoveryStateSnapshot,
  normalizeV2RecoveryStateSnapshotInput,
  validateV2RecoveryStateSnapshot,
  type V2RecoveryStateSaveReason,
  type V2RecoveryStateSnapshot,
} from '../../shared/v2RecoveryStateSchema.ts';

type RecoveryServiceOptions = {
  repoRoot: string;
  bootId?: string;
  bootStartedAtIso?: string;
};

type RecoveryBootRecord = {
  schemaVersion: 1;
  bootId: string;
  startedAtIso: string;
  recordedAtIso: string;
};

export type V2RecoverySaveSource = 'manual' | 'autosave' | 'pre-shutdown' | 'restart-check';

export type V2RecoveryStateEnvelope = {
  status: 'missing' | 'saved' | 'loaded' | 'autosaved' | 'restart-checked';
  snapshot: V2RecoveryStateSnapshot | null;
  validation: ReturnType<typeof validateV2RecoveryStateSnapshot>;
  stateFile: string;
  schemaVersion: typeof V2_RECOVERY_STATE_SCHEMA_VERSION;
  source?: V2RecoverySaveSource;
  recoveryInProcess?: boolean;
  possibleRestartDetected?: boolean;
  previousBoot?: RecoveryBootRecord | null;
  currentBoot?: RecoveryBootRecord;
  recoveryEngine?: string;
  recoverySnapshot?: RecoverySnapshot | null;
  recoveryCheck?: RecoveryCheckResult;
  resumeTarget?: PlaybackResumeTarget;
  message: string;
};

function normalizeRecoveryMode(value: unknown): RecoveryMode {
  return value === 'test' ? 'test' : 'real';
}

function mapSource(source: V2RecoverySaveSource, reason: V2RecoveryStateSaveReason): RecoverySnapshotSource {
  if (source === 'manual') return 'manual';
  if (source === 'pre-shutdown' || reason === 'pre-shutdown') return 'automatic';
  if (source === 'restart-check' || reason === 'restart-detected') return 'worker-start';
  return 'automatic';
}

function toRecoverySaveInput(snapshot: V2RecoveryStateSnapshot, source: V2RecoverySaveSource, mode: RecoveryMode) {
  return {
    mode,
    source: mapSource(source, snapshot.reason),
    reason: snapshot.reason,
    snapshot,
    playback: {
      currentMediaId: snapshot.playback.currentMediaId ?? undefined,
      currentMediaPath: snapshot.playback.currentFilename ?? undefined,
      mediaKind: snapshot.playback.mediaKind,
      queueCursorIndex: snapshot.playback.queueCursorIndex ?? undefined,
      queueLength: snapshot.playback.queueLength,
      playbackPositionSeconds: snapshot.playback.playbackPositionSeconds ?? undefined,
      resumePolicy: snapshot.playback.currentMediaId || snapshot.playback.currentFilename ? 'same-media' : 'safe-queue-position',
    },
    queue: snapshot.queue,
    pipeline: snapshot.pipeline,
    regularWorker: {
      activeStage: snapshot.pipeline.activeStage === 'playback' || snapshot.pipeline.activeStage === 'idle' ? 'none' : snapshot.pipeline.activeStage,
    },
    notes: snapshot.notes,
  } as const;
}

function toLegacySnapshot(snapshot: RecoverySnapshot | null, savedAtIso = new Date().toISOString()): V2RecoveryStateSnapshot | null {
  if (!snapshot) return null;
  const legacy = createEmptyV2RecoveryStateSnapshot(snapshot.createdAt || savedAtIso, 'restart-detected');
  legacy.playback.currentMediaId = snapshot.playback?.currentMediaId ?? null;
  legacy.playback.currentFilename = snapshot.playback?.currentMediaPath ?? null;
  legacy.playback.mediaKind = snapshot.playback?.mediaKind ?? 'unknown';
  legacy.playback.queueCursorIndex = snapshot.playback?.queueCursorIndex ?? null;
  legacy.playback.queueLength = snapshot.playback?.queueLength ?? 0;
  legacy.playback.playbackPositionSeconds = snapshot.playback?.playbackPositionSeconds ?? null;
  legacy.pipeline.activeStage = snapshot.regularWorker?.activeStage === 'none' ? 'idle' : snapshot.regularWorker?.activeStage ?? 'unknown';
  legacy.notes = [
    `Loaded through recoveryService canonicalState createdBy=${snapshot.metadata?.createdByEngine ?? 'unknown'}.`,
    ...(snapshot.validation.warnings ?? []),
  ];
  return legacy;
}

function buildEnvelope({
  status,
  legacySnapshot,
  stateFilePath,
  source,
  recoveryService,
  recoverySnapshot,
  recoveryCheck,
  resumeTarget,
  message,
}: {
  status: V2RecoveryStateEnvelope['status'];
  legacySnapshot: V2RecoveryStateSnapshot | null;
  stateFilePath: string;
  source?: V2RecoverySaveSource;
  recoveryService: RecoveryService;
  recoverySnapshot?: RecoverySnapshot | null;
  recoveryCheck?: RecoveryCheckResult;
  resumeTarget?: PlaybackResumeTarget;
  message: string;
}): V2RecoveryStateEnvelope {
  const validation = validateV2RecoveryStateSnapshot(legacySnapshot);
  return {
    status,
    snapshot: legacySnapshot,
    validation,
    stateFile: stateFilePath,
    schemaVersion: V2_RECOVERY_STATE_SCHEMA_VERSION,
    source,
    recoveryInProcess: Boolean(recoveryCheck?.possibleRestartDetected || recoverySnapshot),
    possibleRestartDetected: recoveryCheck?.possibleRestartDetected,
    recoveryEngine: recoveryService.getActiveEngine(),
    recoverySnapshot: recoverySnapshot ?? null,
    recoveryCheck,
    resumeTarget,
    message,
  };
}

export function createV2RecoveryStateService({ repoRoot, bootId = `boot-${Date.now()}`, bootStartedAtIso = new Date().toISOString() }: RecoveryServiceOptions) {
  const recoveryDirectory = path.join(repoRoot, 'runtime_data', 'recovery');
  const stateFilePath = path.join(recoveryDirectory, 'latest_recovery_snapshot.json');
  const recoveryService = createRecoveryService({ repoRoot });

  async function saveSnapshot(input: unknown, reason: V2RecoveryStateSaveReason = 'manual-save', source: V2RecoverySaveSource = 'manual'): Promise<V2RecoveryStateEnvelope> {
    const savedAtIso = new Date().toISOString();
    const legacySnapshot = normalizeV2RecoveryStateSnapshotInput(input, savedAtIso, reason);
    legacySnapshot.reason = reason;
    legacySnapshot.savedAtIso = savedAtIso;
    const validation = validateV2RecoveryStateSnapshot(legacySnapshot);
    if (!validation.ok) {
      return {
        status: 'missing',
        snapshot: legacySnapshot,
        validation,
        stateFile: stateFilePath,
        schemaVersion: V2_RECOVERY_STATE_SCHEMA_VERSION,
        source,
        recoveryEngine: recoveryService.getActiveEngine(),
        recoverySnapshot: null,
        message: `Recovery snapshot rejected: ${validation.errors.join('; ')}`,
      };
    }

    const recoverySnapshot = await recoveryService.saveState(toRecoverySaveInput(legacySnapshot, source, 'real'));
    const resumeTarget = await recoveryService.getPlaybackResumeTarget({ mode: 'real', snapshot: recoverySnapshot });
    return buildEnvelope({
      status: source === 'autosave' || reason === 'autosave-stage-change' || reason === 'pre-shutdown' ? 'autosaved' : 'saved',
      legacySnapshot,
      stateFilePath,
      source,
      recoveryService,
      recoverySnapshot,
      resumeTarget,
      message: `Recovery snapshot ${source === 'manual' ? 'saved' : 'autosaved'} through ${recoveryService.getActiveEngine()} for ${legacySnapshot.playback.currentFilename ?? 'no selected media'}.`,
    });
  }

  async function loadSnapshot(): Promise<V2RecoveryStateEnvelope> {
    const recoverySnapshot = await recoveryService.loadLatestState({ mode: 'real' });
    const legacySnapshot = toLegacySnapshot(recoverySnapshot);
    const resumeTarget = await recoveryService.getPlaybackResumeTarget({ mode: 'real', snapshot: recoverySnapshot });
    return buildEnvelope({
      status: legacySnapshot ? 'loaded' : 'missing',
      legacySnapshot,
      stateFilePath,
      recoveryService,
      recoverySnapshot,
      resumeTarget,
      message: legacySnapshot
        ? `Recovery snapshot loaded through ${recoveryService.getActiveEngine()}. Same-media restart is allowed; exact timestamp is not required.`
        : 'No V2 recovery snapshot has been saved yet.',
    });
  }

  async function readStatus(): Promise<V2RecoveryStateEnvelope> {
    const recoverySnapshot = await recoveryService.loadLatestState({ mode: 'real' });
    const legacySnapshot = toLegacySnapshot(recoverySnapshot);
    const resumeTarget = await recoveryService.getPlaybackResumeTarget({ mode: 'real', snapshot: recoverySnapshot });
    return buildEnvelope({
      status: legacySnapshot ? 'loaded' : 'missing',
      legacySnapshot,
      stateFilePath,
      recoveryService,
      recoverySnapshot,
      resumeTarget,
      message: legacySnapshot ? 'V2 recovery snapshot is available through recoveryService.' : 'No V2 recovery snapshot is available.',
    });
  }

  async function checkRestart(): Promise<V2RecoveryStateEnvelope> {
    const recoveryCheck = await recoveryService.checkRestart({ mode: 'real', source: 'api-restart-check' });
    const recoverySnapshot = await recoveryService.loadLatestState({ mode: 'real' });
    const legacySnapshot = toLegacySnapshot(recoverySnapshot);
    return {
      ...buildEnvelope({
        status: 'restart-checked',
        legacySnapshot,
        stateFilePath,
        source: 'restart-check',
        recoveryService,
        recoverySnapshot,
        recoveryCheck,
        resumeTarget: recoveryCheck.resumeTarget,
        message: recoveryCheck.possibleRestartDetected
          ? 'Possible restart detected with a valid recovery snapshot available through recoveryService.'
          : 'Restart check completed through recoveryService; no recovery action is required.',
      }),
      previousBoot: null,
      currentBoot: {
        schemaVersion: 1,
        bootId,
        startedAtIso: bootStartedAtIso,
        recordedAtIso: new Date().toISOString(),
      },
    };
  }

  async function emulatePowerOff(input: unknown = {}): Promise<V2RecoveryStateEnvelope> {
    const saved = await saveSnapshot(input, 'pre-shutdown', 'pre-shutdown');
    await recoveryService.markUncleanShutdown({
      mode: normalizeRecoveryMode(saved.recoverySnapshot?.mode),
      source: 'emulate-power-off',
      snapshotId: saved.recoverySnapshot?.snapshotId,
      reason: 'Guarded emulated power-off marker. Physical power-loss proof is deferred to a later physical-proof release.',
    });
    return {
      ...saved,
      status: 'autosaved',
      source: 'pre-shutdown',
      recoveryInProcess: true,
      possibleRestartDetected: true,
      message: `${saved.message} Emulated power-off flag written through recoveryService for the next restart check.`,
    };
  }

  async function getPlaybackResumeTarget(): Promise<PlaybackResumeTarget> {
    return recoveryService.getPlaybackResumeTarget({ mode: 'real' });
  }

  return {
    stateFilePath,
    recoveryService,
    saveSnapshot,
    loadSnapshot,
    readStatus,
    checkRestart,
    emulatePowerOff,
    getPlaybackResumeTarget,
  };
}
