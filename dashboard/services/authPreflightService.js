import { requestJson } from './apiClient.js';

export const AUTH_PREFLIGHT_ENDPOINTS = Object.freeze({
  status: { method: 'GET', path: '/api/auth/status' },
  run: { method: 'POST', path: '/api/auth/run' },
  testLoginDownloadOne: { method: 'POST', path: '/api/auth/test-login-download-one' },
  reset: { method: 'POST', path: '/api/auth/reset' },
  submitTwoFactor: { method: 'POST', path: '/api/auth/2fa/submit' },
  logout: { method: 'POST', path: '/api/auth/logout' },
});

export function fetchAuthStatus() {
  return callAuthEndpoint(AUTH_PREFLIGHT_ENDPOINTS.status);
}

export function runAuthPreflight() {
  return callAuthEndpoint(AUTH_PREFLIGHT_ENDPOINTS.run);
}

export function testLoginByDownloadingSingleFile() {
  return callAuthEndpoint(AUTH_PREFLIGHT_ENDPOINTS.testLoginDownloadOne);
}

export function resetAuthPreflight() {
  return callAuthEndpoint(AUTH_PREFLIGHT_ENDPOINTS.reset);
}

export function submitAuthTwoFactor(code) {
  return callAuthEndpoint(AUTH_PREFLIGHT_ENDPOINTS.submitTwoFactor, { code });
}

export function logoutAuthPreflight() {
  return callAuthEndpoint(AUTH_PREFLIGHT_ENDPOINTS.logout);
}

function callAuthEndpoint(endpoint, body = null) {
  return requestJson(endpoint.path, {
    method: endpoint.method,
    body,
    captureMeta: true,
    operation: `${endpoint.method} ${endpoint.path}`,
  });
}
