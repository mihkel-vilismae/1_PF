/**
 * Tests shared proof artifact utilities.
 * Focuses on status honesty and secret redaction guarantees.
 * Keeps provider and hardware proof tooling safe by default.
 * Does not execute real iCloudPD, geocode, or Raspberry workflows.
 * Runs through the standard Node test runner.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createProofEnvelope, sanitizeEvidence, sanitizeText } from '../tools/proof-utils.mjs';

/** Verifies common auth/provider secrets are removed from strings. */
test('proof sanitizer redacts credentials, tokens, codes, and private paths', () => {
  const input = 'user test@example.com password=supersecret api_key=abc123 code 123456 path C:\\Users\\mihke\\Secrets\\cookie.txt';
  const result = sanitizeText(input);
  assert.equal(result.text.includes('test@example.com'), false);
  assert.equal(result.text.includes('supersecret'), false);
  assert.equal(result.text.includes('abc123'), false);
  assert.equal(result.text.includes('123456'), false);
  assert.equal(result.text.includes('mihke'), false);
  assert.equal(result.redactionReport.secrets_removed, true);
});

/** Verifies nested proof objects keep shape while redacting string leaves. */
test('sanitizeEvidence preserves object shape while redacting sensitive leaves', () => {
  const sanitized = sanitizeEvidence({ auth: { appleId: 'person@example.com', password: 'password=hidden' }, rows: ['token=abc', 42] });
  assert.deepEqual(Object.keys(sanitized), ['auth', 'rows']);
  assert.equal(sanitized.auth.appleId, '[REDACTED]');
  assert.equal(sanitized.auth.password, 'password=[REDACTED]');
  assert.equal(sanitized.rows[0], 'token=[REDACTED]');
  assert.equal(sanitized.rows[1], 42);
});

/** Verifies proof envelopes reject unsupported status values. */
test('createProofEnvelope accepts only explicit proof status vocabulary', () => {
  assert.throws(() => createProofEnvelope({ proofKind: 'bad', baselineVersion: '0.0.0', gitCommit: 'test', proofStatus: 'SUCCESS', runtimeMode: 'test' }), /Invalid proof status/);
});

/** Verifies a valid proof envelope redacts evidence and carries limitations. */
test('createProofEnvelope writes an honest sanitized proof envelope', () => {
  const envelope = createProofEnvelope({ proofKind: 'example', baselineVersion: '0.7.33', gitCommit: 'abc123', proofStatus: 'BLOCKED', runtimeMode: 'real', evidence: { providerOutput: 'token=abc123' }, knownLimitations: ['provider unavailable'] });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.evidence.providerOutput, 'token=[REDACTED]');
  assert.deepEqual(envelope.known_limitations, ['provider unavailable']);
});
