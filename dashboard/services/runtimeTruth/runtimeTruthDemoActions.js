export function createRuntimeTruthDemoActions({
  getState,
  patchState,
  pushHistory,
  pushLog,
  setStatus,
  stamp,
  guards,
}) {
  const {
    endAction,
    guardAction,
    isPipelineBusy,
    rejectWhileBusy,
    releasePipelineLock,
    releasePlaybackGuard,
    startPipelineLock,
    withPlaybackGuard,
  } = guards;

  function applyScreenSimulationState(reason) {
    const simulation = getState().simulation;
    const anyEnabled = simulation.simulateAllEnabled || simulation.pirEnabled || simulation.mouseEnabled || simulation.keyboardEnabled;
    const nextScreenState = anyEnabled ? 'ON' : 'OFF';
    const nextActivity = simulation.simulateAllEnabled
      ? 'All simulated activity sources enabled'
      : simulation.pirEnabled
        ? 'PIR sensor activity enabled'
        : simulation.mouseEnabled
          ? 'Mouse movement enabled'
          : simulation.keyboardEnabled
            ? 'Keyboard activity enabled'
            : 'No simulated activity sources enabled';

    patchState((draft) => {
      draft.truth.screenState = nextScreenState;
      draft.truth.lastActivitySource = nextActivity;
      draft.truth.inactivityTimeoutSeconds = Number(simulation.inactivityTimeoutSeconds);
      draft.runningProcess.screenWorker.screenState = nextScreenState;
      draft.runningProcess.screenWorker.lastActivity = nextActivity;
      draft.runningProcess.screenWorker.timeout = `${Number(simulation.inactivityTimeoutSeconds)}s`;
      if (nextScreenState === 'OFF') {
        draft.truth.playbackStatus = 'Paused by inactivity';
        draft.truth.lastCheckpoint = `${stamp()} screen-off checkpoint saved`;
      } else if (draft.truth.currentMedia) {
        draft.truth.playbackStatus = 'Ready for emulation';
      } else {
        draft.truth.playbackStatus = 'Waiting for queued media';
      }
    });

    pushLog('B5', 'info', `Screen simulation updated: ${reason}. Screen is now ${nextScreenState}.`);
    pushHistory(
      'SCREEN',
      nextScreenState === 'OFF' ? 'warning' : 'success',
      `Screen simulation updated: ${reason}. Screen is now ${nextScreenState}.`,
      {
        reason,
        screenState: nextScreenState,
        activitySource: nextActivity,
      },
    );
  }

  function genericAction(key, source, message) {
    if (!guardAction(key, source, `${key} action is already running; duplicate trigger was blocked.`)) {
      return;
    }
    setStatus(key, 'running');
    pushLog(key, 'info', `Started action: ${message}`);
    setTimeout(() => {
      setStatus(key, 'success');
      pushLog(key, 'success', message);
      pushHistory(source, 'success', message, {
        actionKey: key,
        actionMessage: message,
      });
      if (key.startsWith('B3')) {
        patchState((draft) => {
          draft.truth.lastStageCompleted = key;
        });
      }
      endAction(key);
    }, 420);
  }

  function runLoginFlow() {
    if (!guardAction('B1', 'TEST', 'B1 login flow is already running; duplicate start was blocked.')) {
      return;
    }
    setStatus('B1', 'running');
    patchState((draft) => {
      draft.loginSteps = draft.loginSteps.map((step, index) => ({ ...step, status: index === 0 ? 'active' : 'waiting' }));
    });
    pushLog('B1', 'info', 'Login flow started.');
    pushHistory('TEST', 'info', 'B1 login flow started.', { flow: 'login', step: 'start' });

    setTimeout(() => {
      patchState((draft) => {
        draft.loginSteps[0].status = 'done';
        draft.loginSteps[1].status = 'active';
      });
      pushLog('B1', 'success', 'Primary credentials accepted.');
    }, 260);

    setTimeout(() => {
      patchState((draft) => {
        draft.loginSteps[1].status = 'done';
        draft.loginSteps[2].status = 'active';
      });
      pushLog('B1', 'info', 'Required file prepared.');
    }, 560);

    setTimeout(() => {
      patchState((draft) => {
        draft.loginSteps[2].status = 'done';
      });
      setStatus('B1', 'success');
      pushLog('B1', 'success', '2FA completed in placeholder mode.');
      pushHistory('TEST', 'success', 'B1 login flow completed.', { flow: 'login', step: 'complete' });
      endAction('B1');
    }, 920);
  }

  function runPipelineStage(key, message, onComplete = () => {}) {
    if (isPipelineBusy()) {
      const owner = getState().truth.pipelineActiveKey;
      rejectWhileBusy(key, 'PIPELINE', `${key} was blocked because ${owner} already holds the pipeline lock.`);
      return;
    }
    startPipelineLock(key);
    setStatus(key, 'running');
    setStatus('B3', 'running');
    pushLog(key, 'info', `Started ${key}.`);
    pushHistory('PIPELINE', 'info', `${key} started.`, { stage: key, phase: 'start' });
    setTimeout(() => {
      setStatus(key, 'success');
      setStatus('B3', 'success');
      pushLog(key, 'success', message);
      pushHistory('PIPELINE', 'success', message, { stage: key, phase: 'complete', message });
      patchState((draft) => {
        draft.truth.lastStageCompleted = key;
      });
      releasePipelineLock(key);
      onComplete();
    }, 420);
  }

  function runEnqueueStage(onComplete = () => {}) {
    runPipelineStage('B3.5', 'Queue stage added 1 media item for playback.', onComplete);
    setTimeout(() => {
      patchState((draft) => {
        draft.truth.queueLength = Math.max(1, draft.truth.queueLength + 1);
        draft.truth.currentMedia = {
          name: 'same_gps_03.jpg',
          type: 'Image',
          position: `${draft.truth.queueLength} of ${draft.truth.queueLength}`,
          overlay: 'Tallinn, Harjumaa, Estonia',
        };
        draft.truth.playbackStatus = 'Ready for emulation';
        draft.statusByKey.B4 = 'idle';
      });
      pushLog('B4', 'success', 'Playback emulation is now enabled because the queue has media.');
    }, 520);
  }

  function runAutoPipeline() {
    if (isPipelineBusy()) {
      rejectWhileBusy('B3', 'PIPELINE', `Auto pipeline start was blocked because ${getState().truth.pipelineActiveKey} already holds the pipeline lock.`);
      return;
    }
    const stages = ['B3.1', 'B3.2', 'B3.3', 'B3.4', 'B3.5'];
    const runNextStage = (index = 0) => {
      const stage = stages[index];
      if (!stage) {
        setStatus('B3', 'success');
        pushHistory('PIPELINE', 'success', 'Auto pipeline completed without overlapping stages.', { stages, phase: 'complete' });
        return;
      }

      const action = stage === 'B3.5'
        ? () => runEnqueueStage(() => runNextStage(index + 1))
        : () => runPipelineStage(stage, `${stage} completed in auto mode.`, () => runNextStage(index + 1));

      action();
    };

    setStatus('B3', 'running');
    runNextStage();
  }

  function runPlaybackEmulation() {
    if (!getState().truth.currentMedia) {
      setStatus('B4', 'disabled');
      pushLog('B4', 'error', 'Cannot start playback emulation without queued media.');
      return;
    }
    if (!withPlaybackGuard(() => {
      setStatus('B4', 'running');
      pushHistory('PLAYBACK', 'info', 'Playback emulation started.', { media: getState().truth.currentMedia?.name ?? 'None' });
      pushLog('B4', 'info', `Showing ${getState().truth.currentMedia.name}.`);
      patchState((draft) => {
        draft.truth.playbackStatus = 'Displaying media';
        draft.truth.lastCheckpoint = `${stamp()} image display checkpoint saved`;
      });
      setTimeout(() => {
        setStatus('B4', 'success');
        pushLog('B4', 'success', 'Playback emulation rendered the current media card without duplicate starts.');
        releasePlaybackGuard();
      }, 400);
    })) {
      return;
    }
  }

  function startRealRun() {
    if (getState().truth.realRunActive) {
      pushHistory('RUNTIME', 'info', 'Duplicate simulated runtime preview start request ignored because the preview is already active.', {
        duplicate: true,
        previewActive: true,
      });
      pushLog('D', 'info', 'Simulated runtime preview start request ignored; the preview is already active.');
      return;
    }
    patchState((draft) => {
      draft.truth.realRunActive = true;
      draft.truth.realRunStartCount += 1;
      draft.truth.playbackLock = 'Playback worker lock held by simulated runtime preview';
      draft.truth.screenLock = 'Screen worker lock held by simulated runtime preview';
      draft.statusByKey.D1 = 'running';
      draft.statusByKey.D2 = 'running';
      draft.statusByKey.D3 = 'running';
      draft.runningProcess.pipelineStages = draft.runningProcess.pipelineStages.map((stage, index) => ({
        ...stage,
        status: index === 0 ? 'Running' : 'Waiting',
        lastRun: index === 0 ? stamp() : stage.lastRun,
        summary: index === 0 ? 'Download stage is active in the simulated preview loop.' : 'Waiting for its turn in the simulated preview loop.',
      }));
      draft.runningProcess.playbackWorker = {
        status: 'Running',
        heartbeat: stamp(),
        currentMedia: draft.truth.currentMedia?.name ?? 'No media queued yet',
        summary: 'Playback watchdog preview would verify the process every few seconds.',
      };
      draft.runningProcess.screenWorker = {
        status: 'Running',
        heartbeat: stamp(),
        screenState: draft.truth.screenState,
        lastActivity: draft.truth.lastActivitySource,
        timeout: `${draft.truth.inactivityTimeoutSeconds}s`,
        summary: 'Screen activity watchdog preview would verify process health every few seconds.',
      };
    });
    pushHistory('RUNTIME', 'success', 'Simulated runtime preview started with single-instance guard enabled.', {
      singleInstanceGuard: true,
      previewStartCount: getState().truth.realRunStartCount,
    });
    pushLog('D', 'success', 'Simulated runtime preview is now active.');
  }

  return {
    applyScreenSimulationState,
    genericAction,
    runLoginFlow,
    runPipelineStage,
    runEnqueueStage,
    runAutoPipeline,
    runPlaybackEmulation,
    startRealRun,
  };
}
