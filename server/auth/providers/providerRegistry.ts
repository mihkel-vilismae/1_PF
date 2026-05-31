/*
 * Builds the auth provider registry and normalizes provider outcomes.
 * The registry keeps iCloud as the default auth provider boundary.
 * Outcome normalization prevents unsupported provider states from leaking upward.
 * This file does not execute provider login flows directly.
 */
import { createIcloudAuthProvider } from './icloudAuthProvider.ts';
import type { AuthProvider, AuthProviderOutcome, AuthProviderRegistry } from '../authTypes.ts';

export const PROVIDER_OUTCOMES = Object.freeze({
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  MISSING_CONFIG: 'missing_config',
  STARTED: 'started',
  REQUIRES_2FA: 'requires_2fa',
  AUTHENTICATED: 'authenticated',
  FAILED: 'failed',
} as const);

type ProviderOutcomeValue = typeof PROVIDER_OUTCOMES[keyof typeof PROVIDER_OUTCOMES];

const providerOutcomeValues = new Set<ProviderOutcomeValue>(Object.values(PROVIDER_OUTCOMES));

// Checks provider outcome strings against the supported registry contract.
function isProviderOutcomeValue(value: unknown): value is ProviderOutcomeValue {
  return typeof value === 'string' && providerOutcomeValues.has(value as ProviderOutcomeValue);
}

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
  if (!isProviderOutcomeValue(providerOutcome.outcome)) {
    return {
      outcome: PROVIDER_OUTCOMES.FAILED,
      code: 'provider_unsupported_outcome',
      message: `Provider returned unsupported auth outcome: ${String(providerOutcome.outcome)}`,
    };
  }

  return providerOutcome;
}

export const defaultProviderRegistry: AuthProviderRegistry = createProviderRegistry();
