import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRealIcloudpdReadinessProof } from '../tools/real-icloudpd-readiness-proof-lib.mjs';

const metadata = { version: 'test', gitCommit: 'test' };

test('real iCloudPD readiness blocks without opt-in and config', () => {
  const envelope = buildRealIcloudpdReadinessProof({ metadata, env: {} });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.evidence.checks.find((check) => check.name === 'real_icloudpd_opt_in_set').passed, false);
  assert.equal(envelope.evidence.readiness.auth_checkpoint_required_state, 'AUTH_SESSION_USABLE');
});

test('real iCloudPD readiness passes configured inputs without downloading media', () => {
  const envelope = buildRealIcloudpdReadinessProof({ metadata, env: { PF_PROOF_ENABLE_REAL_ICLOUDPD: 'true', user: 'apple@example.test', pw: 'super-password-123', ICLOUDPD_COOKIE_DIR: '/tmp/cookies' } });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.checks.every((check) => check.passed), true);
  assert.equal(JSON.stringify(envelope).includes('apple@example.test'), false);
  assert.equal(JSON.stringify(envelope).includes('super-password-123'), false);
  assert.match(envelope.known_limitations[0], /does not run iCloudPD/);
});
