import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRaspberryScreenWorkerNonBlockingProof } from '../tools/raspberry-screen-worker-non-blocking-proof-lib.mjs';

test('raspberry screen worker non-blocking proof preserves mock-only safety boundaries', () => {
  const envelope = buildRaspberryScreenWorkerNonBlockingProof({ metadata: { version: 'test', gitCommit: 'test' } });
  assert.equal(envelope.proof_kind, 'raspberry_screen_worker_non_blocking');
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.passed, true);
  assert.equal(envelope.evidence.evaluation.passed, true);
  assert.match(envelope.known_limitations.join('\n'), /physical monitor power control is not claimed/);
});
