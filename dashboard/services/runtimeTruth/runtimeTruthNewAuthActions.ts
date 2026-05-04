import {
  NEW_AUTH_ENDPOINTS,
  fetchNewAuthSessionFiles,
  fetchNewAuthStatus,
  logoutNewAuthSession,
  startNewAuthLogin,
  submitNewAuthTwoFactor,
  verifyNewAuthIcloudpd,
} from '../newAuthService.ts';
import { buildTimelineDetails } from './runtimeTruthActionUtils.ts';

const NEW_AUTH_CARD_KEY = '1A-STASH-OFF';
const NEW_AUTH_HISTORY_SOURCE = 'NEW AUTH';
const SECRET_FIELD_PATTERN = /(password|passwd|secret|token|cookie|session|credential|authorization|otp|2fa|two_factor_value|mfa|^code$|apple_id)/i;

export function createRuntimeTruthNewAuthActions({ patchState, pushHistory, pushLog, setStatus, openModal, guards }) {
  const { guardAction, endAction } = guards;

  async function verifyIcloudpdAction() {
    return runNewAuthBackendAction({
      buttonKey: 'new-auth-verify-icloudpd',
      operation: 'Verify iCloudPD',
      endpoint: NEW_AUTH_ENDPOINTS.verifyIcloudpd,
      execute: verifyNewAuthIcloudpd,
      duplicateMessage: '1A-STASH-OFF iCloudPD verification is already running; duplicate start was blocked.',
    });
  }

  async function checkLoginAction() {
    return runNewAuthBackendAction({
      buttonKey: 'new-auth-check-login',
      operation: 'Check new auth login status',
      endpoint: NEW_AUTH_ENDPOINTS.status,
      execute: fetchNewAuthStatus,
      duplicateMessage: '1A-STASH-OFF login status check is already running; duplicate start was blocked.',
    });
  }

  async function loginUsingEnvAction() {
    openNewAuthLoginModal('starting_provider_login', 'Starting login using .env values. Waiting for the new backend endpoint response.');
    return runNewAuthBackendAction({
      buttonKey: 'new-auth-login-using-env',
      operation: 'Login using .env values',
      endpoint: NEW_AUTH_ENDPOINTS.login,
      execute: startNewAuthLogin,
      duplicateMessage: '1A-STASH-OFF login is already running; duplicate start was blocked.',
      modalStage: true,
    });
  }

  async function submitTwoFactorAction(code) {
    openNewAuthLoginModal('submitting_2fa', 'Submitting the 2FA code or trusted-device index through the new auth endpoint. The response is not displayed after submission.');
    return runNewAuthBackendAction({
      buttonKey: 'new-auth-login-using-env',
      operation: 'Submit new auth 2FA code',
      endpoint: NEW_AUTH_ENDPOINTS.submitTwoFactor,
      execute: () => submitNewAuthTwoFactor(code),
      duplicateMessage: '1A-STASH-OFF 2FA submission is already running; duplicate start was blocked.',
      modalStage: true,
    });
  }

  async function logoutAction() {
    return runNewAuthBackendAction({
      buttonKey: 'new-auth-logout-session',
      operation: 'Log out and remove existing session',
      endpoint: NEW_AUTH_ENDPOINTS.logout,
      execute: logoutNewAuthSession,
      duplicateMessage: '1A-STASH-OFF logout/session removal is already running; duplicate start was blocked.',
    });
  }

  async function sessionFilesAction() {
    return runNewAuthBackendAction({
      buttonKey: 'new-auth-session-files',
      operation: 'Show auth/session paths and files',
      endpoint: NEW_AUTH_ENDPOINTS.sessionFiles,
      execute: fetchNewAuthSessionFiles,
      duplicateMessage: '1A-STASH-OFF session file inspection is already running; duplicate start was blocked.',
      resultTarget: 'sessionFilesResult',
    });
  }

  function openNewAuthLoginModal(stage, message, twoFactorPrompt = null) {
    pushLog(NEW_AUTH_CARD_KEY, 'info', `New auth modal ${stage}.`, buildNewAuthLogDetails({
      operation: 'New auth modal update',
      endpoint: NEW_AUTH_ENDPOINTS.login,
      outcome: 'modal',
      payload: { stage, message, ...sanitizeNewAuthPayload(twoFactorPrompt) },
    }));
    openModal({
      kind: 'new-auth-login',
      title: '1A-STASH-OFF login using .env values',
      subtitle: message,
      stage,
      message,
      ...(twoFactorPrompt ?? {}),
    });
  }

  async function runNewAuthBackendAction({ buttonKey, operation, endpoint, execute, duplicateMessage, modalStage = false, resultTarget = 'latestResult' }) {
    if (!guardAction(NEW_AUTH_CARD_KEY, NEW_AUTH_HISTORY_SOURCE, duplicateMessage)) {
      return null;
    }

    const runningMessage = `${operation} started through ${endpoint.method} ${endpoint.path}.`;
    setStatus(NEW_AUTH_CARD_KEY, 'running');
    patchState((draft) => {
      draft.newAuth.buttonStates ??= {};
      draft.newAuth.buttonStates[buttonKey] = buildNewAuthButtonState('running', runningMessage, endpoint);
      draft.newAuth[resultTarget] = buildNewAuthResult({ operation, endpoint, outcome: 'running', message: runningMessage, payload: null, meta: null });
    });
    pushLog(NEW_AUTH_CARD_KEY, 'info', runningMessage, buildNewAuthLogDetails({ operation, endpoint, outcome: 'running' }));

    try {
      const result = await execute();
      const safePayload = sanitizeNewAuthPayload(result.payload ?? null);
      const status = classifyNewAuthButtonStatus(buttonKey, safePayload, 'success');
      const message = summarizeNewAuthResult(operation, safePayload);
      patchState((draft) => {
        draft.newAuth.buttonStates ??= {};
        draft.newAuth.buttonStates[buttonKey] = buildNewAuthButtonState(status, message, endpoint);
        draft.newAuth.loaded = true;
        draft.newAuth[resultTarget] = buildNewAuthResult({ operation, endpoint, outcome: 'success', message, payload: safePayload, meta: sanitizeNewAuthPayload(result.meta) });
      });
      setStatus(NEW_AUTH_CARD_KEY, status === 'success' ? 'success' : 'info');
      pushLog(NEW_AUTH_CARD_KEY, status === 'success' ? 'success' : 'info', message, buildNewAuthLogDetails({ operation, endpoint, outcome: 'success', meta: result.meta, payload: safePayload }));
      pushHistory(NEW_AUTH_HISTORY_SOURCE, status === 'success' ? 'success' : 'info', message, buildNewAuthHistoryDetails({
        operation,
        endpoint,
        outcome: 'success',
        uiStatus: status,
        request: result.meta?.request ?? { method: endpoint.method, path: endpoint.path, body: null },
        response: result.meta?.response ?? (safePayload ? { body: safePayload } : null),
      }));
      if (modalStage) {
        openNewAuthLoginModal(status === 'success' ? 'authenticated' : 'waiting_for_2fa', message, getNewAuthTwoFactorPrompt(safePayload));
      }
      return safePayload;
    } catch (error) {
      const safePayload = sanitizeNewAuthPayload(error?.payload ?? null);
      const message = safePayload?.message ?? error?.message ?? `${operation} failed.`;
      patchState((draft) => {
        draft.newAuth.buttonStates ??= {};
        draft.newAuth.buttonStates[buttonKey] = buildNewAuthButtonState('failed', message, endpoint);
        draft.newAuth[resultTarget] = buildNewAuthResult({ operation, endpoint, outcome: 'error', message, payload: safePayload, meta: sanitizeNewAuthPayload(error?.meta ?? null) });
      });
      setStatus(NEW_AUTH_CARD_KEY, 'error');
      pushLog(NEW_AUTH_CARD_KEY, 'error', message, buildNewAuthLogDetails({ operation, endpoint, outcome: 'error', meta: error?.meta, payload: safePayload }));
      pushHistory(NEW_AUTH_HISTORY_SOURCE, 'error', message, buildNewAuthHistoryDetails({
        operation,
        endpoint,
        outcome: 'error',
        uiStatus: 'failed',
        request: error?.meta?.request ?? { method: endpoint.method, path: endpoint.path, body: null },
        response: error?.meta?.response ?? (safePayload ? { body: safePayload } : null),
      }));
      if (modalStage) {
        openNewAuthLoginModal('failed', message);
      }
      return null;
    } finally {
      endAction(NEW_AUTH_CARD_KEY);
    }
  }

  return {
    verifyIcloudpdAction,
    checkLoginAction,
    loginUsingEnvAction,
    submitTwoFactorAction,
    logoutAction,
    sessionFilesAction,
  };
}

function classifyNewAuthButtonStatus(buttonKey, payload, transportOutcome) {
  if (transportOutcome === 'error') return 'failed';
  if (payload?.ok === false || payload?.state === 'failed' || payload?.status === 'error') return 'failed';
  if (payload?.state === 'pending_2fa' || payload?.requires2fa === true || payload?.requires_2fa === true) return 'pending';
  if (buttonKey === 'new-auth-check-login') return 'success';
  if (buttonKey === 'new-auth-session-files') return Array.isArray(payload?.paths) || payload?.ok === true ? 'success' : 'pending';
  return payload?.ok === true || payload?.state === 'authenticated' || payload?.status === 'ok' ? 'success' : 'pending';
}

function summarizeNewAuthResult(operation, payload) {
  if (payload?.message) return payload.message;
  if (payload?.state) return `${operation} returned state: ${payload.state}.`;
  if (payload?.status) return `${operation} returned status: ${payload.status}.`;
  return `${operation} completed.`;
}

function getNewAuthTwoFactorPrompt(payload) {
  const details = payload?.details && typeof payload.details === 'object' ? payload.details : null;
  if (!details) {
    return null;
  }

  const twoFactorPromptKind = typeof details.twoFactorPromptKind === 'string' ? details.twoFactorPromptKind : null;
  const requestedInput = typeof details.requestedInput === 'string' ? details.requestedInput : null;
  if (!twoFactorPromptKind && !requestedInput) {
    return null;
  }

  return {
    twoFactorPromptKind,
    requestedInput,
  };
}

function buildNewAuthButtonState(status, message, endpoint) {
  return {
    status,
    message,
    updatedAt: stampSafe(),
    endpoint: endpoint ? `${endpoint.method} ${endpoint.path}` : null,
  };
}

function buildNewAuthResult({ operation, endpoint, outcome, message, payload, meta }) {
  return {
    operation,
    method: endpoint.method,
    endpoint: endpoint.path,
    outcome,
    message,
    status: meta?.response?.status ?? null,
    payload,
    receivedAt: stampSafe(),
  };
}

function buildNewAuthLogDetails({ operation, endpoint, outcome, meta = null, payload = null }) {
  return {
    ...buildTimelineDetails(),
    operation,
    endpoint: `${endpoint.method} ${endpoint.path}`,
    outcome,
    request: sanitizeNewAuthPayload(meta?.request ?? { method: endpoint.method, path: endpoint.path, body: null }),
    response: sanitizeNewAuthPayload(meta?.response ?? (payload ? { body: payload } : null)),
  };
}

function buildNewAuthHistoryDetails({ operation, endpoint, outcome, uiStatus, request, response }) {
  return {
    operation,
    endpoint: `${endpoint.method} ${endpoint.path}`,
    outcome,
    uiStatus,
    buttonStatus: uiStatus,
    request: sanitizeNewAuthPayload(request),
    response: sanitizeNewAuthPayload(response),
    recordedAt: stampSafe(),
  };
}

function sanitizeNewAuthPayload(value) {
  if (Array.isArray(value)) return value.map((item) => sanitizeNewAuthPayload(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_FIELD_PATTERN.test(key))
      .map(([key, nestedValue]) => [key, sanitizeNewAuthPayload(nestedValue)]),
  );
}

function stampSafe() {
  return typeof Intl !== 'undefined' ? new Date().toLocaleString('et-EE', { timeZone: 'Europe/Tallinn' }) : new Date().toISOString();
}
