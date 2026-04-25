import { createIcloudAuthProvider } from './icloudAuthProvider.js';

export const PROVIDER_OUTCOMES = Object.freeze({
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  MISSING_CONFIG: 'missing_config',
  STARTED: 'started',
  REQUIRES_2FA: 'requires_2fa',
  AUTHENTICATED: 'authenticated',
  FAILED: 'failed',
});

export function createProviderRegistry({ providers = {} } = {}) {
  const providerMap = new Map(Object.entries({
    icloud: createIcloudAuthProvider(),
    ...providers,
  }));

  return {
    getProvider(providerName = 'icloud') {
      return providerMap.get(providerName) || null;
    },
    hasProvider(providerName = 'icloud') {
      return providerMap.has(providerName);
    },
    listProviders() {
      return Array.from(providerMap.keys());
    },
  };
}

export function normalizeProviderOutcome(outcome) {
  if (!outcome || typeof outcome !== 'object') {
    return {
      outcome: PROVIDER_OUTCOMES.FAILED,
      code: 'provider_invalid_outcome',
      message: 'Provider returned an invalid auth outcome.',
    };
  }

  if (!Object.values(PROVIDER_OUTCOMES).includes(outcome.outcome)) {
    return {
      outcome: PROVIDER_OUTCOMES.FAILED,
      code: 'provider_unsupported_outcome',
      message: `Provider returned unsupported auth outcome: ${String(outcome.outcome)}`,
    };
  }

  return outcome;
}

export const defaultProviderRegistry = createProviderRegistry();
