import { PROVIDER_OUTCOMES } from './providerRegistry.ts';

export function createMockDisabledProvider({ outcome = PROVIDER_OUTCOMES.PROVIDER_UNAVAILABLE, overrides = {} } = {}) {
  return {
    name: 'mock-disabled',
    async startLogin() {
      return {
        outcome,
        message: 'Test-only disabled provider returned an honest non-authenticated outcome.',
        ...overrides,
      };
    },
  };
}
