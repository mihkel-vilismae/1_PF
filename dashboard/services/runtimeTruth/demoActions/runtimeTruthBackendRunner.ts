/*
 * Builds the shared backend action runner used by View B runtime-truth actions.
 * It preserves existing logging, history, status, and normalization behavior.
 */
import {
  buildInitLogDetails,
  formatInitError,
  mapPayloadStatusToUiStatus,
  normalizeActionResult,
  summarizeRuntimePayload,
} from '../runtimeTruthActionUtils.ts';

// Creates a closure-bound backend runner without changing the public action API.
export function createRuntimeTruthBackendActionRunner({ guardAction, setStatus, pushLog, pushHistory, endAction }) {
  // Executes one backend-backed runtime action and records the existing UI timeline details.
  return async function runBackendAction({
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
  };
}
