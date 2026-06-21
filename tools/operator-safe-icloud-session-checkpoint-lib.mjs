/** Operator-safe iCloud readiness/session checkpoint contract for B1.1/B1.2. */
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { buildAuthCheckpointStateProof } from './auth-checkpoint-state-lib.mjs';
import { buildSampleAuthSessionUsableEvidence, validateAuthSessionUsableEvidence } from './auth-session-usable-evidence-lib.mjs';
import { buildOperatorSafeIcloudReadinessSequence, buildRealIcloudpdReadinessProof } from './real-icloudpd-readiness-proof-lib.mjs';

const TEST_SECRET_VALUES = Object.freeze([
  'operator@example.com',
  'super-password-123',
  '123456',
  '/tmp/private-cookie-dir',
  '/tmp/private-auth-session-evidence.json',
]);

function check(name, passed, detail) { return { name, passed: Boolean(passed), detail }; }

export function buildOperatorSafeIcloudSessionCheckpointContract({ metadata, authEvidenceFile = '/tmp/private-auth-session-evidence.json' } = {}) {
  const usableCheckpoint = buildAuthCheckpointStateProof({
    metadata,
    input: {
      state: 'AUTH_SESSION_USABLE',
      providerCheckStatus: 'passed',
      sessionDetected: true,
      redactedAccountLabel: 'operator@example.com token=abc123',
    },
  });
  const blockedCheckpoint = buildAuthCheckpointStateProof({ metadata, input: {} });
  const validEvidence = buildSampleAuthSessionUsableEvidence();
  const invalidEvidence = buildSampleAuthSessionUsableEvidence({ apple_id: 'operator@example.com', two_factor_code: '123456' });
  const validEvidenceValidation = validateAuthSessionUsableEvidence(validEvidence);
  const invalidEvidenceValidation = validateAuthSessionUsableEvidence(invalidEvidence);
  const sequence = buildOperatorSafeIcloudReadinessSequence();
  const readinessWithoutEvidence = buildRealIcloudpdReadinessProof({
    metadata,
    env: {
      PF_PROOF_ENABLE_REAL_ICLOUDPD: 'true',
      user: 'operator@example.com',
      pw: 'super-password-123',
      ICLOUDPD_COOKIE_DIR: '/tmp/private-cookie-dir',
    },
  });
  const expectedSequence = [
    'npm run proof:auth-checkpoint-state',
    'npm run proof:auth-session-usable-evidence-producer',
    'npm run proof:real-icloudpd-readiness',
    'npm run proof:real-icloudpd',
  ];
  const readinessWithConfiguredEvidence = buildRealIcloudpdReadinessProof({
    metadata,
    env: {
      PF_PROOF_ENABLE_REAL_ICLOUDPD: 'true',
      user: 'operator@example.com',
      pw: 'super-password-123',
      ICLOUDPD_COOKIE_DIR: '/tmp/private-cookie-dir',
      PF_AUTH_SESSION_USABLE_EVIDENCE_FILE: authEvidenceFile,
    },
  });

  const checks = [
    check('usable_checkpoint_can_pass_without_secret_values', usableCheckpoint.proof_status === 'PASSED', usableCheckpoint.evidence.checkpoint.state),
    check('default_checkpoint_blocks_before_operator_session', blockedCheckpoint.proof_status === 'BLOCKED', blockedCheckpoint.evidence.evaluation.blockReasons.join('; ')),
    check('usable_evidence_contract_passes_redacted_marker', validEvidenceValidation.status === 'PASSED', validEvidenceValidation.errors.join('; ') || 'redacted marker accepted'),
    check('usable_evidence_contract_rejects_secret_fields', invalidEvidenceValidation.status === 'FAILED', invalidEvidenceValidation.errors.join('; ')),
    check('readiness_blocks_when_auth_evidence_file_missing', readinessWithoutEvidence.proof_status === 'BLOCKED', readinessWithoutEvidence.evidence.config_readiness.readiness_level),
    check('readiness_requires_auth_evidence_file_key', readinessWithoutEvidence.evidence.config_readiness.missing_required_config_keys.includes('PF_AUTH_SESSION_USABLE_EVIDENCE_FILE'), readinessWithoutEvidence.evidence.config_readiness.missing_required_config_keys.join(',')),
    check('operator_sequence_is_ordered', JSON.stringify(sequence.map((step) => step.command)) === JSON.stringify(expectedSequence), sequence.map((step) => step.command).join(' -> ')),
    check('readiness_artifact_does_not_emit_raw_auth_evidence_path', !JSON.stringify(readinessWithConfiguredEvidence).includes(authEvidenceFile), 'raw PF_AUTH_SESSION_USABLE_EVIDENCE_FILE path is not emitted'),
  ];

  const evidence = {
    environment: getProofEnvironment(),
    operator_sequence: sequence,
    safe_input_keys: ['PF_PROOF_ENABLE_REAL_ICLOUDPD', 'user', 'pw', 'ICLOUDPD_COOKIE_DIR', 'PF_AUTH_SESSION_USABLE_EVIDENCE_FILE'],
    required_auth_state: 'AUTH_SESSION_USABLE',
    required_auth_evidence_schema: 'auth_session_usable_evidence@1',
    checks,
    secret_boundary: 'Proof artifacts may report key names, booleans, status, and validation errors; they must not include Apple IDs, passwords, cookies, tokens, 2FA codes, raw session paths, raw auth evidence paths, or raw provider output.',
    non_claims: [
      'does not perform iCloud login',
      'does not perform 2FA',
      'does not inspect raw cookies or session files',
      'does not download media',
      'does not prove real iCloudPD pipeline success',
    ],
  };

  const serialized = JSON.stringify(evidence);
  const forbiddenLeaks = TEST_SECRET_VALUES.filter((value) => serialized.includes(value));
  checks.push(check('contract_evidence_does_not_contain_test_secret_values', forbiddenLeaks.length === 0, forbiddenLeaks.join(',') || 'no synthetic secret/path leaks'));

  return createProofEnvelope({
    proofKind: 'operator_safe_icloud_session_checkpoint',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: checks.every((entry) => entry.passed) ? 'PASSED' : 'FAILED',
    runtimeMode: 'operator_safe_real_icloud_readiness_session_checkpoint_contract',
    evidence,
    knownLimitations: ['This is a secret-safety and ordering contract. It does not run the real provider or complete operator 2FA.'],
  });
}
