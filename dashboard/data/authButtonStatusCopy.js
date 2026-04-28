const AUTH_BUTTON_STATUS_LABELS = Object.freeze({
  neutral: 'Ready',
  running: 'Running',
  success: 'Success',
  failed: 'Failed',
  blocked: 'Blocked',
  pending: 'Pending',
  providerDependent: 'Provider-dependent',
});

export const AUTH_BUTTON_STATUS_ORDER = Object.freeze([
  'neutral',
  'running',
  'success',
  'failed',
  'blocked',
  'pending',
  'providerDependent',
]);

const GENERIC_STATUS_COPY = Object.freeze({
  neutral: 'Ready to run. No result has been recorded for this auth button yet.',
  running: 'The backend request has started and this button is waiting for a safe public result.',
  success: 'The backend response satisfied this button\'s semantic success rule.',
  failed: 'The backend response or provider result did not satisfy this button\'s success rule.',
  blocked: 'The backend or provider boundary blocked this action. Do not treat this as authenticated success.',
  pending: 'The action produced an incomplete or waiting state that still needs provider/user follow-up.',
  providerDependent: 'This action depends on the local icloudpd executable, configured .env values, Apple account state, local auth artifacts, and network/provider behavior.',
});

export const AUTH_BUTTON_STATUS_COPY = Object.freeze({
  'verify-icloudpd': {
    label: 'Verify icloudpd',
    endpoint: 'POST /api/auth/verify-icloudpd',
    operationType: 'provider readiness preflight',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Reads configuration and provider availability; does not authenticate the Apple account.',
    successCriteria: 'Green only means required auth configuration and icloudpd readiness were proven by the backend readiness response.',
    realityReason: 'Real backend call with provider-dependent readiness checks. It does not mock icloudpd and does not claim authenticated login.',
    backendReason: 'Calls POST /api/auth/verify-icloudpd. This is a backend/provider preflight; success requires readiness evidence, not just HTTP 200.',
    statuses: {
      neutral: 'Ready to check whether the required auth config exists and whether icloudpd is callable.',
      running: 'Checking icloudpd readiness through the backend provider boundary.',
      success: 'icloudpd readiness/config preflight passed. This still does not mean the account is authenticated.',
      failed: 'icloudpd readiness/config preflight failed or did not provide readiness evidence.',
      blocked: 'The backend/provider boundary blocked icloudpd verification.',
      pending: 'icloudpd readiness is not fully proven yet; inspect the backend result for the next action.',
      providerDependent: GENERIC_STATUS_COPY.providerDependent,
    },
  },
  'check-login': {
    label: 'Check login',
    endpoint: 'POST /api/auth/resume',
    operationType: 'provider session verification',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Attempts to resume/verify existing provider auth state without entering credentials.',
    successCriteria: 'Green only when the safe public auth state is authenticated based on provider verification.',
    realityReason: 'Real backend call that verifies provider/session state instead of trusting frontend state.',
    backendReason: 'Calls POST /api/auth/resume. Success requires provider-backed authenticated state; unknown or missing session remains pending/failed.',
    statuses: {
      neutral: 'Ready to check whether an existing icloudpd/provider session can be resumed.',
      running: 'Checking existing provider session state through the backend.',
      success: 'Existing provider session was verified as authenticated by backend/provider evidence.',
      failed: 'Provider session check failed or returned a non-authenticated failure state.',
      blocked: 'Provider session verification is blocked by missing config, provider state, or backend guardrails.',
      pending: 'No conclusive authenticated session was proven yet; a login or 2FA follow-up may be needed.',
      providerDependent: GENERIC_STATUS_COPY.providerDependent,
    },
  },
  'login-using-env': {
    label: 'Login using .env values',
    endpoint: 'POST /api/auth/run',
    operationType: 'provider login attempt',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Starts a backend/provider login attempt using configured .env credentials; secrets are not rendered in the UI.',
    successCriteria: 'Green only when provider evidence returns authenticated=true/safe authenticated public state.',
    realityReason: 'Real backend provider login boundary; it is provider-dependent and must not fake success.',
    backendReason: 'Calls POST /api/auth/run. It mutates local/provider auth attempt state and only reports success when provider proof exists.',
    statuses: {
      neutral: 'Ready to start the backend-owned login attempt using configured .env values.',
      running: 'Starting provider login through the backend. Secrets remain server-side and sanitized.',
      success: 'Provider login was proven authenticated by the backend safe public auth state.',
      failed: 'Login completed without provider-authenticated proof or failed provider/config validation.',
      blocked: 'Login is blocked by provider limits, missing config, unsupported flow, or backend safety guardrails.',
      pending: 'Login needs follow-up, usually provider state or 2FA. Do not treat this as authenticated yet.',
      providerDependent: GENERIC_STATUS_COPY.providerDependent,
    },
  },
  // Legacy b1-suffixed keys below are compatibility action IDs for the visible
  // 1A-AUTH card. Do not read them as View B ownership.
  'logout-b1-auth': {
    label: 'Logout',
    endpoint: 'POST /api/auth/logout',
    operationType: 'local provider-artifact cleanup',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Clears local auth attempt state and local provider artifacts where the backend supports it.',
    successCriteria: 'Green means local/provider cleanup completed according to the backend response; it does not claim remote Apple logout.',
    realityReason: 'Real backend cleanup call. It affects local/provider artifacts but does not promise remote Apple account logout.',
    backendReason: 'Calls POST /api/auth/logout. It mutates local provider-artifact state and should never overclaim remote provider logout.',
    statuses: {
      neutral: 'Ready to clear local auth attempt and local provider-artifact state.',
      running: 'Requesting backend logout/local provider cleanup.',
      success: 'Local/provider cleanup completed according to the backend response. Remote Apple logout is not claimed.',
      failed: 'Logout/local cleanup failed or returned an unsafe/unclear result.',
      blocked: 'Logout/local cleanup was blocked by backend/provider guardrails.',
      pending: 'Logout/local cleanup result is not final yet; inspect the backend response.',
      providerDependent: 'Provider cleanup depends on local icloudpd provider storage and filesystem access.',
    },
  },
  'submit-b1-2fa': {
    label: 'Submit 2FA',
    endpoint: 'POST /api/auth/2fa/submit',
    operationType: '2FA handoff boundary',
    realityState: 'mixed',
    backendState: 'missing',
    mutates: 'Submits a 2FA code only through the backend route; current non-interactive icloudpd completion may remain unsupported.',
    successCriteria: 'Green only if the backend later proves both authenticated status and completed 2FA. Unsupported non-interactive 2FA must stay blocked or pending.',
    realityReason: 'The route and UI are real, but current icloudpd non-interactive 2FA completion is partial/unsupported unless provider evidence proves otherwise.',
    backendReason: 'Calls POST /api/auth/2fa/submit. Backend route exists, but unsupported non-interactive icloudpd 2FA must not be shown as solved.',
    statuses: {
      neutral: 'Ready only when backend reports that 2FA is required.',
      running: 'Submitting 2FA through the backend route. The code is sanitized from request metadata.',
      success: '2FA completion and authenticated status were both proven by backend/provider evidence.',
      failed: '2FA submission failed or did not produce authenticated/provider-complete evidence.',
      blocked: '2FA is currently blocked or unsupported by the non-interactive icloudpd provider boundary.',
      pending: '2FA is still required or waiting. This is not authenticated success.',
      providerDependent: '2FA depends on Apple/provider behavior and current icloudpd support for safe non-interactive completion.',
    },
  },
  'refresh-b1-auth-status': {
    label: 'Refresh status',
    endpoint: 'GET /api/auth/status',
    operationType: 'safe public status read',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Reads the safe public auth projection without changing provider state.',
    successCriteria: 'Green means the backend returned a safe public auth state projection, not that login is authenticated.',
    realityReason: 'Real backend read-only status call; it returns sanitized public auth state only.',
    backendReason: 'Calls GET /api/auth/status. It is read-only and never implies authentication by itself.',
    statuses: {
      neutral: 'Ready to fetch the current safe public auth state.',
      running: 'Refreshing auth status from the backend.',
      success: 'Safe public auth state was loaded from the backend. Check the status value before assuming login state.',
      failed: 'Auth status refresh failed or did not return a safe public auth projection.',
      blocked: 'Auth status refresh was blocked by backend guardrails.',
      pending: 'Auth status refresh returned an incomplete/unknown state.',
      providerDependent: 'Status can reflect provider-dependent auth state, but the endpoint itself is a safe backend read.',
    },
  },
  'reset-b1-auth': {
    label: 'Reset local attempt',
    endpoint: 'POST /api/auth/reset',
    operationType: 'local state reset',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Clears only local auth attempt state in the backend/dashboard auth service.',
    successCriteria: 'Green means local attempt state reset completed. It does not clear remote provider sessions or prove logout.',
    realityReason: 'Real backend local-state reset. It is intentionally local-only, not provider authentication.',
    backendReason: 'Calls POST /api/auth/reset. It mutates local attempt state only and does not invalidate provider sessions.',
    statuses: {
      neutral: 'Ready to clear the local auth attempt state.',
      running: 'Resetting local auth attempt state through the backend.',
      success: 'Local auth attempt state was reset. Provider local auth artifacts/sessions may still exist unless logout is used.',
      failed: 'Local auth attempt reset failed or returned an unclear result.',
      blocked: 'Local reset was blocked by backend guardrails.',
      pending: 'Local reset result is not final yet; inspect the backend response.',
      providerDependent: 'This action is mostly local; provider state may still influence later status checks.',
    },
  },
  'test-b1-login-download-one': {
    label: 'TEST LOGIN BY DOWNLOADING A SINGLE FILE',
    endpoint: 'POST /api/auth/test-login-download-one',
    operationType: 'diagnostic provider download',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Runs a diagnostic icloudpd download attempt into the configured test/runtime area.',
    successCriteria: 'Green only when the diagnostic download succeeds according to backend/provider response.',
    realityReason: 'Real diagnostic backend call using icloudpd/provider behavior; not a frontend mock.',
    backendReason: 'Calls POST /api/auth/test-login-download-one. It is diagnostic and provider-dependent; 2FA-required states must remain pending/blocked.',
    statuses: {
      neutral: 'Ready to run a diagnostic single-file download through icloudpd.',
      running: 'Running the backend diagnostic download attempt.',
      success: 'Diagnostic single-file download succeeded according to backend/provider evidence.',
      failed: 'Diagnostic download failed or did not prove usable authenticated provider access.',
      blocked: 'Diagnostic download was blocked by provider state, missing config, or backend guardrails.',
      pending: 'Diagnostic download needs provider/user follow-up, such as authentication or 2FA.',
      providerDependent: GENERIC_STATUS_COPY.providerDependent,
    },
  },
});

export function normalizeAuthButtonStatusForCopy(status) {
  return AUTH_BUTTON_STATUS_ORDER.includes(status) ? status : 'neutral';
}

export function getAuthButtonCopy(buttonKey) {
  return AUTH_BUTTON_STATUS_COPY[buttonKey] ?? null;
}

export function getAuthButtonStatusHelp(buttonKey, status, backendMessage = '') {
  const copy = getAuthButtonCopy(buttonKey);
  const normalizedStatus = normalizeAuthButtonStatusForCopy(status);
  const statusCopy = copy?.statuses?.[normalizedStatus] ?? GENERIC_STATUS_COPY[normalizedStatus] ?? GENERIC_STATUS_COPY.neutral;
  const backendLine = backendMessage ? `Latest backend message: ${backendMessage}` : '';
  const endpointLine = copy?.endpoint ? `Endpoint: ${copy.endpoint}.` : '';
  const successLine = copy?.successCriteria ? `Success rule: ${copy.successCriteria}` : '';

  return [statusCopy, backendLine, endpointLine, successLine]
    .filter(Boolean)
    .join(' ');
}

export function getAuthButtonStatusLabel(status) {
  const normalizedStatus = normalizeAuthButtonStatusForCopy(status);
  return AUTH_BUTTON_STATUS_LABELS[normalizedStatus] ?? AUTH_BUTTON_STATUS_LABELS.neutral;
}

export function getAuthButtonInspectCopy(buttonKey) {
  const copy = getAuthButtonCopy(buttonKey);
  if (!copy) return null;
  return {
    label: copy.label,
    description: `${copy.operationType}. ${copy.mutates} Semantic success rule: ${copy.successCriteria}`,
  };
}

export function getAuthButtonRealityCopy(buttonKey) {
  const copy = getAuthButtonCopy(buttonKey);
  if (!copy) return null;
  return {
    state: copy.realityState,
    reason: copy.realityReason,
  };
}

export function getAuthButtonBackendStatusCopy(buttonKey) {
  const copy = getAuthButtonCopy(buttonKey);
  if (!copy) return null;
  return {
    state: copy.backendState,
    reason: `${copy.backendReason} ${copy.mutates} ${copy.successCriteria}`,
  };
}
