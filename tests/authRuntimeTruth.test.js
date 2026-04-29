import assert from 'node:assert/strict';
import test from 'node:test';
import { attachSafeAuthRuntimeTruth } from '../server/auth/authRuntimeTruth.ts';

test('auth runtime truth attachment uses only safe public projection', () => {
  const truth = attachSafeAuthRuntimeTruth(
    { sourceOfTruth: 'conf/runtime-truth.json', existing: true },
    { authState: { status: 'blocked', has_required_files: true, requires_2fa: true, two_factor_status: 'required', two_factor_method: 'trusted_device', next_action: 'submit_two_factor_code', attemptId: 'attempt-runtime-truth', updatedAt: '2026-04-24T14:30:00.000Z', error: null, authenticatedUser: null, provider: 'icloud' } },
  );
  assert.equal(truth.existing, true);
  assert.equal(truth.auth.source, 'server/auth/projectPublicAuthState');
  assert.equal(truth.auth.publicState.status, 'blocked');
  assert.equal(JSON.stringify(truth).includes('providerSessionRef'), false);
  assert.equal(JSON.stringify(truth).includes('secret-session-ref'), false);
  assert.equal(JSON.stringify(truth).includes('token'), false);
  assert.equal(JSON.stringify(truth).includes('cookie'), false);
});
