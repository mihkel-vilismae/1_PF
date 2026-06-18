import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAuthCheckpointStateProof, evaluateAuthCheckpoint } from '../tools/auth-checkpoint-state-lib.mjs';

test('auth checkpoint defaults to blocked without app-owned session proof', () => {
  const evaluation = evaluateAuthCheckpoint({});
  assert.equal(evaluation.proofStatus, 'BLOCKED');
  assert.match(evaluation.blockReasons.join('\n'), /AUTH_REQUIRED/);
});

test('auth checkpoint passes only with sanitized usable app-owned state', () => {
  const envelope = buildAuthCheckpointStateProof({
    metadata: { version: 'test', gitCommit: 'test' },
    input: {
      state: 'AUTH_SESSION_USABLE',
      providerCheckStatus: 'passed',
      sessionDetected: true,
      redactedAccountLabel: 'person@example.com token=abc123',
    },
  });
  const serialized = JSON.stringify(envelope);
  assert.equal(envelope.proof_status, 'PASSED');
  assert.match(serialized, /\[REDACTED_ACCOUNT\]/);
  assert.doesNotMatch(serialized, /person@example.com/);
  assert.doesNotMatch(serialized, /abc123/);
  assert.match(serialized, /does not prove iCloud media download/);
});
