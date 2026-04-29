import { getPublicAuthState } from './authService.ts';
import type { PublicAuthState } from './authTypes.ts';

interface AuthRuntimeTruthOptions {
  authState?: PublicAuthState;
}

export function attachSafeAuthRuntimeTruth<TTruth extends Record<string, unknown>>(
  truth: TTruth,
  { authState = getPublicAuthState() }: AuthRuntimeTruthOptions = {},
): TTruth & { auth: { source: string; publicState: PublicAuthState } } {
  return {
    ...truth,
    auth: {
      source: 'server/auth/projectPublicAuthState',
      publicState: authState,
    },
  };
}
