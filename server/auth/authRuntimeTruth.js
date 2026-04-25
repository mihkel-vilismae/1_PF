import { getPublicAuthState } from './authService.js';

export function attachSafeAuthRuntimeTruth(truth, { authState = getPublicAuthState() } = {}) {
  return {
    ...truth,
    auth: {
      source: 'server/auth/projectPublicAuthState',
      publicState: authState,
    },
  };
}
