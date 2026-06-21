import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOperatorSafeIcloudSessionCheckpointContract } from '../tools/operator-safe-icloud-session-checkpoint-lib.mjs';

const metadata = { version: 'test', gitCommit: 'test' };

test('operator-safe iCloud session checkpoint contract passes and preserves ordering', () => {
  const envelope = buildOperatorSafeIcloudSessionCheckpointContract({ metadata });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.deepEqual(envelope.evidence.operator_sequence.map((step) => step.command), [
    'npm run proof:auth-checkpoint-state',
    'npm run proof:auth-session-usable-evidence-producer',
    'npm run proof:real-icloudpd-readiness',
    'npm run proof:real-icloudpd',
  ]);
  assert.equal(envelope.evidence.checks.every((check) => check.passed), true);
});

test('operator-safe iCloud session checkpoint contract does not leak synthetic secrets or paths', () => {
  const envelope = buildOperatorSafeIcloudSessionCheckpointContract({ metadata, authEvidenceFile: '/tmp/private-auth-session-evidence.json' });
  const serialized = JSON.stringify(envelope);
  assert.doesNotMatch(serialized, /operator@example\.com/);
  assert.doesNotMatch(serialized, /super-password-123/);
  assert.doesNotMatch(serialized, /123456/);
  assert.doesNotMatch(serialized, /private-cookie-dir/);
  assert.doesNotMatch(serialized, /private-auth-session-evidence\.json/);
  assert.match(serialized, /PF_AUTH_SESSION_USABLE_EVIDENCE_FILE/);
  assert.match(serialized, /AUTH_SESSION_USABLE/);
});

test('operator-safe iCloud session checkpoint contract is explicit about non-claims', () => {
  const envelope = buildOperatorSafeIcloudSessionCheckpointContract({ metadata });
  assert.ok(envelope.known_limitations.some((item) => item.includes('does not run the real provider')));
  assert.ok(envelope.evidence.non_claims.includes('does not download media'));
  assert.ok(envelope.evidence.non_claims.includes('does not perform 2FA'));
});
