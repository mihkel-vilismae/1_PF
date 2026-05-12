/*
 * Wraps NEW AUTH backend endpoints behind the shared dashboard API client.
 * Keeps endpoint metadata centralized so UI actions can log requests consistently.
 */
import { requestJson, type ApiResponseWithMeta } from './apiClient.ts';

type NewAuthEndpoint = {
  method: string;
  path: string;
};

export type NewAuthEndpointResponse<TPayload = unknown> = ApiResponseWithMeta<TPayload>;

export const NEW_AUTH_ENDPOINTS = Object.freeze({
  status: { method: 'GET', path: '/api/auth/new/status' },
  passiveStatus: { method: 'GET', path: '/api/auth/new/status?mode=passive' },
  providerSessionProof: { method: 'GET', path: '/api/auth/new/status' },
  verifyIcloudpd: { method: 'POST', path: '/api/auth/new/verify-icloudpd' },
  login: { method: 'POST', path: '/api/auth/new/login' },
  submitTwoFactor: { method: 'POST', path: '/api/auth/new/submit-2fa' },
  logout: { method: 'POST', path: '/api/auth/new/logout' },
  sessionFiles: { method: 'GET', path: '/api/auth/new/session-files' },
  testDownload: { method: 'POST', path: '/api/auth/new/test-download' },
});

// Actively verifies the NEW AUTH provider session through the status endpoint.
export function fetchNewAuthStatus(): Promise<NewAuthEndpointResponse> {
  return callNewAuthEndpoint(NEW_AUTH_ENDPOINTS.providerSessionProof);
}

// Reads NEW AUTH status without starting provider proof.
export function fetchPassiveNewAuthStatus(): Promise<NewAuthEndpointResponse> {
  return callNewAuthEndpoint(NEW_AUTH_ENDPOINTS.passiveStatus);
}

// Checks iCloudPD executable/config readiness without proving account login.
export function verifyNewAuthIcloudpd(): Promise<NewAuthEndpointResponse> {
  return callNewAuthEndpoint(NEW_AUTH_ENDPOINTS.verifyIcloudpd);
}

export function startNewAuthLogin(): Promise<NewAuthEndpointResponse> {
  return callNewAuthEndpoint(NEW_AUTH_ENDPOINTS.login);
}

export function submitNewAuthTwoFactor(code: unknown): Promise<NewAuthEndpointResponse> {
  return callNewAuthEndpoint(NEW_AUTH_ENDPOINTS.submitTwoFactor, { code });
}

export function logoutNewAuthSession(): Promise<NewAuthEndpointResponse> {
  return callNewAuthEndpoint(NEW_AUTH_ENDPOINTS.logout);
}

export function fetchNewAuthSessionFiles(): Promise<NewAuthEndpointResponse> {
  return callNewAuthEndpoint(NEW_AUTH_ENDPOINTS.sessionFiles);
}

export function runNewAuthTestDownload(): Promise<NewAuthEndpointResponse> {
  return callNewAuthEndpoint(NEW_AUTH_ENDPOINTS.testDownload);
}

// Sends a NEW AUTH request through the shared API client with metadata capture enabled.
function callNewAuthEndpoint(endpoint: NewAuthEndpoint, body: unknown = undefined): Promise<NewAuthEndpointResponse> {
  return requestJson(endpoint.path, {
    method: endpoint.method,
    body,
    captureMeta: true,
    operation: `${endpoint.method} ${endpoint.path}`,
  });
}
