/** Sanitized auth checkpoint proof builder. */
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';

export const AUTH_CHECKPOINT_STATES = Object.freeze([
  'AUTH_REQUIRED',
  'AUTH_READY_FOR_OPERATOR',
  'AUTH_IN_PROGRESS',
  'AUTH_SESSION_DETECTED',
  'AUTH_SESSION_USABLE',
  'AUTH_BLOCKED',
]);

export function normalizeAuthCheckpointInput(input = {}) {
  const state = AUTH_CHECKPOINT_STATES.includes(input.state) ? input.state : 'AUTH_REQUIRED';
  const providerCheckStatus = ['passed', 'blocked', 'failed', 'not_run'].includes(input.providerCheckStatus) ? input.providerCheckStatus : 'not_run';
  return {
    state,
    providerCheckStatus,
    sessionDetected: Boolean(input.sessionDetected),
    sessionUsable: state === 'AUTH_SESSION_USABLE' && providerCheckStatus === 'passed',
    redactedAccountLabel: input.redactedAccountLabel ? '[REDACTED_ACCOUNT]' : null,
  };
}

export function evaluateAuthCheckpoint(input) {
  const normalized = normalizeAuthCheckpointInput(input);
  const blockReasons = [];
  const failedReasons = [];
  if (normalized.providerCheckStatus === 'failed') failedReasons.push('provider verification failed');
  if (normalized.state !== 'AUTH_SESSION_USABLE') blockReasons.push(`auth checkpoint state is ${normalized.state}`);
  if (normalized.providerCheckStatus !== 'passed') blockReasons.push(`provider check status is ${normalized.providerCheckStatus}`);
  if (!normalized.sessionDetected) blockReasons.push('session was not detected by app-owned state');
  if (failedReasons.length) return { proofStatus: 'FAILED', blockReasons, failedReasons, normalized };
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, failedReasons, normalized };
  return { proofStatus: 'PASSED', blockReasons: [], failedReasons: [], normalized };
}

export function buildAuthCheckpointStateProof({ metadata, input = {}, env = process.env } = {}) {
  const evaluation = evaluateAuthCheckpoint({
    state: input.state ?? env.AUTH_CHECKPOINT_STATE,
    providerCheckStatus: input.providerCheckStatus ?? env.AUTH_CHECKPOINT_PROVIDER_CHECK,
    sessionDetected: input.sessionDetected ?? env.AUTH_CHECKPOINT_SESSION_DETECTED === '1',
    redactedAccountLabel: input.redactedAccountLabel ?? env.AUTH_CHECKPOINT_ACCOUNT_LABEL,
  });
  return createProofEnvelope({
    proofKind: 'auth_checkpoint_state',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: 'sanitized_auth_checkpoint_state',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      checkpoint: evaluation.normalized,
      evaluation,
      allowed_states: AUTH_CHECKPOINT_STATES,
      required_downstream_state: 'AUTH_SESSION_USABLE',
      forbidden_evidence: ['passwords', 'two-factor codes', 'cookies', 'provider tokens', 'authorization headers', 'Apple ID raw values', '.env values'],
      non_claims: ['does not perform login', 'does not prove iCloud media download', 'does not expose provider tokens', 'does not replace downstream real-provider proof'],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED'
      ? ['This proves only sanitized checkpoint state, not media download or Raspberry v1 readiness.']
      : ['Provide sanitized app-owned AUTH_SESSION_USABLE evidence before downstream real-provider proof.'],
  });
}
