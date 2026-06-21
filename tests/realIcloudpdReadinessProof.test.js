import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSampleAuthSessionUsableEvidence } from '../tools/auth-session-usable-evidence-lib.mjs';
import { buildRealIcloudpdReadinessProof } from '../tools/real-icloudpd-readiness-proof-lib.mjs';

const metadata = { version: 'test', gitCommit: 'test' };

async function writeAuthEvidence(overrides = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'pf-auth-evidence-'));
  const file = join(dir, 'auth_session_usable_evidence.json');
  await writeFile(file, JSON.stringify(buildSampleAuthSessionUsableEvidence(overrides), null, 2));
  return { dir, file };
}

test('real iCloudPD readiness blocks without opt-in, config, and redacted auth evidence', () => {
  const envelope = buildRealIcloudpdReadinessProof({ metadata, env: {} });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.evidence.checks.find((check) => check.name === 'real_icloudpd_opt_in_set').passed, false);
  assert.equal(envelope.evidence.checks.find((check) => check.name === 'auth_session_evidence_file_configured').passed, false);
  assert.equal(envelope.evidence.readiness.auth_checkpoint_required_state, 'AUTH_SESSION_USABLE');
  assert.deepEqual(envelope.evidence.config_readiness.missing_required_config_keys, ['PF_PROOF_ENABLE_REAL_ICLOUDPD', 'user', 'pw', 'ICLOUDPD_COOKIE_DIR', 'PF_AUTH_SESSION_USABLE_EVIDENCE_FILE']);
});

test('real iCloudPD readiness blocks when auth evidence is missing even if provider inputs are configured', () => {
  const envelope = buildRealIcloudpdReadinessProof({ metadata, env: { PF_PROOF_ENABLE_REAL_ICLOUDPD: 'true', user: 'apple@example.test', pw: 'super-password-123', ICLOUDPD_COOKIE_DIR: '/tmp/cookies' } });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.evidence.config_readiness.readiness_level, 'missing_config');
  assert.equal(envelope.evidence.checks.find((check) => check.name === 'auth_session_evidence_file_configured').passed, false);
  const serialized = JSON.stringify(envelope);
  assert.equal(serialized.includes('apple@example.test'), false);
  assert.equal(serialized.includes('super-password-123'), false);
  assert.equal(serialized.includes('/tmp/cookies'), false);
});

test('real iCloudPD readiness passes configured inputs and valid redacted auth evidence without downloading media', async () => {
  const { file } = await writeAuthEvidence();
  const envelope = buildRealIcloudpdReadinessProof({ metadata, env: { PF_PROOF_ENABLE_REAL_ICLOUDPD: 'true', user: 'apple@example.test', pw: 'super-password-123', ICLOUDPD_COOKIE_DIR: '/tmp/cookies', PF_AUTH_SESSION_USABLE_EVIDENCE_FILE: file } });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.checks.every((check) => check.passed), true);
  assert.equal(envelope.evidence.config_readiness.auth_session_evidence.valid, true);
  const serialized = JSON.stringify(envelope);
  assert.equal(serialized.includes('apple@example.test'), false);
  assert.equal(serialized.includes('super-password-123'), false);
  assert.equal(serialized.includes('/tmp/cookies'), false);
  assert.equal(serialized.includes(file), false);
  assert.match(envelope.known_limitations[0], /does not run iCloudPD/);
});

test('real iCloudPD readiness rejects invalid or secret-bearing auth evidence safely', async () => {
  const { file } = await writeAuthEvidence({ apple_id: 'person@example.com', two_factor_code: '123456' });
  const envelope = buildRealIcloudpdReadinessProof({ metadata, env: { PF_PROOF_ENABLE_REAL_ICLOUDPD: 'true', user: 'apple@example.test', pw: 'super-password-123', ICLOUDPD_COOKIE_DIR: '/tmp/cookies', PF_AUTH_SESSION_USABLE_EVIDENCE_FILE: file } });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.evidence.config_readiness.auth_session_evidence.valid, false);
  assert.equal(envelope.evidence.checks.find((check) => check.name === 'auth_session_evidence_valid').passed, false);
  const serialized = JSON.stringify(envelope);
  assert.equal(serialized.includes('person@example.com'), false);
  assert.equal(serialized.includes('123456'), false);
  assert.equal(serialized.includes(file), false);
});


test('real iCloudPD readiness reports operator-safe sequence without raw secret values', async () => {
  const { file } = await writeAuthEvidence();
  const envelope = buildRealIcloudpdReadinessProof({ metadata, env: { PF_PROOF_ENABLE_REAL_ICLOUDPD: 'true', user: 'apple@example.test', pw: 'super-password-123', ICLOUDPD_COOKIE_DIR: '/tmp/cookies', PF_AUTH_SESSION_USABLE_EVIDENCE_FILE: file } });
  const sequence = envelope.evidence.config_readiness.operator_sequence.map((step) => step.command);
  assert.deepEqual(sequence, [
    'npm run proof:auth-checkpoint-state',
    'npm run proof:auth-session-usable-evidence-producer',
    'npm run proof:real-icloudpd-readiness',
    'npm run proof:real-icloudpd',
  ]);
  const serialized = JSON.stringify(envelope);
  assert.equal(serialized.includes('apple@example.test'), false);
  assert.equal(serialized.includes('super-password-123'), false);
  assert.equal(serialized.includes(file), false);
});
