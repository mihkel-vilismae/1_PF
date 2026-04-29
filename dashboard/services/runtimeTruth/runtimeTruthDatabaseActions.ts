import {
  DATABASE_VIEWER_ENDPOINTS,
  connectDatabase,
  fetchDatabaseRows,
  listDatabaseTables,
  startDatabaseLogging,
  stopDatabaseLogging,
  verifyDatabase,
} from '../databaseViewerService.ts';
import {
  buildInitLogDetails,
  extractSchedulerCapability,
  formatInitError,
  mapPayloadStatusToUiStatus,
  normalizeActionResult,
  summarizeInitPayload,
} from './runtimeTruthActionUtils.ts';
import { buildInitialSchedulerCapability } from './runtimeTruthState.ts';

export function createRuntimeTruthDatabaseActions({
  getState,
  patchState,
  pushHistory,
  pushLog,
  setStatus,
  stamp,
  guards,
}) {
  const { guardAction, endAction } = guards;

  async function runInitAction(key, source, operation, endpoint, request, payload = undefined) {
    if (!guardAction(key, source, `${operation} is already running; duplicate trigger was blocked.`)) {
      return;
    }

    setStatus(key, 'running');
    const startDetails = buildInitLogDetails({
      operation,
      endpoint,
      requestBody: payload,
      apiMeta: null,
      responsePayload: null,
      outcome: 'running',
    });
    patchState((draft) => {
      draft.initResults[key] = {
        outcome: 'running',
        operation,
        method: endpoint.method,
        endpoint: endpoint.path,
        receivedAt: stamp(),
        message: `${operation} request sent. Waiting for backend response...`,
        request: startDetails.request,
        response: null,
      };
    });
    pushLog(key, 'info', `${operation} started via ${endpoint.method} ${endpoint.path}.`, startDetails);

    try {
      const responseEnvelope = normalizeActionResult(await request(payload));
      const responsePayload = responseEnvelope.payload;
      const responseMeta = responseEnvelope.meta;
      const message = summarizeInitPayload(operation, responsePayload);
      const successDetails = buildInitLogDetails({
        operation,
        endpoint,
        requestBody: payload,
        apiMeta: responseMeta,
        responsePayload,
        outcome: 'success',
      });
      patchState((draft) => {
        draft.initResults[key] = {
          outcome: 'success',
          operation,
          method: endpoint.method,
          endpoint: endpoint.path,
          receivedAt: stamp(),
          message,
          payload: responsePayload,
          request: successDetails.request,
          response: successDetails.response,
        };
        if (key === '3A') {
          draft.initCapabilities.scheduler = extractSchedulerCapability(
            responsePayload,
            draft.initCapabilities.scheduler ?? buildInitialSchedulerCapability(),
          );
        }
      });
      const nextStatus = key === 'E4' && responsePayload?.logging?.active
        ? 'running'
        : mapPayloadStatusToUiStatus(responsePayload?.status);
      setStatus(key, nextStatus);
      pushLog(key, 'success', message, successDetails);
      pushHistory(source, 'success', `${operation} completed through ${endpoint.path}.`, successDetails);
    } catch (error) {
      const message = formatInitError(operation, error);
      const errorDetails = buildInitLogDetails({
        operation,
        endpoint,
        requestBody: payload,
        apiMeta: error.meta ?? null,
        responsePayload: error.payload ?? null,
        outcome: 'error',
      });
      patchState((draft) => {
        draft.initResults[key] = {
          outcome: 'error',
          operation,
          method: endpoint.method,
          endpoint: endpoint.path,
          receivedAt: stamp(),
          status: error.status ?? null,
          message,
          errorPayload: error.payload ?? null,
          request: errorDetails.request,
          response: errorDetails.response,
        };
        if (key === '3A') {
          draft.initCapabilities.scheduler = extractSchedulerCapability(
            error.payload,
            draft.initCapabilities.scheduler ?? buildInitialSchedulerCapability(),
          );
        }
      });
      setStatus(key, 'error');
      pushLog(key, 'error', message, errorDetails);
      pushHistory(source, 'error', `${operation} failed through ${endpoint.path}.`, errorDetails);
    } finally {
      endAction(key);
    }
  }

  async function runDatabaseViewerAction(key, operation, endpoint, request, payload = undefined, onSuccess = null) {
    if (!guardAction(key, 'DB', `${operation} is already running; duplicate trigger was blocked.`)) {
      return;
    }

    setStatus(key, 'running');
    const startDetails = buildInitLogDetails({
      operation,
      endpoint,
      requestBody: payload,
      apiMeta: null,
      responsePayload: null,
      outcome: 'running',
    });
    patchState((draft) => {
      draft.databaseViewer.results[key] = {
        outcome: 'running',
        operation,
        method: endpoint.method,
        endpoint: endpoint.path,
        receivedAt: stamp(),
        message: `${operation} request sent. Waiting for backend response...`,
        request: startDetails.request,
        response: null,
      };
    });
    pushLog(key, 'info', `${operation} started via ${endpoint.method} ${endpoint.path}.`, startDetails);

    try {
      const responseEnvelope = normalizeActionResult(await request(payload));
      const responsePayload = responseEnvelope.payload;
      const responseMeta = responseEnvelope.meta;
      const message = summarizeInitPayload(operation, responsePayload);
      const successDetails = buildInitLogDetails({
        operation,
        endpoint,
        requestBody: payload,
        apiMeta: responseMeta,
        responsePayload,
        outcome: 'success',
      });
      patchState((draft) => {
        draft.databaseViewer.results[key] = {
          outcome: 'success',
          operation,
          method: endpoint.method,
          endpoint: endpoint.path,
          receivedAt: stamp(),
          message,
          payload: responsePayload,
          request: successDetails.request,
          response: successDetails.response,
        };
        if (typeof onSuccess === 'function') {
          onSuccess(draft, responsePayload);
        }
        applyDatabaseViewerDerivedState(draft);
      });
      setStatus(key, mapPayloadStatusToUiStatus(responsePayload?.status));
      pushLog(key, 'success', message, successDetails);
      pushHistory('DB', 'success', `${operation} completed through ${endpoint.path}.`, successDetails);
    } catch (error) {
      const message = formatInitError(operation, error);
      const errorDetails = buildInitLogDetails({
        operation,
        endpoint,
        requestBody: payload,
        apiMeta: error.meta ?? null,
        responsePayload: error.payload ?? null,
        outcome: 'error',
      });
      patchState((draft) => {
        draft.databaseViewer.results[key] = {
          outcome: 'error',
          operation,
          method: endpoint.method,
          endpoint: endpoint.path,
          receivedAt: stamp(),
          status: error.status ?? null,
          message,
          errorPayload: error.payload ?? null,
          request: errorDetails.request,
          response: errorDetails.response,
        };
        applyDatabaseViewerDerivedState(draft);
      });
      setStatus(key, 'error');
      pushLog(key, 'error', message, errorDetails);
      pushHistory('DB', 'error', `${operation} failed through ${endpoint.path}.`, errorDetails);
    } finally {
      endAction(key);
    }
  }

  async function runDatabaseViewerVerifyAction() {
    await runDatabaseViewerAction(
      'E1',
      'Verify Database',
      DATABASE_VIEWER_ENDPOINTS.verifyDatabase,
      verifyDatabase,
      undefined,
      (draft, payload) => {
        draft.databaseViewer.verification = structuredClone(payload);
        draft.databaseViewer.connection = null;
        draft.databaseViewer.connected = false;
        draft.databaseViewer.tables = [];
        draft.databaseViewer.sqlite = null;
        draft.databaseViewer.selectedTableName = null;
        draft.databaseViewer.rows = null;
        draft.databaseViewer.logging = {
          ...draft.databaseViewer.logging,
          active: false,
          sessionId: null,
          startedAt: null,
          endedAt: null,
          coverage: payload?.loggingCoverage ?? draft.databaseViewer.logging.coverage,
          entries: [],
          entryCount: 0,
        };
        draft.statusByKey.E2 = 'disabled';
        draft.statusByKey.E3 = 'disabled';
        draft.statusByKey.E4 = 'disabled';
      },
    );
  }

  async function runDatabaseViewerConnectAction() {
    if (!getState().databaseViewer.verification?.verificationPassed) {
      setStatus('E1', 'error');
      pushLog('E1', 'error', 'Connect to Database is disabled until Verify Database succeeds.');
      pushHistory('DB', 'error', 'Connect to Database was blocked because verification has not passed yet.', {
        action: 'connect-db-viewer',
      });
      return;
    }

    await runDatabaseViewerAction(
      'E1',
      'Connect to Database',
      DATABASE_VIEWER_ENDPOINTS.connectDatabase,
      connectDatabase,
      undefined,
      (draft, payload) => {
        draft.databaseViewer.connection = structuredClone(payload);
        draft.databaseViewer.connected = Boolean(payload?.connected);
        draft.databaseViewer.logging.coverage = payload?.loggingCoverage ?? draft.databaseViewer.logging.coverage;
        if (!payload?.connected) {
          draft.databaseViewer.tables = [];
          draft.databaseViewer.sqlite = null;
          draft.databaseViewer.selectedTableName = null;
          draft.databaseViewer.rows = null;
        }
      },
    );
  }

  async function runDatabaseViewerTablesAction() {
    if (!getState().databaseViewer.connected) {
      setStatus('E2', 'error');
      pushLog('E2', 'error', 'Show Tables is disabled until Connect to Database succeeds.');
      pushHistory('DB', 'error', 'Show Tables was blocked because the logical connect gate is still closed.', {
        action: 'show-db-tables',
      });
      return;
    }

    await runDatabaseViewerAction(
      'E2',
      'Show Tables',
      DATABASE_VIEWER_ENDPOINTS.listTables,
      listDatabaseTables,
      undefined,
      (draft, payload) => {
        draft.databaseViewer.tables = Array.isArray(payload?.objects) ? structuredClone(payload.objects) : [];
        draft.databaseViewer.sqlite = payload?.sqlite ? structuredClone(payload.sqlite) : null;
        draft.databaseViewer.logging.coverage = payload?.loggingCoverage ?? draft.databaseViewer.logging.coverage;
        if (!draft.databaseViewer.tables.some((entry) => entry.name === draft.databaseViewer.selectedTableName)) {
          draft.databaseViewer.selectedTableName = null;
          draft.databaseViewer.rows = null;
        }
      },
    );
  }

  async function runDatabaseViewerRowsAction(tableName, page) {
    if (!getState().databaseViewer.connected) {
      setStatus('E3', 'error');
      pushLog('E3', 'error', 'Load rows is disabled until Connect to Database succeeds.');
      pushHistory('DB', 'error', 'Load rows was blocked because the logical connect gate is still closed.', {
        action: 'rows',
        tableName,
      });
      return;
    }

    await runDatabaseViewerAction(
      'E3',
      `Load Rows (${tableName})`,
      DATABASE_VIEWER_ENDPOINTS.fetchRows,
      fetchDatabaseRows,
      { tableName, page, pageSize: 50 },
      (draft, payload) => {
        draft.databaseViewer.selectedTableName = payload?.table?.name ?? tableName;
        draft.databaseViewer.rows = payload?.table ? structuredClone(payload.table) : null;
        draft.databaseViewer.logging.coverage = payload?.loggingCoverage ?? draft.databaseViewer.logging.coverage;
      },
    );
  }

  async function runDatabaseViewerLoggingAction(mode) {
    if (!getState().databaseViewer.connected) {
      setStatus('E4', 'error');
      pushLog('E4', 'error', 'DB logging is disabled until Connect to Database succeeds.');
      pushHistory('DB', 'error', 'DB logging was blocked because the logical connect gate is still closed.', {
        action: mode === 'start' ? 'start-db-logging' : 'stop-db-logging',
      });
      return;
    }

    const operation = mode === 'start' ? 'Start DB Logging' : 'Stop DB Logging';
    const endpoint = mode === 'start' ? DATABASE_VIEWER_ENDPOINTS.startLogging : DATABASE_VIEWER_ENDPOINTS.stopLogging;
    const request = mode === 'start' ? startDatabaseLogging : stopDatabaseLogging;

    await runDatabaseViewerAction(
      'E4',
      operation,
      endpoint,
      request,
      undefined,
      (draft, payload) => {
        const logging = payload?.logging ?? null;
        draft.databaseViewer.logging = logging
          ? structuredClone(logging)
          : {
              ...draft.databaseViewer.logging,
              active: false,
            };
        if (mode === 'start' && draft.databaseViewer.logging.active) {
          draft.statusByKey.E4 = 'running';
        }
      },
    );
  }

  function applyDatabaseViewerDerivedState(draft) {
    const verificationPassed = Boolean(draft.databaseViewer.verification?.verificationPassed);
    const connected = Boolean(draft.databaseViewer.connected);
    const hasTables = Array.isArray(draft.databaseViewer.tables) && draft.databaseViewer.tables.length > 0;
    const loggingActive = Boolean(draft.databaseViewer.logging?.active);

    if (!draft.activeActions.E2) {
      if (!verificationPassed || !connected) {
        draft.statusByKey.E2 = 'disabled';
      } else if (draft.statusByKey.E2 === 'disabled') {
        draft.statusByKey.E2 = 'idle';
      }
    }

    if (!draft.activeActions.E3) {
      if (!connected || !hasTables) {
        draft.statusByKey.E3 = 'disabled';
      } else if (draft.databaseViewer.rows) {
        draft.statusByKey.E3 = 'success';
      } else if (draft.statusByKey.E3 === 'disabled') {
        draft.statusByKey.E3 = 'idle';
      }
    }

    if (!draft.activeActions.E4) {
      if (!connected) {
        draft.statusByKey.E4 = 'disabled';
      } else if (loggingActive) {
        draft.statusByKey.E4 = 'running';
      } else if (draft.databaseViewer.logging?.endedAt) {
        draft.statusByKey.E4 = 'success';
      } else if (draft.statusByKey.E4 === 'disabled') {
        draft.statusByKey.E4 = 'idle';
      }
    }
  }

  return {
    runInitAction,
    runDatabaseViewerVerifyAction,
    runDatabaseViewerConnectAction,
    runDatabaseViewerTablesAction,
    runDatabaseViewerRowsAction,
    runDatabaseViewerLoggingAction,
  };
}
