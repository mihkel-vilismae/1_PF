/*
 * Coordinates View B runtime actions and related dashboard state updates.
 * The actions keep backend calls, logs, and runtime-truth projections together.
 * Remaining simulation helpers stay local until a backend contract replaces them.
 */
import {
  RUNTIME_EXECUTION_ENDPOINTS,
  clearRuntimePipelineStaleLocks,
  configureRuntimeScreenSimulation,
  detectRuntimePipelineIssues,
  getRuntimeOrchestrationLast,
  getRuntimeLiveProjection,
  runRuntimeDownload,
  runRuntimeGeocode,
  runRuntimeGps,
  runRuntimeIndex,
  runRuntimeOrchestration,
  runRuntimePlaybackSelectCurrent,
  runRuntimeQueuePrepare,
} from '../runtimeExecutionService.ts';
import { createRuntimeTruthBackendActionRunner } from './demoActions/runtimeTruthBackendRunner.ts';
import {
  buildRuntimeMediaUrl,
  emptyLastRunData,
  extractFileName,
  inferMediaTypeFromPath,
  isRuntimeRecord as isRecord,
  mapOrchestrationToLastRunData,
} from './demoActions/runtimeTruthDemoMedia.ts';

// Creates the View B runtime-truth action bundle consumed by dashboard behavior wiring.
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
    rejectPipelineWhileBusy,
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

  // Applies local screen simulation truth and records matching log/history entries.
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

  // Loads a combined live runtime projection from the backend and updates View D state.
  // This action is triggered when entering View D or when the user refreshes the live monitor.
  function loadLiveRuntimeProjection() {
    void runBackendAction({
      key: 'D',
      source: 'MONITOR',
      operation: 'Load live runtime projection',
      endpoint: RUNTIME_EXECUTION_ENDPOINTS.projectionLive,
      execute: getRuntimeLiveProjection,
      onSuccess: (payload) => {
        // The backend returns an envelope with ok, namespace and projection.  If no
        // projection exists, treat the run as inactive.
        const projection = payload?.projection;
        if (!projection) {
          patchState((draft) => {
            draft.truth.realRunActive = false;
            // Reset worker status to idle/inactive for all D workers.
            draft.statusByKey.D1 = 'Idle';
            draft.statusByKey.D2 = 'Idle';
            draft.statusByKey.D3 = 'Idle';
            // Reset playback worker fields to placeholder values.
            draft.runningProcess.playbackWorker.status = 'Idle';
            draft.runningProcess.playbackWorker.heartbeat = 'N/A';
            draft.runningProcess.playbackWorker.currentMedia = 'None';
            draft.runningProcess.playbackWorker.summary = 'No playback activity';
            // Reset screen worker fields to placeholder values.
            draft.runningProcess.screenWorker.status = 'Inactive';
            draft.runningProcess.screenWorker.heartbeat = 'N/A';
            draft.runningProcess.screenWorker.screenState = 'OFF';
            draft.runningProcess.screenWorker.lastActivity = 'None';
            draft.runningProcess.screenWorker.timeout = 'N/A';
            draft.runningProcess.screenWorker.summary = 'No screen activity';
          });
          return;
        }
        // Mark that a real run is active.
        patchState((draft) => {
          draft.truth.realRunActive = true;
        });
        // Update D1, D2, D3 statuses based on worker health.
        const workerHealth = projection.workerHealth ?? {};
        function toStatus(w) {
          const status = (w?.value?.status ?? '').toLowerCase();
          if (status === 'running') return 'Running';
          if (status === 'idle') return 'Idle';
          if (status === 'error' || status === 'failed') return 'Error';
          if (status === 'completed') return 'Completed';
          if (status === 'unknown' || !status) return 'Inactive';
          return status.charAt(0).toUpperCase() + status.slice(1);
        }
        const d1 = workerHealth['regular-stage-worker'];
        const d2 = workerHealth['playback-worker'];
        const d3 = workerHealth['screen-on-off-worker'];
        patchState((draft) => {
          draft.statusByKey.D1 = toStatus(d1);
          draft.statusByKey.D2 = toStatus(d2);
          draft.statusByKey.D3 = toStatus(d3);
          // Update playback worker fields
          const playback = projection.playback ?? {};
          const queueSize = playback.queueSize?.value;
          const isPlaying = playback.isPlaying?.value;
          draft.runningProcess.playbackWorker.status = isPlaying === true ? 'Active' : 'Idle';
          draft.runningProcess.playbackWorker.heartbeat = 'N/A';
          draft.runningProcess.playbackWorker.currentMedia = playback.currentItemId?.value ?? 'None';
          draft.runningProcess.playbackWorker.summary = typeof queueSize === 'number' ? `${queueSize} items in queue` : 'Unknown queue size';
          // Update screen worker fields
          const screen = projection.screen ?? {};
          const preview = screen.previewAvailable?.value;
          const fullscreen = screen.fullscreenAvailable?.value;
          draft.runningProcess.screenWorker.status = preview || fullscreen ? 'Active' : 'Inactive';
          draft.runningProcess.screenWorker.heartbeat = 'N/A';
          draft.runningProcess.screenWorker.screenState = preview || fullscreen ? 'ON' : 'OFF';
          draft.runningProcess.screenWorker.lastActivity = screen.lastRenderedAt?.value ?? 'None';
          draft.runningProcess.screenWorker.timeout = 'N/A';
          draft.runningProcess.screenWorker.summary =
            (preview ? 'Preview available' : 'Preview unavailable') + ' / ' + (fullscreen ? 'Fullscreen available' : 'Fullscreen unavailable');
        });
      },
      onError: () => {
        // Treat error as inactive/failed.
        patchState((draft) => {
          draft.truth.realRunActive = false;
          draft.statusByKey.D1 = 'Error';
          draft.statusByKey.D2 = 'Error';
          draft.statusByKey.D3 = 'Error';
        });
      },
    });
  }

  // Runs a legacy timed placeholder action while preserving duplicate-trigger guards.
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

  // Runs the existing placeholder B1 login flow used by View B test controls.
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

  const runBackendAction = createRuntimeTruthBackendActionRunner({
    guardAction,
    setStatus,
    pushLog,
    pushHistory,
    endAction,
  });

  // Copies backend-owned pipeline lock fields into the frontend truth projection.
  function syncPipelineLockTruth(payload) {
    if (!isRecord(payload?.truth)) {
      return;
    }
    patchState((draft) => {
      draft.truth.pipelineActiveKey = payload.truth.pipelineActiveKey ?? null;
      draft.truth.pipelineLockAcquiredAt = payload.truth.pipelineLockAcquiredAt ?? null;
      if (typeof payload.truth.stageLock === 'string') {
        draft.truth.stageLock = payload.truth.stageLock;
      }
    });
  }

  // Mirrors backend runtime action outcomes into the shared result surface used by V2 cards.
  function recordRuntimeBackendResult(key, operation, endpoint, outcome, payload = null, meta = null, error = null) {
    patchState((draft) => {
      draft.initResults[key] = {
        operation,
        method: endpoint.method,
        endpoint: endpoint.path,
        outcome,
        receivedAt: stamp(),
        status: meta?.response?.status ?? error?.status ?? null,
        message: outcome === 'success'
          ? summarizeRuntimeResultMessage(operation, payload)
          : summarizeRuntimeErrorMessage(operation, error),
        payload: outcome === 'success' ? payload : undefined,
        errorPayload: outcome === 'error' ? (error?.payload ?? meta?.response?.body ?? null) : undefined,
      };
    });
  }

  // Builds a stable, human-readable success message for V2 result surfaces.
  function summarizeRuntimeResultMessage(operation, payload) {
    if (payload?.message && typeof payload.message === 'string') {
      return payload.message;
    }
    if (Array.isArray(payload?.messages) && payload.messages.length) {
      return String(payload.messages[0]);
    }
    return `${operation} completed.`;
  }

  // Builds a stable, human-readable error message for V2 result surfaces.
  function summarizeRuntimeErrorMessage(operation, error) {
    if (error?.message && typeof error.message === 'string') {
      return `${operation} failed: ${error.message}`;
    }
    return `${operation} failed.`;
  }

  // Runs the backend detector for persisted pipeline issues.
  function detectPipelineIssues() {
    const operation = 'Detect pipeline issues';
    const endpoint = RUNTIME_EXECUTION_ENDPOINTS.pipelineIssuesDetect;
    void runBackendAction({
      key: 'B3-DIAGNOSTICS',
      source: 'PIPELINE',
      operation,
      endpoint,
      execute: detectRuntimePipelineIssues,
      onSuccess: (payload, meta) => {
        syncPipelineLockTruth(payload);
        recordRuntimeBackendResult('B3-DIAGNOSTICS', operation, endpoint, 'success', payload, meta);
      },
      onError: (error) => {
        recordRuntimeBackendResult('B3-DIAGNOSTICS', operation, endpoint, 'error', null, error?.meta ?? null, error);
      },
    });
  }

  // Clears stale persisted pipeline locks through the backend.
  function clearStalePipelineLocksAction() {
    const operation = 'Clear stale pipeline locks';
    const endpoint = RUNTIME_EXECUTION_ENDPOINTS.pipelineStaleLocksClear;
    void runBackendAction({
      key: 'B3-DIAGNOSTICS',
      source: 'PIPELINE',
      operation,
      endpoint,
      execute: clearRuntimePipelineStaleLocks,
      onSuccess: (payload, meta) => {
        syncPipelineLockTruth(payload);
        recordRuntimeBackendResult('B3-DIAGNOSTICS', operation, endpoint, 'success', payload, meta);
      },
      onError: (error) => {
        recordRuntimeBackendResult('B3-DIAGNOSTICS', operation, endpoint, 'error', null, error?.meta ?? null, error);
      },
    });
  }

  // Runs a locally simulated pipeline stage with the existing frontend pipeline lock.
  function runPipelineStage(key, message, onComplete = () => {}) {
    if (isPipelineBusy()) {
      rejectPipelineWhileBusy(key);
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

  // Runs one backend pipeline stage while preserving aggregate B3 status updates.
  function runBackendPipelineStage({ key, operation, endpoint, execute, onComplete = () => {}, requestBody = {} }) {
    if (isPipelineBusy()) {
      rejectPipelineWhileBusy(key);
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
      requestBody,
      onSuccess: (payload, meta) => {
        recordRuntimeBackendResult(key, operation, endpoint, 'success', payload, meta);
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
      onError: (error) => {
        recordRuntimeBackendResult(key, operation, endpoint, 'error', null, error?.meta ?? null, error);
        setStatus('B3', 'error');
      },
      afterRun: () => {
        releasePipelineLock(key);
        onComplete();
      },
    });
  }

  // Runs the backend queue-prepare stage behind the existing B3.5 action.
  function runEnqueueStage(onComplete = () => {}) {
    runBackendPipelineStage({
      key: 'B3.5',
      operation: 'Prepare playback queue',
      endpoint: RUNTIME_EXECUTION_ENDPOINTS.queuePrepare,
      execute: runRuntimeQueuePrepare,
      onComplete,
    });
  }

  // Runs backend orchestration for the full automatic View B pipeline action.
  function runAutoPipeline() {
    if (isPipelineBusy()) {
      rejectPipelineWhileBusy('B3');
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

  // Loads the latest backend orchestration summary into the View C last-run projection.
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

  // Sends screen simulation settings to the backend and applies the returned truth state.
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

  // Runs backend playback selection and schedules the existing auto-advance loop when needed.
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
              canonicalPath: selected.canonicalPath,
              mediaUrl: buildRuntimeMediaUrl(selected.canonicalPath),
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

  // Starts the simulated runtime preview while preserving the existing single-instance guard.
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
    detectPipelineIssues,
    clearStalePipelineLocksAction,
    runEnqueueStage,
    runAutoPipeline,
    loadLastOrchestrationRun,
    // Expose live runtime projection loader for View D refreshes.
    loadLiveRuntimeProjection,
    configureScreenSimulation,
    runPlaybackEmulation,
    startRealRun,
    runBackendAction,
    runBackendPipelineStage,
  };
}
