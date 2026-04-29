export type RuntimeTruthActionKey = string;
export type RuntimeTruthHistorySource = string;
export type RuntimeTruthStatus = 'neutral' | 'running' | 'success' | 'error' | 'warning' | 'info' | string;

export type RuntimeTruthGuardState = {
  activeActions: Record<string, boolean>;
  truth: {
    pipelineActiveKey: string | null;
    stageLock: string;
    playbackActive: boolean;
    playbackLock: string;
    realRunActive: boolean;
  };
};

export type RuntimeTruthDraft = RuntimeTruthGuardState;
export type RuntimeTruthPatchState = (updater: (draft: RuntimeTruthDraft) => void) => void;
export type RuntimeTruthPushHistory = (source: RuntimeTruthHistorySource, status: RuntimeTruthStatus, message: string, details?: unknown) => void;
export type RuntimeTruthPushLog = (key: RuntimeTruthActionKey, level: RuntimeTruthStatus, message: string, details?: unknown) => void;
export type RuntimeTruthSetStatus = (key: RuntimeTruthActionKey, status: RuntimeTruthStatus) => void;
export type RuntimeTruthPlaybackAction = () => void;

export type RuntimeTruthGuardDependencies = {
  getState: () => RuntimeTruthGuardState;
  patchState: RuntimeTruthPatchState;
  pushHistory: RuntimeTruthPushHistory;
  pushLog: RuntimeTruthPushLog;
  setStatus: RuntimeTruthSetStatus;
};

export type RuntimeTruthGuards = {
  isPipelineBusy: () => boolean;
  startPipelineLock: (key: RuntimeTruthActionKey) => void;
  releasePipelineLock: (key: RuntimeTruthActionKey) => void;
  rejectWhileBusy: (key: RuntimeTruthActionKey, source: RuntimeTruthHistorySource, message: string) => void;
  withPlaybackGuard: (fn: RuntimeTruthPlaybackAction) => boolean;
  releasePlaybackGuard: () => void;
  endAction: (key: RuntimeTruthActionKey) => void;
  guardAction: (key: RuntimeTruthActionKey, source: RuntimeTruthHistorySource, message: string) => boolean;
};

const ACTION_LOCK_KEYS = new Set<string>([
  '1A',
  '2A',
  '3A',
  'B1',
  'B2',
  'B3',
  'B3.1',
  'B3.2',
  'B3.3',
  'B3.4',
  'B3.5',
  'B4',
  'B5',
  'C',
  'D1',
  'D2',
  'D3',
  'E1',
  'E2',
  'E3',
  'E4',
]);

export function createRuntimeTruthGuards({
  getState,
  patchState,
  pushHistory,
  pushLog,
  setStatus,
}: RuntimeTruthGuardDependencies): RuntimeTruthGuards {
  function isPipelineBusy(): boolean {
    return Boolean(getState().truth.pipelineActiveKey);
  }

  function startPipelineLock(key: RuntimeTruthActionKey): void {
    patchState((draft) => {
      draft.truth.pipelineActiveKey = key;
      draft.truth.stageLock = `Pipeline lock held by ${key}`;
    });
  }

  function releasePipelineLock(key: RuntimeTruthActionKey): void {
    patchState((draft) => {
      if (draft.truth.pipelineActiveKey === key) {
        draft.truth.pipelineActiveKey = null;
        draft.truth.stageLock = `${key} finished and released the pipeline lock`;
      }
    });
  }

  function rejectWhileBusy(key: RuntimeTruthActionKey, source: RuntimeTruthHistorySource, message: string): void {
    setStatus(key, 'error');
    pushLog(key, 'error', message);
    pushHistory(source, 'error', message);
  }

  function withPlaybackGuard(fn: RuntimeTruthPlaybackAction): boolean {
    if (getState().truth.playbackActive) {
      rejectWhileBusy('B4', 'PLAYBACK', 'Playback emulation is already active; duplicate playback start was blocked.');
      return false;
    }
    patchState((draft) => {
      draft.truth.playbackActive = true;
      draft.truth.playbackLock = 'Playback worker lock held';
    });
    fn();
    return true;
  }

  function releasePlaybackGuard(): void {
    patchState((draft) => {
      draft.truth.playbackActive = false;
      draft.truth.playbackLock = draft.truth.realRunActive
        ? 'Playback worker lock held by simulated runtime preview'
        : 'Playback worker lock available';
    });
  }

  function isActionActive(key: RuntimeTruthActionKey): boolean {
    return Boolean(getState().activeActions[key]);
  }

  function beginAction(key: RuntimeTruthActionKey): void {
    patchState((draft) => {
      draft.activeActions[key] = true;
    });
  }

  function endAction(key: RuntimeTruthActionKey): void {
    patchState((draft) => {
      delete draft.activeActions[key];
    });
  }

  function guardAction(key: RuntimeTruthActionKey, source: RuntimeTruthHistorySource, message: string): boolean {
    if (!ACTION_LOCK_KEYS.has(key)) {
      return true;
    }
    if (isActionActive(key)) {
      rejectWhileBusy(key, source, message);
      return false;
    }
    beginAction(key);
    return true;
  }

  return {
    isPipelineBusy,
    startPipelineLock,
    releasePipelineLock,
    rejectWhileBusy,
    withPlaybackGuard,
    releasePlaybackGuard,
    endAction,
    guardAction,
  };
}
