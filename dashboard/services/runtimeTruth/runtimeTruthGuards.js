const ACTION_LOCK_KEYS = new Set([
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
}) {
  function isPipelineBusy() {
    return Boolean(getState().truth.pipelineActiveKey);
  }

  function startPipelineLock(key) {
    patchState((draft) => {
      draft.truth.pipelineActiveKey = key;
      draft.truth.stageLock = `Pipeline lock held by ${key}`;
    });
  }

  function releasePipelineLock(key) {
    patchState((draft) => {
      if (draft.truth.pipelineActiveKey === key) {
        draft.truth.pipelineActiveKey = null;
        draft.truth.stageLock = `${key} finished and released the pipeline lock`;
      }
    });
  }

  function rejectWhileBusy(key, source, message) {
    setStatus(key, 'error');
    pushLog(key, 'error', message);
    pushHistory(source, 'error', message);
  }

  function withPlaybackGuard(fn) {
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

  function releasePlaybackGuard() {
    patchState((draft) => {
      draft.truth.playbackActive = false;
      draft.truth.playbackLock = draft.truth.realRunActive
        ? 'Playback worker lock held by simulated runtime preview'
        : 'Playback worker lock available';
    });
  }

  function isActionActive(key) {
    return Boolean(getState().activeActions[key]);
  }

  function beginAction(key) {
    patchState((draft) => {
      draft.activeActions[key] = true;
    });
  }

  function endAction(key) {
    patchState((draft) => {
      delete draft.activeActions[key];
    });
  }

  function guardAction(key, source, message) {
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
