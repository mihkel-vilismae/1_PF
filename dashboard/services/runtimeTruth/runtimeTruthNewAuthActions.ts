/*
 * Coordinates NEW AUTH runtime-truth actions for the dashboard.
 * Keeps frontend modal state, button state, logs, and history aligned with safe endpoint payloads.
 */
import {
  NEW_AUTH_ENDPOINTS,
  fetchNewAuthSessionFiles,
  fetchNewAuthStatus,
  fetchPassiveNewAuthStatus,
  logoutNewAuthSession,
  startNewAuthLogin,
  submitNewAuthTwoFactor,
  verifyNewAuthIcloudpd,
} from '../newAuthService.ts';
import {
  NEW_AUTH_BUTTON_DEFAULTS,
  NEW_AUTH_CARD_KEY,
  NEW_AUTH_HISTORY_SOURCE,
  NEW_AUTH_PROVIDER_PROOF_SKIPPED_CODE,
  NEW_AUTH_PROVIDER_PROOF_SKIPPED_EXPLANATION,
  NEW_AUTH_PROVIDER_PROOF_SKIPPED_TITLE,
  NEW_AUTH_SESSION_BUTTON_KEYS,
  SECRET_FIELD_PATTERN,
} from './newAuthActions/runtimeTruthNewAuthConstants.ts';
import {
  buildNewAuthButtonState,
  buildNewAuthHistoryDetails,
  buildNewAuthLogDetails,
  buildNewAuthResult,
} from './newAuthActions/runtimeTruthNewAuthResultBuilders.ts';
import {
  extractSafeProviderCommunication,
  sanitizeNewAuthPayload,
} from './newAuthActions/runtimeTruthNewAuthSanitize.ts';

// Creates the NEW AUTH runtime-truth action bundle used by the dashboard card.
export function createRuntimeTruthNewAuthActions({ patchState, pushHistory, pushLog, setStatus, openModal, guards }) {
  const { guardAction, endAction } = guards;

  // Runs the NEW AUTH iCloudPD verification action without changing endpoint bindings.
  async function verifyIcloudpdAction() {
    return runNewAuthBackendAction({
      buttonKey: 'new-auth-verify-icloudpd',
      operation: 'Verify iCloudPD',
      endpoint: NEW_AUTH_ENDPOINTS.verifyIcloudpd,
      execute: verifyNewAuthIcloudpd,
      duplicateMessage: '1A-STASH-OFF iCloudPD verification is already running; duplicate start was blocked.',
    });
  }

  // Runs the passive NEW AUTH login/status check action.
  async function checkLoginAction() {
    return runNewAuthBackendAction({
      buttonKey: 'new-auth-check-login',
      operation: 'Check new auth login status',
      endpoint: NEW_AUTH_ENDPOINTS.passiveStatus,
      execute: fetchPassiveNewAuthStatus,
      duplicateMessage: '1A-STASH-OFF login status check is already running; duplicate start was blocked.',
    });
  }


  // Actively verifies existing session files with iCloudPD provider proof.
  async function verifyProviderSessionAction() {
    return runNewAuthBackendAction({
      buttonKey: 'new-auth-verify-provider-session',
      operation: 'Verify new auth provider session',
      endpoint: NEW_AUTH_ENDPOINTS.providerSessionProof,
      execute: fetchNewAuthStatus,
      duplicateMessage: '1A-STASH-OFF provider session verification is already running; duplicate start was blocked.',
    });
  }

  // Starts provider login through the NEW AUTH login endpoint and opens the modal.
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

  // Submits the user-entered 2FA code or device index to the NEW AUTH endpoint.
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

  // Runs the local NEW AUTH session cleanup/logout action.
  async function logoutAction() {
    return runNewAuthBackendAction({
      buttonKey: 'new-auth-logout-session',
      operation: 'Log out and remove existing session',
      endpoint: NEW_AUTH_ENDPOINTS.logout,
      execute: logoutNewAuthSession,
      duplicateMessage: '1A-STASH-OFF logout/session removal is already running; duplicate start was blocked.',
    });
  }

  // Loads safe NEW AUTH session file path metadata without file contents.
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

  // Opens or refreshes the NEW AUTH login modal with safe iCloudPD communication text.
  function openNewAuthLoginModal(stage, message, twoFactorPrompt = null, providerCommunication = null) {
    const safeCommunication = extractSafeProviderCommunication(providerCommunication);
    pushLog(NEW_AUTH_CARD_KEY, 'info', `New auth modal ${stage}.`, buildNewAuthLogDetails({
      operation: 'New auth modal update',
      endpoint: NEW_AUTH_ENDPOINTS.login,
      outcome: 'modal',
      payload: { stage, message, ...sanitizeNewAuthPayload(twoFactorPrompt), providerOutputPreview: safeCommunication },
    }));
    openModal({
      kind: 'new-auth-login-v2',
      title: '1A-STASH-OFF login using .env values',
      subtitle: message,
      stage,
      message,
      providerOutputPreview: safeCommunication,
      ...(twoFactorPrompt ?? {}),
    });
  }

  // Runs one NEW AUTH backend action and synchronizes button, log, history, and modal state.
  async function runNewAuthBackendAction({ buttonKey, operation, endpoint, execute, duplicateMessage, modalStage = false, resultTarget = 'latestResult' }) {
    if (!guardAction(NEW_AUTH_CARD_KEY, NEW_AUTH_HISTORY_SOURCE, duplicateMessage)) {
      return null;
    }

    const runningMessage = `${operation} started through ${endpoint.method} ${endpoint.path}.`;
    setStatus(NEW_AUTH_CARD_KEY, 'running');
    patchState((draft) => {
      draft.newAuth.buttonStates ??= {};
      recalculateNewAuthButtonStates(draft);
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
        recalculateNewAuthButtonStates(draft, { buttonKey, endpoint, status, message, payload: safePayload });
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
        openNewAuthLoginModal(status === 'success' ? 'authenticated' : 'waiting_for_2fa', message, getNewAuthTwoFactorPrompt(safePayload), safePayload);
      }
      return safePayload;
    } catch (error) {
      const safePayload = sanitizeNewAuthPayload(error?.payload ?? null);
      const message = safePayload?.message ?? error?.message ?? `${operation} failed.`;
      patchState((draft) => {
        draft.newAuth.buttonStates ??= {};
        draft.newAuth.buttonStates[buttonKey] = buildNewAuthButtonState('failed', message, endpoint);
        draft.newAuth[resultTarget] = buildNewAuthResult({ operation, endpoint, outcome: 'error', message, payload: safePayload, meta: sanitizeNewAuthPayload(error?.meta ?? null) });
        recalculateNewAuthButtonStates(draft, { buttonKey, endpoint, status: 'failed', message, payload: safePayload });
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
        openNewAuthLoginModal('failed', message, null, safePayload);
      }
      return null;
    } finally {
      endAction(NEW_AUTH_CARD_KEY);
    }
  }

  return {
    verifyIcloudpdAction,
    verifyProviderSessionAction,
    checkLoginAction,
    loginUsingEnvAction,
    submitTwoFactorAction,
    logoutAction,
    sessionFilesAction,
  };
}

// Classifies NEW AUTH button status while keeping 2FA pending before failed states.
function classifyNewAuthButtonStatus(buttonKey, payload, transportOutcome) {
  if (transportOutcome === 'error') return 'failed';
  if (hasNewAuthTwoFactorPrompt(payload)) return 'pending';
  if (isNewAuthProviderProofSkipped(payload)) return 'blocked';
  if (payload?.state === 'unverified') return 'pending';
  if (payload?.ok === false || payload?.state === 'failed' || payload?.status === 'error') return 'failed';
  if (payload?.state === 'logged_out') {
    if (buttonKey === 'new-auth-check-login' || buttonKey === 'new-auth-logout-session') return 'success';
    if (buttonKey === 'new-auth-login-using-env') return 'neutral';
  }
  if (buttonKey === 'new-auth-check-login') return payload?.state === 'authenticated' || payload?.state === 'logged_out' ? 'success' : 'pending';
  if (buttonKey === 'new-auth-login-using-env') return payload?.state === 'authenticated' ? 'success' : 'pending';
  if (buttonKey === 'new-auth-session-files') return Array.isArray(payload?.paths) || payload?.ok === true ? 'success' : 'pending';
  return payload?.ok === true || payload?.state === 'authenticated' || payload?.status === 'ok' ? 'success' : 'pending';
}

// Recalculates all NEW AUTH button states from current and persisted result payloads.
function recalculateNewAuthButtonStates(draft, currentResult = null) {
  draft.newAuth.buttonStates ??= {};
  for (const [key, message] of Object.entries(NEW_AUTH_BUTTON_DEFAULTS)) {
    draft.newAuth.buttonStates[key] ??= buildNewAuthButtonState('neutral', message, null);
  }

  const sessionResult = currentResult?.payload && isNewAuthSessionEndpoint(currentResult.endpoint?.path)
    ? currentResult
    : isNewAuthSessionResult(draft.newAuth.latestResult)
      ? resultToButtonProjection(draft.newAuth.latestResult)
      : null;

  if (sessionResult?.payload) {
    applyNewAuthSessionProjection(draft, sessionResult);
  }

  if (draft.newAuth.sessionFilesResult?.payload && currentResult?.buttonKey !== 'new-auth-session-files') {
    const payload = draft.newAuth.sessionFilesResult.payload;
    const message = draft.newAuth.sessionFilesResult.message ?? summarizeNewAuthResult('Show auth/session paths and files', payload);
    draft.newAuth.buttonStates['new-auth-session-files'] = buildNewAuthButtonState(
      classifyNewAuthButtonStatus('new-auth-session-files', payload, 'success'),
      message,
      NEW_AUTH_ENDPOINTS.sessionFiles,
    );
  }

  if (currentResult) {
    draft.newAuth.buttonStates[currentResult.buttonKey] = buildNewAuthButtonState(
      currentResult.status,
      currentResult.message,
      currentResult.endpoint,
    );
  }
}

// Applies login/check-login/logout projections consistently across session-related buttons.
function applyNewAuthSessionProjection(draft, { buttonKey, endpoint, status, message, payload }) {
  const sessionStatus = classifyNewAuthSessionStatus(payload);
  const sessionMessage = messageForNewAuthSessionStatus(sessionStatus, message);

  for (const key of NEW_AUTH_SESSION_BUTTON_KEYS) {
    draft.newAuth.buttonStates[key] = buildNewAuthButtonState(sessionStatus, sessionMessage, null);
  }

  if (buttonKey === 'new-auth-check-login') {
    draft.newAuth.buttonStates[buttonKey] = buildNewAuthButtonState(status, message, endpoint);
  }

  if (buttonKey === 'new-auth-login-using-env') {
    draft.newAuth.buttonStates[buttonKey] = buildNewAuthButtonState(sessionStatus, sessionMessage, endpoint);
  }

  if (buttonKey === 'new-auth-logout-session' && status === 'success') {
    const logoutMessage = `Logged out locally. Run this action again when a new session is needed. Last logout: ${message}`;
    for (const key of NEW_AUTH_SESSION_BUTTON_KEYS) {
      draft.newAuth.buttonStates[key] = buildNewAuthButtonState('neutral', logoutMessage, null);
    }
  }
}

// Converts NEW AUTH session payload state into the dashboard button-state vocabulary.
function classifyNewAuthSessionStatus(payload) {
  if (!payload || typeof payload !== 'object') return 'neutral';
  if (payload.state === 'logged_out') return 'neutral';
  if (payload.state === 'authenticated' || payload.state === 'success') return 'success';
  if (isNewAuthProviderProofSkipped(payload)) return 'blocked';
  if (hasNewAuthTwoFactorPrompt(payload) || payload.state === 'unverified') return 'pending';
  if (payload.ok === false || payload.state === 'failed' || payload.status === 'error') return 'failed';
  return 'pending';
}

// Builds the session-status message shown on login-related NEW AUTH controls.
function messageForNewAuthSessionStatus(status, fallbackMessage) {
  if (status === 'neutral') {
    return fallbackMessage ? `No authenticated new-auth session is active. Last result: ${fallbackMessage}` : 'No authenticated new-auth session is active.';
  }
  return fallbackMessage || 'New-auth session state recalculated from the latest backend result.';
}

// Checks whether a stored result belongs to a session-affecting endpoint.
function isNewAuthSessionResult(result) {
  return isNewAuthSessionEndpoint(result?.endpoint);
}

// Checks whether an endpoint path can affect NEW AUTH session state.
function isNewAuthSessionEndpoint(endpointPath) {
  const normalizedPath = normalizeNewAuthEndpointPath(endpointPath);
  return normalizedPath === NEW_AUTH_ENDPOINTS.status.path
    || endpointPath === NEW_AUTH_ENDPOINTS.login.path
    || endpointPath === NEW_AUTH_ENDPOINTS.submitTwoFactor.path
    || endpointPath === NEW_AUTH_ENDPOINTS.logout.path
    || endpointPath === NEW_AUTH_ENDPOINTS.testDownload.path;
}

// Converts a stored NEW AUTH result into the button projection structure.
function resultToButtonProjection(result) {
  const endpoint = endpointForNewAuthResult(result);
  const buttonKey = buttonKeyForNewAuthEndpoint(result.endpoint);
  const payload = result.payload ?? null;
  const message = result.message ?? summarizeNewAuthResult(result.operation ?? 'New auth action', payload);
  return {
    buttonKey,
    endpoint,
    status: classifyNewAuthButtonStatus(buttonKey, payload, result.outcome === 'error' ? 'error' : 'success'),
    message,
    payload,
  };
}

// Resolves a stored NEW AUTH result endpoint path back to endpoint metadata.
function endpointForNewAuthResult(result) {
  const normalizedPath = normalizeNewAuthEndpointPath(result?.endpoint);
  return Object.values(NEW_AUTH_ENDPOINTS).find((endpoint) => normalizeNewAuthEndpointPath(endpoint.path) === normalizedPath) ?? null;
}

// Maps a NEW AUTH endpoint path to the dashboard button key it controls.
function buttonKeyForNewAuthEndpoint(endpointPath) {
  const normalizedPath = normalizeNewAuthEndpointPath(endpointPath);
  if (normalizedPath === NEW_AUTH_ENDPOINTS.status.path) return 'new-auth-check-login';
  if (endpointPath === NEW_AUTH_ENDPOINTS.login.path || endpointPath === NEW_AUTH_ENDPOINTS.submitTwoFactor.path) return 'new-auth-login-using-env';
  if (endpointPath === NEW_AUTH_ENDPOINTS.logout.path) return 'new-auth-logout-session';
  if (endpointPath === NEW_AUTH_ENDPOINTS.sessionFiles.path) return 'new-auth-session-files';
  return 'new-auth-verify-icloudpd';
}

// Normalizes endpoint paths before comparing optional query-string variants.
function normalizeNewAuthEndpointPath(endpointPath) {
  return typeof endpointPath === 'string' ? endpointPath.split('?')[0] : endpointPath;
}

// Detects backend 2FA prompt shapes that should keep login status pending.
function hasNewAuthTwoFactorPrompt(payload) {
  const details = payload?.details && typeof payload.details === 'object' ? payload.details : null;
  const providerProof = details?.providerProof && typeof details.providerProof === 'object' ? details.providerProof : null;
  return payload?.state === 'pending_2fa'
    || payload?.state === 'requires_2fa'
    || payload?.requires2fa === true
    || payload?.requires_2fa === true
    || details?.requires2fa === true
    || providerProof?.requires2fa === true
    || Array.isArray(details?.userPrompts)
    || Array.isArray(providerProof?.userPrompts);
}

// Summarizes a NEW AUTH backend payload into the existing button/log message style.
function summarizeNewAuthResult(operation, payload) {
  if (isNewAuthProviderProofSkipped(payload)) {
    return `${NEW_AUTH_PROVIDER_PROOF_SKIPPED_TITLE} ${NEW_AUTH_PROVIDER_PROOF_SKIPPED_EXPLANATION}`;
  }
  if (payload?.message) return payload.message;
  if (payload?.state) return `${operation} returned state: ${payload.state}.`;
  if (payload?.status) return `${operation} returned status: ${payload.status}.`;
  return `${operation} completed.`;
}

// Detects passive status responses where local session files exist but provider proof was intentionally skipped.
function isNewAuthProviderProofSkipped(payload) {
  const details = payload?.details && typeof payload.details === 'object' ? payload.details : null;
  const providerProof = details?.providerProof && typeof details.providerProof === 'object' ? details.providerProof : null;
  return payload?.errorCode === NEW_AUTH_PROVIDER_PROOF_SKIPPED_CODE
    || providerProof?.reasonCode === NEW_AUTH_PROVIDER_PROOF_SKIPPED_CODE;
}

// Reads the backend-supplied 2FA prompt metadata used by the modal input copy.
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
