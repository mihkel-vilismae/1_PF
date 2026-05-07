import { requestJson, type ApiResponseWithMeta } from './apiClient.ts';

type NewAuthEndpoint = {
  method: string;
  path: string;
};

export type NewAuthEndpointResponse<TPayload = unknown> = ApiResponseWithMeta<TPayload>;

export const NEW_AUTH_ENDPOINTS = Object.freeze({
  status: { method: 'GET', path: '/api/auth/new/status' },
  passiveStatus: { method: 'GET', path: '/api/auth/new/status?mode=passive' },
  verifyIcloudpd: { method: 'POST', path: '/api/auth/new/verify-icloudpd' },
  login: { method: 'POST', path: '/api/auth/new/login' },
  submitTwoFactor: { method: 'POST', path: '/api/auth/new/submit-2fa' },
  logout: { method: 'POST', path: '/api/auth/new/logout' },
  sessionFiles: { method: 'GET', path: '/api/auth/new/session-files' },
  testDownload: { method: 'POST', path: '/api/auth/new/test-download' },
});

export function fetchNewAuthStatus(): Promise<NewAuthEndpointResponse> {
  return callNewAuthEndpoint(NEW_AUTH_ENDPOINTS.status);
}

export function fetchPassiveNewAuthStatus(): Promise<NewAuthEndpointResponse> {
  return callNewAuthEndpoint(NEW_AUTH_ENDPOINTS.passiveStatus);
}

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

function callNewAuthEndpoint(endpoint: NewAuthEndpoint, body: unknown = undefined): Promise<NewAuthEndpointResponse> {
  return requestJson(endpoint.path, {
    method: endpoint.method,
    body,
    captureMeta: true,
    operation: `${endpoint.method} ${endpoint.path}`,
  });
}
