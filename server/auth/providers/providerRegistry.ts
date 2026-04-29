import { createIcloudAuthProvider } from './icloudAuthProvider.ts';
import type { AuthProvider, AuthProviderOutcome, AuthProviderRegistry } from '../authTypes.ts';

export const PROVIDER_OUTCOMES = Object.freeze({
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  MISSING_CONFIG: 'missing_config',
  STARTED: 'started',
  REQUIRES_2FA: 'requires_2fa',
  AUTHENTICATED: 'authenticated',
  FAILED: 'failed',
});

interface CreateProviderRegistryOptions {
  providers?: Record<string, AuthProvider>;
}

export function createProviderRegistry({ providers = {} }: CreateProviderRegistryOptions = {}): AuthProviderRegistry {
  const providerMap = new Map<string, AuthProvider>(Object.entries({
    icloud: createIcloudAuthProvider(),
    ...providers,
  }));

  return {
    getProvider(providerName = 'icloud'): AuthProvider | null {
      return providerMap.get(providerName) || null;
    },
    hasProvider(providerName = 'icloud'): boolean {
      return providerMap.has(providerName);
    },
    listProviders(): string[] {
      return Array.from(providerMap.keys());
    },
  };
}

export function normalizeProviderOutcome(outcome: unknown): AuthProviderOutcome {
  if (!outcome || typeof outcome !== 'object') {
    return {
      outcome: PROVIDER_OUTCOMES.FAILED,
      code: 'provider_invalid_outcome',
      message: 'Provider returned an invalid auth outcome.',
    };
  }

  const providerOutcome = outcome as AuthProviderOutcome;
  if (!Object.values(PROVIDER_OUTCOMES).includes(providerOutcome.outcome)) {
    return {
      outcome: PROVIDER_OUTCOMES.FAILED,
      code: 'provider_unsupported_outcome',
      message: `Provider returned unsupported auth outcome: ${String(providerOutcome.outcome)}`,
    };
  }

  return providerOutcome;
}

export const defaultProviderRegistry: AuthProviderRegistry = createProviderRegistry();
