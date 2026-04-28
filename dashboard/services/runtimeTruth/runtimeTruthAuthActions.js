import {
  AUTH_PREFLIGHT_ENDPOINTS,
  checkAuthLogin,
  fetchAuthStatus,
  logoutAuthPreflight,
  resetAuthPreflight,
  runAuthPreflight,
  submitAuthTwoFactor,
  testLoginByDownloadingSingleFile,
  verifyIcloudpdPreflight,
} from '../authPreflightService.js';
import { buildTimelineDetails } from './runtimeTruthActionUtils.js';

const SECRET_FIELD_PATTERN = /(password|passwd|secret|token|cookie|session|credential|authorization|otp|2fa|two_factor_value|mfa|^code$)/i;

// 1A-AUTH is the visible View A auth-preflight card. The runtime truth store still
// keeps the old B1 key as a compatibility adapter for status badges, logs, and older
// tests created before auth moved out of View B. New code should call this constant
// instead of spreading raw B1 strings.
const AUTH_PREFLIGHT_COMPAT_CARD_KEY = 'B1';
const AUTH_PREFLIGHT_HISTORY_SOURCE = 'AUTH';

export function createRuntimeTruthAuthActions({ patchState, pushHistory, pushLog, setStatus, stamp, guards }) {
  const { guardAction, endAction } = guards;

  async function refreshAuthStatus() {
    return runAuthBackendAction({ buttonKey: 'refresh-b1-auth-status', operation: 'Refresh auth preflight status', endpoint: AUTH_PREFLIGHT_ENDPOINTS.status, execute: fetchAuthStatus, pendingStatus: 'idle', duplicateMessage: '1A-AUTH auth status refresh is already running; duplicate trigger was blocked.' });
  }

  async function verifyIcloudpdPreflightAction() {
    return runAuthBackendAction({ buttonKey: 'verify-icloudpd', operation: 'Verify icloudpd', endpoint: AUTH_PREFLIGHT_ENDPOINTS.verifyIcloudpd, execute: verifyIcloudpdPreflight, pendingStatus: 'running', duplicateMessage: '1A-AUTH icloudpd verification is already running; duplicate start was blocked.' });
  }

  async function checkAuthLoginAction() {
    return runAuthBackendAction({ buttonKey: 'check-login', operation: 'Check login', endpoint: AUTH_PREFLIGHT_ENDPOINTS.resume, execute: checkAuthLogin, pendingStatus: 'running', duplicateMessage: '1A-AUTH login check is already running; duplicate start was blocked.' });
  }

  async function runAuthPreflightAction() {
    return runAuthBackendAction({ buttonKey: 'login-using-env', operation: 'Login using .env values', endpoint: AUTH_PREFLIGHT_ENDPOINTS.run, execute: runAuthPreflight, pendingStatus: 'running', duplicateMessage: '1A-AUTH auth login is already running; duplicate start was blocked.' });
  }

  async function testLoginByDownloadingSingleFileAction() {
    return runAuthBackendAction({ buttonKey: 'test-b1-login-download-one', operation: 'Test login by downloading a single file', endpoint: AUTH_PREFLIGHT_ENDPOINTS.testLoginDownloadOne, execute: testLoginByDownloadingSingleFile, pendingStatus: 'running', duplicateMessage: '1A-AUTH single-file login test is already running; duplicate start was blocked.' });
  }

  async function resetAuthPreflightAction() {
    return runAuthBackendAction({ buttonKey: 'reset-b1-auth', operation: 'Reset auth preflight attempt state', endpoint: AUTH_PREFLIGHT_ENDPOINTS.reset, execute: resetAuthPreflight, pendingStatus: 'running', duplicateMessage: '1A-AUTH auth reset is already running; duplicate trigger was blocked.' });
  }

  async function submitAuthTwoFactorAction(code) {
    return runAuthBackendAction({ buttonKey: 'submit-b1-2fa', operation: 'Submit auth 2FA code', endpoint: AUTH_PREFLIGHT_ENDPOINTS.submitTwoFactor, execute: () => submitAuthTwoFactor(code), pendingStatus: 'running', duplicateMessage: '1A-AUTH auth 2FA submit is already running; duplicate trigger was blocked.' });
  }

  async function logoutAuthPreflightAction() {
    return runAuthBackendAction({ buttonKey: 'logout-b1-auth', operation: 'Logout auth session', endpoint: AUTH_PREFLIGHT_ENDPOINTS.logout, execute: logoutAuthPreflight, pendingStatus: 'running', duplicateMessage: '1A-AUTH auth logout is already running; duplicate trigger was blocked.' });
  }

  async function runAuthBackendAction({ buttonKey, operation, endpoint, execute, pendingStatus, duplicateMessage }) {
    if (!guardAction(AUTH_PREFLIGHT_COMPAT_CARD_KEY, AUTH_PREFLIGHT_HISTORY_SOURCE, duplicateMessage)) {
      return null;
    }

    const runningPayload = buildAuthResult({ operation, endpoint, outcome: 'running', message: `${operation} started.`, payload: null, meta: null });
    setStatus(AUTH_PREFLIGHT_COMPAT_CARD_KEY, pendingStatus);
    patchState((draft) => {
      draft.authPreflight.buttonStates ??= {};
      draft.authPreflight.buttonStates[buttonKey] = buildAuthButtonState('running', `${operation} started.`, endpoint);
      draft.authPreflight.latestResult = runningPayload;
      draft.loginSteps = mapAuthStateToLoginSteps(draft.authPreflight.publicState);
    });
    pushLog(AUTH_PREFLIGHT_COMPAT_CARD_KEY, 'info', `${operation} started.`, buildAuthLogDetails({ operation, endpoint, outcome: 'running' }));

    try {
      const result = await execute();
      const safePayload = sanitizeAuthPayload(result.payload ?? null);
      const authState = sanitizeAuthPayload(safePayload?.auth ?? null);
      const uiStatus = mapAuthStatusToUiStatus(authState?.status, safePayload?.status);
      const buttonStatus = classifyAuthButtonStatus(buttonKey, authState, safePayload, 'success');
      const message = summarizeAuthResult(operation, authState, safePayload);
      patchState((draft) => {
        draft.authPreflight.buttonStates ??= {};
        draft.authPreflight.buttonStates[buttonKey] = buildAuthButtonState(buttonStatus, message, endpoint);
        draft.authPreflight.publicState = authState;
        draft.authPreflight.loaded = true;
        draft.authPreflight.latestResult = buildAuthResult({ operation, endpoint, outcome: 'success', message, payload: safePayload, meta: sanitizeAuthPayload(result.meta) });
        draft.loginSteps = mapAuthStateToLoginSteps(authState);
      });
      setStatus(AUTH_PREFLIGHT_COMPAT_CARD_KEY, uiStatus);
      pushLog(AUTH_PREFLIGHT_COMPAT_CARD_KEY, uiStatus, message, buildAuthLogDetails({ operation, endpoint, outcome: 'success', meta: result.meta, payload: safePayload }));
      pushHistory(AUTH_PREFLIGHT_HISTORY_SOURCE, uiStatus, message, { operation, request: sanitizeAuthPayload(result.meta?.request ?? null), response: sanitizeAuthPayload(result.meta?.response ?? null) });
      return safePayload;
    } catch (error) {
      const safePayload = sanitizeAuthPayload(error?.payload ?? null);
      const authState = sanitizeAuthPayload(safePayload?.auth ?? null);
      const buttonStatus = classifyAuthButtonStatus(buttonKey, authState, safePayload, 'error');
      const message = formatAuthError(operation, error, safePayload);
      patchState((draft) => {
        draft.authPreflight.buttonStates ??= {};
        draft.authPreflight.buttonStates[buttonKey] = buildAuthButtonState(buttonStatus, message, endpoint);
        if (authState) {
          draft.authPreflight.publicState = authState;
          draft.authPreflight.loaded = true;
          draft.loginSteps = mapAuthStateToLoginSteps(authState);
        }
        draft.authPreflight.latestResult = buildAuthResult({ operation, endpoint, outcome: 'error', message, payload: safePayload, meta: sanitizeAuthPayload(error?.meta ?? null) });
      });
      setStatus(AUTH_PREFLIGHT_COMPAT_CARD_KEY, 'error');
      pushLog(AUTH_PREFLIGHT_COMPAT_CARD_KEY, 'error', message, buildAuthLogDetails({ operation, endpoint, outcome: 'error', meta: error?.meta, payload: safePayload }));
      pushHistory(AUTH_PREFLIGHT_HISTORY_SOURCE, 'error', message, { operation, request: sanitizeAuthPayload(error?.meta?.request ?? null), response: sanitizeAuthPayload(error?.meta?.response ?? null) });
      return null;
    } finally {
      endAction(AUTH_PREFLIGHT_COMPAT_CARD_KEY);
    }
  }

  return { refreshAuthStatus, verifyIcloudpdPreflightAction, checkAuthLoginAction, runAuthPreflightAction, testLoginByDownloadingSingleFileAction, resetAuthPreflightAction, submitAuthTwoFactorAction, logoutAuthPreflightAction };
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

function buildAuthButtonState(status, message, endpoint) {
  return {
    status,
    message,
    updatedAt: stampSafe(),
    endpoint: endpoint ? `${endpoint.method} ${endpoint.path}` : null,
  };
}

export function classifyAuthButtonStatus(buttonKey, authState, payload, transportOutcome) {
  if (transportOutcome === 'error') {
    return authState?.status === 'blocked' || payload?.status === 'blocked' ? 'blocked' : 'failed';
  }

  switch (buttonKey) {
    case 'verify-icloudpd':
      if (payload?.readiness?.status === 'ok' || payload?.readiness?.icloudpdAvailable === true) return 'success';
      return 'failed';
    case 'check-login':
      if (authState?.status === 'authenticated') return 'success';
      if (authState?.status === 'preflight_failed' || authState?.status === 'provider_failed') return 'failed';
      return 'pending';
    case 'login-using-env':
      if (authState?.status === 'authenticated') return 'success';
      if (authState?.requires_2fa === true || authState?.two_factor_status === 'required') return 'pending';
      if (authState?.status === 'blocked' || payload?.status === 'blocked') return 'blocked';
      return 'failed';
    case 'logout-b1-auth':
      if (payload?.status === 'ok' || payload?.logoutPerformed === true || authState?.status === 'idle') return 'success';
      return 'failed';
    case 'submit-b1-2fa':
      if (authState?.status === 'authenticated' && authState?.two_factor_status === 'complete') return 'success';
      if (authState?.two_factor_status === 'required' || authState?.requires_2fa === true) return 'pending';
      if (authState?.status === 'blocked' || payload?.status === 'blocked') return 'blocked';
      return 'failed';
    case 'refresh-b1-auth-status':
      return authState ? 'success' : 'failed';
    case 'reset-b1-auth':
      if (payload?.status === 'ok' || payload?.resetType === 'local_auth_attempt_state_only' || authState?.status === 'idle') return 'success';
      return 'failed';
    case 'test-b1-login-download-one':
      if (authState?.status === 'authenticated' || payload?.testDownload?.status === 'authenticated') return 'success';
      if (authState?.requires_2fa === true || authState?.two_factor_status === 'required') return 'pending';
      return 'failed';
    default:
      return payload?.status === 'ok' ? 'success' : 'failed';
  }
}

function summarizeAuthResult(operation, authState, payload) {
  if (authState?.error?.message) return authState.error.message;
  if (payload?.readiness?.message) return payload.readiness.message;
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
