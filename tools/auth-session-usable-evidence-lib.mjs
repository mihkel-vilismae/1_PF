/** Secret-safe auth session usable evidence contract helpers. */
export const AUTH_SESSION_USABLE_SCHEMA_VERSION = 1;

const SECRETISH_KEYS = /^(?:apple_id|appleId|password|pass|pwd|two_factor_code|twoFactorCode|code|cookie|cookies|token|secret|session_path|raw_provider_output)$/i;

export function buildSampleAuthSessionUsableEvidence(overrides = {}) {
  return {
    schema_version: AUTH_SESSION_USABLE_SCHEMA_VERSION,
    proof_kind: 'auth_session_usable_evidence',
    session_state: 'usable',
    operator_completed_2fa: true,
    checkpoint_marker_seen: true,
    checked_at: '2026-01-01T00:00:00.000Z',
    evidence_source: 'operator_machine_redacted_status',
    redacted: true,
    secret_fields_present: false,
    safe_session_id_hash: 'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    notes: ['No credentials, 2FA code, cookies, or raw provider output included.'],
    ...overrides,
  };
}

export function validateAuthSessionUsableEvidence(evidence) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object') errors.push('evidence must be an object');
  if (evidence?.schema_version !== AUTH_SESSION_USABLE_SCHEMA_VERSION) errors.push('schema_version must be 1');
  if (evidence?.proof_kind !== 'auth_session_usable_evidence') errors.push('proof_kind must be auth_session_usable_evidence');
  if (evidence?.session_state !== 'usable') errors.push('session_state must be usable');
  if (evidence?.operator_completed_2fa !== true) errors.push('operator_completed_2fa must be true');
  if (evidence?.checkpoint_marker_seen !== true) errors.push('checkpoint_marker_seen must be true');
  if (evidence?.redacted !== true) errors.push('redacted must be true');
  if (evidence?.secret_fields_present !== false) errors.push('secret_fields_present must be false');
  if (typeof evidence?.safe_session_id_hash !== 'string' || !/^sha256:[a-f0-9]{64}$/i.test(evidence.safe_session_id_hash)) errors.push('safe_session_id_hash must be a sha256: hex digest');
  const serialized = JSON.stringify(evidence ?? {});
  for (const key of Object.keys(evidence ?? {})) {
    if (SECRETISH_KEYS.test(key)) errors.push(`secret-like key is not allowed in auth usable evidence: ${key}`);
  }
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized)) errors.push('evidence must not include email addresses');
  if (/\b\d{6}\b/.test(serialized)) errors.push('evidence must not include 6-digit 2FA-like codes');
  return { status: errors.length === 0 ? 'PASSED' : 'FAILED', errors };
}
