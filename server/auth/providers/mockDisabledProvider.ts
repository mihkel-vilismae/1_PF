import { PROVIDER_OUTCOMES } from './providerRegistry.ts';
import type { AuthProvider, AuthProviderOutcome } from '../authTypes.ts';

interface CreateMockDisabledProviderOptions {
  outcome?: string;
  overrides?: Partial<AuthProviderOutcome>;
}

export function createMockDisabledProvider({
  outcome = PROVIDER_OUTCOMES.PROVIDER_UNAVAILABLE,
  overrides = {},
}: CreateMockDisabledProviderOptions = {}): AuthProvider {
  return {
    name: 'mock-disabled',
    async startLogin(): Promise<AuthProviderOutcome> {
      return {
        outcome,
        message: 'Test-only disabled provider returned an honest non-authenticated outcome.',
        ...overrides,
      };
    },
  };
}
