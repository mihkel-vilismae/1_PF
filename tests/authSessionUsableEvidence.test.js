import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSampleAuthSessionUsableEvidence, validateAuthSessionUsableEvidence } from '../tools/auth-session-usable-evidence-lib.mjs';

test('auth session usable evidence contract accepts redacted usable-session marker', () => {
  const result = validateAuthSessionUsableEvidence(buildSampleAuthSessionUsableEvidence());
  assert.equal(result.status, 'PASSED');
  assert.deepEqual(result.errors, []);
});

test('auth session usable evidence rejects secrets and incomplete 2FA checkpoint state', () => {
  const result = validateAuthSessionUsableEvidence(buildSampleAuthSessionUsableEvidence({
    session_state: 'pending_2fa',
    operator_completed_2fa: false,
    apple_id: 'person@example.com',
    two_factor_code: '123456',
  }));
  assert.equal(result.status, 'FAILED');
  assert.ok(result.errors.some((error) => error.includes('session_state')));
  assert.ok(result.errors.some((error) => error.includes('operator_completed_2fa')));
  assert.ok(result.errors.some((error) => error.includes('secret-like key')));
  assert.ok(result.errors.some((error) => error.includes('email')));
  assert.ok(result.errors.some((error) => error.includes('2FA')));
});
