/*
 * File-backed V2 recovery state persistence used by manual save/load and
 * autosave/restart gates. It stores no secrets and intentionally restores only
 * lightweight same-media/queue context.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  V2_RECOVERY_STATE_SCHEMA_VERSION,
  normalizeV2RecoveryStateSnapshotInput,
  validateV2RecoveryStateSnapshot,
  type V2RecoveryStateSaveReason,
  type V2RecoveryStateSnapshot,
} from '../../shared/v2RecoveryStateSchema.ts';

type RecoveryServiceOptions = {
  repoRoot: string;
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
  message: string;
};

export function createV2RecoveryStateService({ repoRoot }: RecoveryServiceOptions) {
  const recoveryDirectory = path.join(repoRoot, 'runtime_data', 'recovery');
  const stateFilePath = path.join(recoveryDirectory, 'v2-recovery-state.json');

  async function saveSnapshot(input: unknown, reason: V2RecoveryStateSaveReason = 'manual-save', source: V2RecoverySaveSource = 'manual'): Promise<V2RecoveryStateEnvelope> {
    const savedAtIso = new Date().toISOString();
    const snapshot = normalizeV2RecoveryStateSnapshotInput(input, savedAtIso, reason);
    snapshot.reason = reason;
    snapshot.savedAtIso = savedAtIso;
    const validation = validateV2RecoveryStateSnapshot(snapshot);
    if (!validation.ok) {
      return {
        status: 'missing',
        snapshot,
        validation,
        stateFile: stateFilePath,
        schemaVersion: V2_RECOVERY_STATE_SCHEMA_VERSION,
        source,
        message: `Recovery snapshot rejected: ${validation.errors.join('; ')}`,
      };
    }

    await fs.mkdir(recoveryDirectory, { recursive: true });
    await fs.writeFile(stateFilePath, `${JSON.stringify({ snapshot, source, savedAtIso }, null, 2)}\n`, 'utf8');
    return {
      status: source === 'autosave' || reason === 'autosave-stage-change' || reason === 'pre-shutdown' ? 'autosaved' : 'saved',
      snapshot,
      validation,
      stateFile: stateFilePath,
      schemaVersion: V2_RECOVERY_STATE_SCHEMA_VERSION,
      source,
      message: `Recovery snapshot ${source === 'manual' ? 'saved' : 'autosaved'} for ${snapshot.playback.currentFilename ?? 'no selected media'}.`,
    };
  }

  async function loadSnapshot(): Promise<V2RecoveryStateEnvelope> {
    const snapshot = await readSnapshot();
    const validation = validateV2RecoveryStateSnapshot(snapshot);
    return {
      status: snapshot ? 'loaded' : 'missing',
      snapshot,
      validation,
      stateFile: stateFilePath,
      schemaVersion: V2_RECOVERY_STATE_SCHEMA_VERSION,
      recoveryInProcess: Boolean(snapshot),
      message: snapshot
        ? `Recovery snapshot loaded for ${snapshot.playback.currentFilename ?? 'no selected media'}. Same-media restart is allowed; exact timestamp is not required.`
        : 'No V2 recovery snapshot has been saved yet.',
    };
  }

  async function readStatus(): Promise<V2RecoveryStateEnvelope> {
    const snapshot = await readSnapshot();
    const validation = validateV2RecoveryStateSnapshot(snapshot);
    return {
      status: snapshot ? 'loaded' : 'missing',
      snapshot,
      validation,
      stateFile: stateFilePath,
      schemaVersion: V2_RECOVERY_STATE_SCHEMA_VERSION,
      recoveryInProcess: Boolean(snapshot),
      message: snapshot ? 'V2 recovery snapshot is available.' : 'No V2 recovery snapshot is available.',
    };
  }

  async function readSnapshot(): Promise<V2RecoveryStateSnapshot | null> {
    try {
      const parsed = JSON.parse(await fs.readFile(stateFilePath, 'utf8'));
      const snapshot = normalizeV2RecoveryStateSnapshotInput(parsed?.snapshot ?? parsed, parsed?.snapshot?.savedAtIso ?? new Date().toISOString(), 'manual-save');
      return validateV2RecoveryStateSnapshot(snapshot).ok ? snapshot : null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }


  return {
    stateFilePath,
    saveSnapshot,
    loadSnapshot,
    readStatus,
  };
}
