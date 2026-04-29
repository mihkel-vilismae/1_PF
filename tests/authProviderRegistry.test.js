import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PROVIDER_OUTCOMES,
  createProviderRegistry,
  normalizeProviderOutcome,
} from '../server/auth/providers/providerRegistry.ts';
import { createMockDisabledProvider } from '../server/auth/providers/mockDisabledProvider.ts';

test('provider registry selects the requested provider', () => {
  const testProvider = createMockDisabledProvider();
  const registry = createProviderRegistry({ providers: { test: testProvider } });

  assert.equal(registry.hasProvider('test'), true);
  assert.equal(registry.getProvider('test'), testProvider);
  assert.equal(registry.getProvider('missing'), null);
  assert.equal(registry.listProviders().includes('icloud'), true);
});

test('disabled mock provider never returns authenticated success', async () => {
  const provider = createMockDisabledProvider({
    outcome: PROVIDER_OUTCOMES.REQUIRES_2FA,
    overrides: { two_factor_method: 'sms' },
  });

  const result = await provider.startLogin();

  assert.equal(result.outcome, 'requires_2fa');
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'authenticatedUser'), false);
});

test('normalizeProviderOutcome converts unsupported outcomes to failure', () => {
  const result = normalizeProviderOutcome({ outcome: 'bogus', token: 'secret-token' });

  assert.equal(result.outcome, 'failed');
  assert.equal(result.message.includes('unsupported auth outcome'), true);
});
