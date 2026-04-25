import {
  AUTH_PREFLIGHT_ENDPOINTS,
  fetchAuthStatus,
  logoutAuthPreflight,
  resetAuthPreflight,
  runAuthPreflight,
  submitAuthTwoFactor,
} from '../authPreflightService.js';
import { buildTimelineDetails } from './runtimeTruthActionUtils.js';

const SECRET_FIELD_PATTERN = /(password|passwd|secret|token|cookie|session|credential|authorization|otp|2fa|two_factor_value|mfa|^code$)/i;

export function createRuntimeTruthAuthActions({ patchState, pushHistory, pushLog, setStatus, stamp, guards }) {
  const { guardAction, endAction } = guards;

  async function refreshAuthStatus() {
    return runAuthBackendAction({ operation: 'Refresh auth preflight status', endpoint: AUTH_PREFLIGHT_ENDPOINTS.status, execute: fetchAuthStatus, pendingStatus: 'idle', duplicateMessage: 'B1 auth status refresh is already running; duplicate trigger was blocked.' });
  }

  async function runAuthPreflightAction() {
    return runAuthBackendAction({ operation: 'Run auth preflight', endpoint: AUTH_PREFLIGHT_ENDPOINTS.run, execute: runAuthPreflight, pendingStatus: 'running', duplicateMessage: 'B1 auth preflight is already running; duplicate start was blocked.' });
  }

  async function resetAuthPreflightAction() {
    return runAuthBackendAction({ operation: 'Reset auth preflight attempt state', endpoint: AUTH_PREFLIGHT_ENDPOINTS.reset, execute: resetAuthPreflight, pendingStatus: 'running', duplicateMessage: 'B1 auth reset is already running; duplicate trigger was blocked.' });
  }

  async function submitAuthTwoFactorAction(code) {
    return runAuthBackendAction({ operation: 'Submit auth 2FA code', endpoint: AUTH_PREFLIGHT_ENDPOINTS.submitTwoFactor, execute: () => submitAuthTwoFactor(code), pendingStatus: 'running', duplicateMessage: 'B1 auth 2FA submit is already running; duplicate trigger was blocked.' });
  }

  async function logoutAuthPreflightAction() {
    return runAuthBackendAction({ operation: 'Logout auth session', endpoint: AUTH_PREFLIGHT_ENDPOINTS.logout, execute: logoutAuthPreflight, pendingStatus: 'running', duplicateMessage: 'B1 auth logout is already running; duplicate trigger was blocked.' });
  }

  async function runAuthBackendAction({ operation, endpoint, execute, pendingStatus, duplicateMessage }) {
    if (!guardAction('B1', 'AUTH', duplicateMessage)) {
      return null;
    }

    const runningPayload = buildAuthResult({ operation, endpoint, outcome: 'running', message: `${operation} started.`, payload: null, meta: null });
    setStatus('B1', pendingStatus);
    patchState((draft) => {
      draft.authPreflight.latestResult = runningPayload;
      draft.loginSteps = mapAuthStateToLoginSteps(draft.authPreflight.publicState);
    });
    pushLog('B1', 'info', `${operation} started.`, buildAuthLogDetails({ operation, endpoint, outcome: 'running' }));

    try {
      const result = await execute();
      const safePayload = sanitizeAuthPayload(result.payload ?? null);
      const authState = sanitizeAuthPayload(safePayload?.auth ?? null);
      const uiStatus = mapAuthStatusToUiStatus(authState?.status, safePayload?.status);
      const message = summarizeAuthResult(operation, authState, safePayload);
      patchState((draft) => {
        draft.authPreflight.publicState = authState;
        draft.authPreflight.loaded = true;
        draft.authPreflight.latestResult = buildAuthResult({ operation, endpoint, outcome: 'success', message, payload: safePayload, meta: sanitizeAuthPayload(result.meta) });
        draft.loginSteps = mapAuthStateToLoginSteps(authState);
      });
      setStatus('B1', uiStatus);
      pushLog('B1', uiStatus, message, buildAuthLogDetails({ operation, endpoint, outcome: 'success', meta: result.meta, payload: safePayload }));
      pushHistory('AUTH', uiStatus, message, { operation, request: sanitizeAuthPayload(result.meta?.request ?? null), response: sanitizeAuthPayload(result.meta?.response ?? null) });
      return safePayload;
    } catch (error) {
      const safePayload = sanitizeAuthPayload(error?.payload ?? null);
      const authState = sanitizeAuthPayload(safePayload?.auth ?? null);
      const message = formatAuthError(operation, error, safePayload);
      patchState((draft) => {
        if (authState) {
          draft.authPreflight.publicState = authState;
          draft.authPreflight.loaded = true;
          draft.loginSteps = mapAuthStateToLoginSteps(authState);
        }
        draft.authPreflight.latestResult = buildAuthResult({ operation, endpoint, outcome: 'error', message, payload: safePayload, meta: sanitizeAuthPayload(error?.meta ?? null) });
      });
      setStatus('B1', 'error');
      pushLog('B1', 'error', message, buildAuthLogDetails({ operation, endpoint, outcome: 'error', meta: error?.meta, payload: safePayload }));
      pushHistory('AUTH', 'error', message, { operation, request: sanitizeAuthPayload(error?.meta?.request ?? null), response: sanitizeAuthPayload(error?.meta?.response ?? null) });
      return null;
    } finally {
      endAction('B1');
    }
  }

  return { refreshAuthStatus, runAuthPreflightAction, resetAuthPreflightAction, submitAuthTwoFactorAction, logoutAuthPreflightAction };
}

export function sanitizeAuthPayload(value) {
  if (Array.isArray(value)) return value.map((item) => sanitizeAuthPayload(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !SECRET_FIELD_PATTERN.test(key)).map(([key, nestedValue]) => [key, sanitizeAuthPayload(nestedValue)]));
}

function mapAuthStatusToUiStatus(authStatus, envelopeStatus) {
  if (authStatus === 'preflight_failed' || authStatus === 'provider_failed' || envelopeStatus === 'error') return 'error';
  if (authStatus === 'blocked') return 'info';
  if (authStatus === 'authenticated') return 'success';
  return 'info';
}

function summarizeAuthResult(operation, authState, payload) {
  if (authState?.error?.message) return authState.error.message;
  if (payload?.message) return payload.message;
  if (authState?.next_action) return `${operation} returned ${authState.status ?? 'unknown'}; next action: ${authState.next_action}.`;
  return `${operation} completed.`;
}

function formatAuthError(operation, error, payload) {
  return payload?.auth?.error?.message ?? payload?.message ?? error?.message ?? `${operation} failed.`;
}

function buildAuthResult({ operation, endpoint, outcome, message, payload, meta }) {
  return { operation, method: endpoint.method, endpoint: endpoint.path, outcome, message, status: meta?.response?.status ?? null, payload, receivedAt: stampSafe() };
}

function buildAuthLogDetails({ operation, endpoint, outcome, meta = null, payload = null }) {
  return { ...buildTimelineDetails(), operation, endpoint: `${endpoint.method} ${endpoint.path}`, outcome, request: sanitizeAuthPayload(meta?.request ?? { method: endpoint.method, path: endpoint.path, body: null }), response: sanitizeAuthPayload(meta?.response ?? (payload ? { body: payload } : null)) };
}

function mapAuthStateToLoginSteps(authState) {
  const status = authState?.status ?? 'idle';
  const hasRequiredFiles = Boolean(authState?.has_required_files);
  const twoFactorStatus = authState?.two_factor_status ?? 'not_started';
  return [
    { key: 'preflight', label: 'Auth preflight', status: status === 'idle' ? 'waiting' : status === 'preflight_failed' ? 'error' : 'done' },
    { key: 'provider', label: 'Provider login', status: status === 'blocked' ? 'active' : status === 'authenticated' ? 'done' : 'waiting' },
    { key: 'file', label: 'Required auth files', status: hasRequiredFiles ? 'done' : status === 'preflight_failed' ? 'error' : 'waiting' },
    { key: '2fa', label: '2FA', status: twoFactorStatus === 'complete' ? 'done' : twoFactorStatus === 'required' ? 'active' : 'waiting' },
  ];
}

function stampSafe() {
  return typeof Intl !== 'undefined' ? new Date().toLocaleString('et-EE', { timeZone: 'Europe/Tallinn' }) : new Date().toISOString();
}
