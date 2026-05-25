/*
 * Reconciles B2 real-download auth results with NEW AUTH provider proof.
 * This keeps runtime download gating strict while avoiding legacy downgrades.
 * Only active provider-proof authentication can bridge ambiguous iCloudPD output.
 */
import type { PublicAuthState, SingleFileAuthTestResult, SingleFileAuthTestSummary } from './auth/authTypes.ts';

export interface RuntimeDownloadAuthBridgeInput {
  newAuth: Record<string, unknown> | null | undefined;
  singleFileResult: SingleFileAuthTestResult;
  now?: Date;
}

export interface RuntimeDownloadAuthDiagnostics {
  blockReason: string | null;
  action: string;
  safeMessage: string;
  newAuthState: string | null;
  newAuthProvider: string | null;
  providerProofAttempted: boolean | null;
  providerProofVerified: boolean | null;
  providerProofReasonCode: string | null;
  runtimeAuthStatus: string | null;
  runtimeDownloadStatus: string | null;
  runtimeDownloadCode: string | null;
  runtimeNextAction: string | null;
  secretsShown: false;
}

export interface RuntimeDownloadAuthBridgeResult {
  accepted: boolean;
  auth: PublicAuthState;
  testDownload: SingleFileAuthTestSummary;
  bridgeApplied: boolean;
  bridgeReason: string | null;
  diagnostics: RuntimeDownloadAuthDiagnostics;
}

// Reads active NEW AUTH provider proof data without exposing command output or credentials.
function summarizeNewAuthProof(newAuth: Record<string, unknown> | null | undefined) {
  const details = newAuth && typeof newAuth === 'object' && newAuth.details && typeof newAuth.details === 'object'
    ? newAuth.details as Record<string, unknown>
    : null;
  const providerProof = details?.providerProof && typeof details.providerProof === 'object'
    ? details.providerProof as Record<string, unknown>
    : null;

  return {
    state: typeof newAuth?.state === 'string' ? newAuth.state : null,
    provider: typeof details?.provider === 'string' ? details.provider : null,
    attempted: typeof providerProof?.attempted === 'boolean' ? providerProof.attempted : null,
    verified: typeof providerProof?.verified === 'boolean' ? providerProof.verified : null,
    reasonCode: typeof providerProof?.reasonCode === 'string' ? providerProof.reasonCode : null,
  };
}

// Classifies why B2 real download is still blocked using only safe status fields.
export function buildRuntimeDownloadAuthDiagnostics(
  newAuth: Record<string, unknown> | null | undefined,
  singleFileResult: SingleFileAuthTestResult,
  accepted: boolean,
): RuntimeDownloadAuthDiagnostics {
  const proof = summarizeNewAuthProof(newAuth);
  const auth = singleFileResult.auth;
  const testDownload = singleFileResult.testDownload;
  const runtimeNextAction = testDownload.next_action || auth.next_action || null;
  const runtimeCode = testDownload.code || auth.error?.code || null;
  let blockReason: string | null = null;
  let action = 'continue_runtime_download_pipeline';
  let safeMessage = 'B2 real download auth gate accepted this request.';

  if (!accepted) {
    if (!auth.has_required_files) {
      blockReason = 'missing_required_auth_files';
      action = 'verify_auth_files_and_env';
      safeMessage = 'B2 real download is blocked because required auth files or config are missing.';
    } else if (proof.state === 'unverified' || proof.reasonCode === 'NEW_AUTH_PROVIDER_PROOF_SKIPPED') {
      blockReason = 'provider_proof_skipped';
      action = 'run_active_provider_proof';
      safeMessage = 'B2 real download is blocked because only passive/session-file evidence was available; run active NEW AUTH provider verification.';
    } else if (proof.verified === false || proof.state === 'failed') {
      blockReason = 'provider_proof_failed';
      action = 'inspect_new_auth_provider_status';
      safeMessage = 'B2 real download is blocked because NEW AUTH provider proof did not verify the saved session.';
    } else if (auth.status === 'provider_unavailable' || runtimeCode === 'provider_unavailable') {
      blockReason = 'provider_unavailable';
      action = 'verify_icloudpd_executable';
      safeMessage = 'B2 real download is blocked because the provider executable is unavailable.';
    } else if (isAmbiguousStartedIcloudpdDownload(singleFileResult)) {
      blockReason = 'download_output_ambiguous_without_verified_new_auth';
      action = 'verify_new_auth_then_retry_real_download';
      safeMessage = 'B2 real download started iCloudPD, but output stayed ambiguous and active NEW AUTH proof was not verified.';
    } else {
      blockReason = 'runtime_download_auth_blocked';
      action = runtimeNextAction || 'inspect_runtime_download_auth_output';
      safeMessage = 'B2 real download is blocked by the runtime auth gate.';
    }
  }

  return {
    blockReason,
    action,
    safeMessage,
    newAuthState: proof.state,
    newAuthProvider: proof.provider,
    providerProofAttempted: proof.attempted,
    providerProofVerified: proof.verified,
    providerProofReasonCode: proof.reasonCode,
    runtimeAuthStatus: auth.status || null,
    runtimeDownloadStatus: testDownload.status || null,
    runtimeDownloadCode: runtimeCode,
    runtimeNextAction,
    secretsShown: false,
  };
}

// Returns true when the runtime download evidence clearly came from iCloudPD.
export function isIcloudpdRuntimeDownloadEvidence(singleFileResult: SingleFileAuthTestResult): boolean {
  const provider = singleFileResult.auth?.provider;
  const code = singleFileResult.testDownload?.code || singleFileResult.auth?.error?.code;
  const nextAction = singleFileResult.testDownload?.next_action || singleFileResult.auth?.next_action;
  const message = `${singleFileResult.testDownload?.message || ''} ${singleFileResult.auth?.error?.message || ''}`.toLowerCase();

  return provider === 'icloudpd'
    || String(code || '').startsWith('icloudpd_')
    || String(nextAction || '').includes('icloudpd')
    || message.includes('icloudpd');
}

// Normalizes legacy provider labels only inside the B2 runtime-download boundary.
export function normalizeRuntimeDownloadProviderDiagnostics(singleFileResult: SingleFileAuthTestResult): SingleFileAuthTestResult {
  if (!isIcloudpdRuntimeDownloadEvidence(singleFileResult) || singleFileResult.auth?.provider === 'icloudpd') {
    return singleFileResult;
  }

  return {
    ...singleFileResult,
    auth: {
      ...singleFileResult.auth,
      provider: 'icloudpd',
      providerAlias: singleFileResult.auth.provider,
      providerBoundary: 'icloudpd',
    },
  };
}

// Returns true only when NEW AUTH actively verified provider proof for icloudpd.
export function hasVerifiedNewAuthProviderProof(newAuth: Record<string, unknown> | null | undefined): boolean {
  if (!newAuth || typeof newAuth !== 'object') {
    return false;
  }

  const details = newAuth.details;
  if (!details || typeof details !== 'object') {
    return false;
  }

  const providerProof = (details as Record<string, unknown>).providerProof;
  return newAuth.state === 'authenticated'
    && (newAuth.ok === true || typeof newAuth.ok === 'undefined')
    && (details as Record<string, unknown>).provider === 'icloudpd'
    && Boolean(providerProof && typeof providerProof === 'object' && (providerProof as Record<string, unknown>).verified === true);
}

// Returns true when the single-file command ran but legacy output mapping stayed inconclusive.
export function isAmbiguousStartedIcloudpdDownload(singleFileResult: SingleFileAuthTestResult): boolean {
  const status = singleFileResult.testDownload?.status;
  const code = singleFileResult.testDownload?.code;
  const nextAction = singleFileResult.auth?.next_action;

  return singleFileResult.auth?.status === 'blocked'
    && status === 'started'
    && (code === 'icloudpd_started_unverified' || nextAction === 'inspect_icloudpd_auth_output');
}

// Applies the NEW AUTH bridge only for verified proof plus ambiguous started output.
export function reconcileRuntimeDownloadAuth({
  newAuth,
  singleFileResult,
  now = new Date(),
}: RuntimeDownloadAuthBridgeInput): RuntimeDownloadAuthBridgeResult {
  const normalizedSingleFileResult = normalizeRuntimeDownloadProviderDiagnostics(singleFileResult);

  if (normalizedSingleFileResult.auth.status === 'authenticated') {
    return {
      accepted: true,
      auth: normalizedSingleFileResult.auth,
      testDownload: normalizedSingleFileResult.testDownload,
      bridgeApplied: false,
      bridgeReason: null,
      diagnostics: buildRuntimeDownloadAuthDiagnostics(newAuth, normalizedSingleFileResult, true),
    };
  }

  if (!hasVerifiedNewAuthProviderProof(newAuth) || !isAmbiguousStartedIcloudpdDownload(normalizedSingleFileResult)) {
    return {
      accepted: false,
      auth: normalizedSingleFileResult.auth,
      testDownload: normalizedSingleFileResult.testDownload,
      bridgeApplied: false,
      bridgeReason: null,
      diagnostics: buildRuntimeDownloadAuthDiagnostics(newAuth, normalizedSingleFileResult, false),
    };
  }

  return {
    accepted: true,
    auth: {
      ...normalizedSingleFileResult.auth,
      status: 'authenticated',
      has_required_files: true,
      requires_2fa: false,
      two_factor_status: 'complete',
      two_factor_method: null,
      next_action: 'auth_ready',
      error: null,
      provider: 'icloudpd',
      updatedAt: now.toISOString(),
      bridge: 'new_auth_provider_proof',
    },
    testDownload: {
      ...normalizedSingleFileResult.testDownload,
      status: 'started_verified_by_new_auth',
      code: 'icloudpd_started_verified_by_new_auth',
      message: 'iCloudPD download command started and active NEW AUTH provider proof verified the saved session.',
      next_action: 'continue_runtime_download_pipeline',
    },
    bridgeApplied: true,
    bridgeReason: 'new_auth_provider_proof_verified_ambiguous_download_output',
    diagnostics: buildRuntimeDownloadAuthDiagnostics(newAuth, normalizedSingleFileResult, true),
  };
}
