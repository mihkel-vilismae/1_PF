/** Secret-safe iCloudPD/auth readiness preflight helpers. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { validateAuthSessionUsableEvidence } from './auth-session-usable-evidence-lib.mjs';
import { buildRealIcloudpdReadinessHints, isRealIcloudpdProofEnabled } from './real-icloudpd-pipeline-proof-lib.mjs';

const REQUIRED_CONFIG_KEYS = Object.freeze(['user', 'pw', 'ICLOUDPD_COOKIE_DIR']);
const REQUIRED_AUTH_EVIDENCE_KEY = 'PF_AUTH_SESSION_USABLE_EVIDENCE_FILE';
const OPERATOR_SAFE_ENV_KEYS = Object.freeze(['PF_PROOF_ENABLE_REAL_ICLOUDPD', ...REQUIRED_CONFIG_KEYS, REQUIRED_AUTH_EVIDENCE_KEY]);

function configuredKeySet(readiness) {
  return new Set(readiness.required_env.filter((entry) => entry.configured === true || entry.present === true).map((entry) => entry.key));
}

function readAuthEvidenceFile(env = process.env, { cwd = process.cwd() } = {}) {
  const configured = Boolean(env[REQUIRED_AUTH_EVIDENCE_KEY]);
  if (!configured) return { configured, parsed: false, valid: false, safe: false, reason: 'auth session evidence file is not configured', validation_errors: [] };
  const resolved = resolve(cwd, env[REQUIRED_AUTH_EVIDENCE_KEY]);
  if (!existsSync(resolved)) return { configured, parsed: false, valid: false, safe: false, reason: 'auth session evidence file does not exist', validation_errors: [] };
  try {
    const value = JSON.parse(readFileSync(resolved, 'utf8'));
    const validation = validateAuthSessionUsableEvidence(value);
    return {
      configured,
      parsed: true,
      valid: validation.status === 'PASSED',
      safe: validation.status === 'PASSED',
      reason: validation.status === 'PASSED' ? 'auth session usable evidence validates' : 'auth session usable evidence failed validation',
      validation_errors: validation.errors,
    };
  } catch (error) {
    return { configured, parsed: false, valid: false, safe: false, reason: `auth session evidence file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`, validation_errors: [] };
  }
}

function readinessLevelFrom({ missingKeys, authEvidence }) {
  if (missingKeys.length > 0) return 'missing_config';
  if (!authEvidence.configured) return 'auth_evidence_missing';
  if (!authEvidence.parsed) return 'auth_evidence_unreadable';
  if (!authEvidence.valid) return 'auth_evidence_invalid';
  return 'ready_inputs_present';
}

export function buildOperatorSafeIcloudReadinessSequence() {
  return [
    {
      step: 'auth_checkpoint_state',
      command: 'npm run proof:auth-checkpoint-state',
      purpose: 'Confirm the app-owned checkpoint can report AUTH_SESSION_USABLE without exposing credentials, cookies, tokens, or raw session files.',
    },
    {
      step: 'auth_session_usable_evidence',
      command: 'npm run proof:auth-session-usable-evidence-producer',
      purpose: 'Validate the redacted usable-session evidence file referenced by PF_AUTH_SESSION_USABLE_EVIDENCE_FILE.',
    },
    {
      step: 'real_icloudpd_readiness',
      command: 'npm run proof:real-icloudpd-readiness',
      purpose: 'Confirm explicit opt-in, required iCloudPD config key presence, cookie directory key presence, and usable-session evidence presence.',
    },
    {
      step: 'real_icloudpd_pipeline',
      command: 'npm run proof:real-icloudpd',
      purpose: 'Only after the previous readiness steps pass, run the real provider proof against the local backend.',
    },
  ];
}

export function buildRealIcloudpdConfigReadiness({ env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10, cwd = process.cwd() } = {}) {
  const readiness = buildRealIcloudpdReadinessHints({ env, baseUrl, recentCount });
  const configuredKeys = configuredKeySet(readiness);
  const authEvidence = readAuthEvidenceFile(env, { cwd });
  const missingRequiredConfigKeys = [
    ...OPERATOR_SAFE_ENV_KEYS.filter((key) => key !== REQUIRED_AUTH_EVIDENCE_KEY && !configuredKeys.has(key)),
    ...(!authEvidence.configured ? [REQUIRED_AUTH_EVIDENCE_KEY] : []),
  ];
  const configGroups = [
    { group: 'proof_opt_in', required_keys: ['PF_PROOF_ENABLE_REAL_ICLOUDPD'], configured: configuredKeys.has('PF_PROOF_ENABLE_REAL_ICLOUDPD') },
    { group: 'icloudpd_credentials', required_keys: ['user', 'pw'], configured: configuredKeys.has('user') && configuredKeys.has('pw') },
    { group: 'cookie_dir', required_keys: ['ICLOUDPD_COOKIE_DIR'], configured: configuredKeys.has('ICLOUDPD_COOKIE_DIR') },
    { group: 'auth_checkpoint', required_state: 'AUTH_SESSION_USABLE', configured: readiness.auth_checkpoint_required_state === 'AUTH_SESSION_USABLE' },
    { group: 'auth_session_usable_evidence', required_keys: [REQUIRED_AUTH_EVIDENCE_KEY], configured: authEvidence.configured, parsed: authEvidence.parsed, valid: authEvidence.valid, safe: authEvidence.safe },
  ];
  return {
    readiness,
    missing_required_config_keys: missingRequiredConfigKeys,
    required_config_groups: configGroups,
    auth_session_evidence: authEvidence,
    operator_safe_env_keys: OPERATOR_SAFE_ENV_KEYS,
    operator_sequence: buildOperatorSafeIcloudReadinessSequence(),
    readiness_level: readinessLevelFrom({ missingKeys: missingRequiredConfigKeys, authEvidence }),
    safe_diagnostics: [
      'Only key names and configured/missing booleans may be written to proof artifacts.',
      'Never write Apple ID, password, cookie contents, tokens, raw .env values, or raw session files.',
      'Use the redacted auth session usable evidence artifact to establish AUTH_SESSION_USABLE before real provider work.',
      'Do not write the raw auth evidence file path to proof artifacts; report only whether it is configured, parsed, valid, and secret-safe.',
    ],
  };
}

export function buildRealIcloudpdReadinessChecks({ env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10, cwd = process.cwd() } = {}) {
  const configReadiness = buildRealIcloudpdConfigReadiness({ env, baseUrl, recentCount, cwd });
  const { readiness, missing_required_config_keys: missingKeys, auth_session_evidence: authEvidence } = configReadiness;
  const configuredKeys = configuredKeySet(readiness);
  const checks = [
    { name: 'real_icloudpd_opt_in_set', passed: isRealIcloudpdProofEnabled(env), detail: 'PF_PROOF_ENABLE_REAL_ICLOUDPD must equal true' },
    ...REQUIRED_CONFIG_KEYS.map((key) => ({ name: `${key}_configured`, passed: configuredKeys.has(key), detail: `required config key ${key}` })),
    { name: 'auth_session_evidence_file_configured', passed: authEvidence.configured, detail: `${REQUIRED_AUTH_EVIDENCE_KEY} must point to redacted usable-session evidence` },
    { name: 'auth_session_evidence_file_parsed', passed: authEvidence.parsed, detail: authEvidence.reason },
    { name: 'auth_session_evidence_valid', passed: authEvidence.valid, detail: authEvidence.validation_errors.join('; ') || authEvidence.reason },
    { name: 'auth_session_evidence_secret_safe', passed: authEvidence.safe, detail: authEvidence.safe ? 'validated evidence contains no forbidden secret fields' : 'usable-session evidence is missing or invalid' },
    { name: 'missing_required_config_keys_reported', passed: Array.isArray(missingKeys), detail: missingKeys.join(',') || 'none' },
    { name: 'operator_sequence_documented', passed: configReadiness.operator_sequence.length >= 4, detail: configReadiness.operator_sequence.map((step) => step.command).join(' -> ') },
    { name: 'auth_checkpoint_required_state_documented', passed: readiness.auth_checkpoint_required_state === 'AUTH_SESSION_USABLE', detail: readiness.auth_checkpoint_required_state },
    { name: 'secret_boundary_documented', passed: /must not include/.test(readiness.secret_boundary), detail: readiness.secret_boundary },
    { name: 'operator_safe_env_keys_only', passed: configReadiness.operator_safe_env_keys.every((key) => OPERATOR_SAFE_ENV_KEYS.includes(key)), detail: configReadiness.operator_safe_env_keys.join(',') },
  ];
  return { readiness, configReadiness, checks };
}

export function buildRealIcloudpdReadinessProof({ metadata, env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10, cwd = process.cwd() } = {}) {
  const { readiness, configReadiness, checks } = buildRealIcloudpdReadinessChecks({ env, baseUrl, recentCount, cwd });
  const proofStatus = checks.every((check) => check.passed) && configReadiness.missing_required_config_keys.length === 0 ? 'PASSED' : 'BLOCKED';
  return createProofEnvelope({
    proofKind: 'real_icloudpd_readiness',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'real_icloudpd_auth_readiness_preflight',
    evidence: { environment: getProofEnvironment(), checks, readiness, config_readiness: configReadiness },
    knownLimitations: proofStatus === 'PASSED'
      ? ['This only proves local readiness inputs and redacted usable-session evidence are present; it does not run iCloudPD or download media.']
      : ['Provide real iCloudPD config, a redacted app-owned auth session usable evidence file, and explicit opt-in before running real iCloudPD proof.'],
  });
}
