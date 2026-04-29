import { getPublicAuthState } from './authService.ts';

export function attachSafeAuthRuntimeTruth(truth, { authState = getPublicAuthState() } = {}) {
  return {
    ...truth,
    auth: {
      source: 'server/auth/projectPublicAuthState',
      publicState: authState,
    },
  };
}
