import {
  RUNTIME_EXECUTION_ENDPOINTS,
  configureRuntimeScreenSimulation,
  getRuntimeOrchestrationLast,
  runRuntimeDownload,
  runRuntimeGeocode,
  runRuntimeGps,
  runRuntimeIndex,
  runRuntimeOrchestration,
  runRuntimePlaybackSelectCurrent,
  runRuntimeQueuePrepare,
} from '../runtimeExecutionService.ts';
import {
  buildInitLogDetails,
  formatInitError,
  mapPayloadStatusToUiStatus,
  normalizeActionResult,
  summarizeRuntimePayload,
} from './runtimeTruthActionUtils.ts';

function inferMediaTypeFromPath(candidatePath) {
  const normalized = String(candidatePath ?? '').toLowerCase();
  if (!normalized) {
    return 'Media';
  }
  if (/(\.mp4|\.mov|\.mkv|\.avi|\.webm)$/i.test(normalized)) {
    return 'Video';
  }
  return 'Image';
}

function extractFileName(candidatePath) {
  const normalized = String(candidatePath ?? '').replaceAll('\\', '/');
  return normalized.split('/').filter(Boolean).pop() ?? candidatePath ?? 'Unknown media';
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function emptyLastRunData() {
  return { media: {}, playback: {}, stage: {}, screen: {} };
}

function mapOrchestrationToLastRunData(payload) {
  const selected = isRecord(payload?.selected_asset_summary) ? payload.selected_asset_summary : {};
  const canonicalPath = selected.canonicalPath ?? selected.canonical_path ?? null;
  const addressText = selected.addressText ?? selected.address_text ?? null;
  return {
    media: {
      file: canonicalPath ? extractFileName(canonicalPath) : 'No selected playback item recorded',
      type: canonicalPath ? inferMediaTypeFromPath(canonicalPath) : 'Unknown',
      queuePosition: 'Backend orchestration summary',
      checkpoint: payload?.finished_at ?? payload?.started_at ?? 'Unavailable',
    },
    playback: {
      status: payload?.status ?? 'Unknown',
      lastCheckpoint: payload?.finished_at ?? 'Unavailable',
      resumeMarker: canonicalPath ?? 'No playback selection recorded',
      crashState: payload?.failure_reason ? `Failed at ${payload.failed_stage ?? 'unknown stage'}: ${payload.failure_reason}` : 'No failure recorded',
    },
    stage: {
      active: payload?.current_stage ?? 'None',
      lastCompleted: payload?.last_successful_stage ?? 'None',
      previousStage: Array.isArray(payload?.stage_order_executed) ? payload.stage_order_executed.join(' -> ') : 'Unavailable',
      stageError: payload?.failure_reason ?? 'None',
    },
    screen: {
      state: 'Unknown',
      lastActivitySource: 'Not included in orchestration last-run payload',
      timeout: 'Not included',
      transition: addressText ?? 'No screen transition is represented by this endpoint',
    },
  };
}

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

  // Track playback loop state. When runPlaybackEmulation is invoked, it will
  // schedule subsequent invocations until no new item is selected. This helps
  // implement the authoritative auto‑advance slideshow semantics for B4.
  let playbackLoopTimer = null;
  let lastPlaybackCanonicalPath = null;

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
        draft.truth.playbackStatus = 'Ready for backend playback selection';
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

  async function runBackendAction({
    key,
    source,
    operation,
    endpoint,
    execute,
    requestBody = {},
    onSuccess = (_payload = null, _meta = null) => {},
    onError = (_error = null) => {},
    afterRun = null,
  }) {
    if (!guardAction(key, source, `${key} action is already running; duplicate trigger was blocked.`)) {
      return null;
    }

    setStatus(key, 'running');
    pushLog(key, 'info', `${operation} started.`, {
      operation,
      endpoint: `${endpoint.method} ${endpoint.path}`,
      outcome: 'running',
      request: {
        method: endpoint.method,
        path: endpoint.path,
        body: requestBody,
      },
    });

    try {
      const result = normalizeActionResult(await execute(requestBody));
      const payload = result.payload ?? null;
      const details = buildInitLogDetails({
        operation,
        endpoint,
        requestBody,
        apiMeta: result.meta,
        responsePayload: payload,
        outcome: 'success',
      });
      const uiStatus = mapPayloadStatusToUiStatus(payload?.status);
      const summary = summarizeRuntimePayload(operation, payload);

      setStatus(key, uiStatus);
      pushLog(key, uiStatus, summary, details);
      pushHistory(source, uiStatus, summary, {
        actionKey: key,
        operation,
        request: details.request,
        response: details.response,
      });
      onSuccess(payload, result.meta);
      return payload;
    } catch (error) {
      const details = buildInitLogDetails({
        operation,
        endpoint,
        requestBody,
        apiMeta: error?.meta ?? null,
        responsePayload: error?.payload ?? null,
        outcome: 'error',
      });
      const message = formatInitError(operation, error);
      setStatus(key, 'error');
      pushLog(key, 'error', message, details);
      pushHistory(source, 'error', message, {
        actionKey: key,
        operation,
        request: details.request,
        response: details.response,
      });
      onError(error);
      return null;
    } finally {
      afterRun?.();
      endAction(key);
    }
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

  function runBackendPipelineStage({ key, operation, endpoint, execute, onComplete = () => {} }) {
    if (isPipelineBusy()) {
      const owner = getState().truth.pipelineActiveKey;
      rejectWhileBusy(key, 'PIPELINE', `${key} was blocked because ${owner} already holds the pipeline lock.`);
      return;
    }

    startPipelineLock(key);
    setStatus('B3', 'running');
    pushHistory('PIPELINE', 'info', `${key} started.`, { stage: key, phase: 'start', backend: true });

    void runBackendAction({
      key,
      source: 'PIPELINE',
      operation,
      endpoint,
      execute,
      onSuccess: (payload) => {
        patchState((draft) => {
          draft.truth.lastStageCompleted = key;
          if (key === 'B3.5' && payload?.queue) {
            const insertedCount = Number(payload.queue.insertedCount ?? 0);
            if (insertedCount > 0) {
              draft.truth.queueLength = Math.max(1, draft.truth.queueLength + insertedCount);
              draft.truth.playbackStatus = 'Queue prepared by backend';
            }
            draft.statusByKey.B4 = 'idle';
          }
        });
        setStatus('B3', 'success');
      },
      afterRun: () => {
        releasePipelineLock(key);
        onComplete();
      },
    });
  }

  function runEnqueueStage(onComplete = () => {}) {
    runBackendPipelineStage({
      key: 'B3.5',
      operation: 'Prepare playback queue',
      endpoint: RUNTIME_EXECUTION_ENDPOINTS.queuePrepare,
      execute: runRuntimeQueuePrepare,
      onComplete,
    });
  }

  function runAutoPipeline() {
    if (isPipelineBusy()) {
      rejectWhileBusy('B3', 'PIPELINE', `Auto pipeline start was blocked because ${getState().truth.pipelineActiveKey} already holds the pipeline lock.`);
      return;
    }

    startPipelineLock('B3');
    void runBackendAction({
      key: 'B3',
      source: 'PIPELINE',
      operation: 'Run backend orchestration',
      endpoint: RUNTIME_EXECUTION_ENDPOINTS.orchestrationRun,
      execute: runRuntimeOrchestration,
      onSuccess: (payload) => {
        patchState((draft) => {
          if (payload?.status === 'SUCCEEDED') {
            draft.truth.lastStageCompleted = 'B3.5';
            const insertedCount = Number(payload?.stage_results?.queue_prepare?.queue?.insertedCount ?? 0);
            if (insertedCount > 0) {
              draft.truth.queueLength = Math.max(1, draft.truth.queueLength + insertedCount);
              draft.truth.playbackStatus = 'Queue prepared by backend orchestration';
            }
            draft.statusByKey.B4 = 'idle';
            return;
          }
          if (payload?.status === 'FAILED') {
            draft.truth.lastStageCompleted = payload.last_successful_stage ?? draft.truth.lastStageCompleted;
            draft.truth.stageLock = `Backend orchestration failed at ${payload.failed_stage ?? 'unknown stage'}`;
          }
        });
      },
      afterRun: () => {
        releasePipelineLock('B3');
      },
    });
  }

  function loadLastOrchestrationRun() {
    void runBackendAction({
      key: 'C',
      source: 'RECOVERY',
      operation: 'Load last orchestration run',
      endpoint: RUNTIME_EXECUTION_ENDPOINTS.orchestrationLast,
      execute: getRuntimeOrchestrationLast,
      onSuccess: (payload) => {
        patchState((draft) => {
          if (!payload) {
            draft.lastRunMode = 'none';
            draft.lastRunData = emptyLastRunData();
            return;
          }
          draft.lastRunMode = 'ready';
          draft.lastRunData = mapOrchestrationToLastRunData(payload);
        });
      },
      onError: () => {
        patchState((draft) => {
          draft.lastRunMode = 'error';
        });
      },
    });
  }

  function configureScreenSimulation() {
    const simulation = { ...getState().simulation };
    void runBackendAction({
      key: 'B5',
      source: 'SCREEN',
      operation: 'Configure backend screen simulation',
      endpoint: RUNTIME_EXECUTION_ENDPOINTS.screenSimulationConfigure,
      execute: configureRuntimeScreenSimulation,
      requestBody: { simulation },
      onSuccess: (payload) => {
        patchState((draft) => {
          const nextSimulation = isRecord(payload?.simulation) ? payload.simulation : simulation;
          const screen = isRecord(payload?.screen) ? payload.screen : {};
          draft.simulation = { ...draft.simulation, ...nextSimulation };
          draft.truth.screenState = String(screen.screenState ?? draft.truth.screenState);
          draft.truth.lastActivitySource = String(screen.lastActivitySource ?? draft.truth.lastActivitySource);
          draft.truth.inactivityTimeoutSeconds = Number(screen.inactivityTimeoutSeconds ?? draft.truth.inactivityTimeoutSeconds);
          draft.runningProcess.screenWorker.screenState = draft.truth.screenState;
          draft.runningProcess.screenWorker.lastActivity = draft.truth.lastActivitySource;
          draft.runningProcess.screenWorker.timeout = `${draft.truth.inactivityTimeoutSeconds}s`;
          if (typeof screen.playbackStatus === 'string') {
            draft.truth.playbackStatus = screen.playbackStatus;
          }
          if (typeof screen.lastCheckpoint === 'string') {
            draft.truth.lastCheckpoint = screen.lastCheckpoint;
          }
        });
      },
    });
  }

  function runPlaybackEmulation() {
    // If a playback loop timer is pending, clear it before starting a new run. This
    // avoids overlapping timers when the user manually triggers the action again.
    if (playbackLoopTimer !== null) {
      clearTimeout(playbackLoopTimer);
      playbackLoopTimer = null;
    }
    if (!withPlaybackGuard(() => {
      void runBackendAction({
        key: 'B4',
        source: 'PLAYBACK',
        operation: 'Select current playback item',
        endpoint: RUNTIME_EXECUTION_ENDPOINTS.playbackSelectCurrent,
        execute: runRuntimePlaybackSelectCurrent,
        onSuccess: (payload) => {
          const selected = payload?.playback?.selected ?? null;
          if (!selected) {
            return;
          }
          const selectedPath = selected.canonicalPath ?? null;
          // Determine whether to schedule a subsequent playback selection. If the
          // selected path differs from the previously selected one, there is
          // likely another item in the queue to display.
          const shouldScheduleNext = selectedPath && selectedPath !== lastPlaybackCanonicalPath;
          // Update last selected path for subsequent comparisons.
          lastPlaybackCanonicalPath = selectedPath;
          patchState((draft) => {
            draft.truth.currentMedia = {
              name: extractFileName(selected.canonicalPath),
              type: inferMediaTypeFromPath(selected.canonicalPath),
              position: draft.truth.queueLength > 0 ? `1 of ${draft.truth.queueLength}` : 'Selected by backend',
              overlay: selected.addressText ?? 'Address unavailable',
            };
            draft.truth.queueLength = Math.max(draft.truth.queueLength, 1);
            draft.truth.playbackStatus = draft.truth.screenState === 'OFF' ? 'Paused by inactivity' : 'Selected by backend for playback';
            draft.truth.lastCheckpoint = selected.selectedAt ?? draft.truth.lastCheckpoint;
            draft.truth.lastStageCompleted = 'B4';
          });
          // Schedule the next playback selection after a short delay if needed.
          if (shouldScheduleNext) {
            playbackLoopTimer = setTimeout(() => {
              // Only recurse if another playback loop is not already pending.
              runPlaybackEmulation();
            }, 1000);
          }
        },
        afterRun: () => {
          releasePlaybackGuard();
        },
      });
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
    loadLastOrchestrationRun,
    configureScreenSimulation,
    runPlaybackEmulation,
    startRealRun,
    runBackendAction,
    runBackendPipelineStage,
  };
}
