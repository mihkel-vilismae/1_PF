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

export interface RuntimeDownloadAuthBridgeResult {
  accepted: boolean;
  auth: PublicAuthState;
  testDownload: SingleFileAuthTestSummary;
  bridgeApplied: boolean;
  bridgeReason: string | null;
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
  if (singleFileResult.auth.status === 'authenticated') {
    return {
      accepted: true,
      auth: singleFileResult.auth,
      testDownload: singleFileResult.testDownload,
      bridgeApplied: false,
      bridgeReason: null,
    };
  }

  if (!hasVerifiedNewAuthProviderProof(newAuth) || !isAmbiguousStartedIcloudpdDownload(singleFileResult)) {
    return {
      accepted: false,
      auth: singleFileResult.auth,
      testDownload: singleFileResult.testDownload,
      bridgeApplied: false,
      bridgeReason: null,
    };
  }

  return {
    accepted: true,
    auth: {
      ...singleFileResult.auth,
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
      ...singleFileResult.testDownload,
      status: 'started_verified_by_new_auth',
      code: 'icloudpd_started_verified_by_new_auth',
      message: 'iCloudPD download command started and active NEW AUTH provider proof verified the saved session.',
      next_action: 'continue_runtime_download_pipeline',
    },
    bridgeApplied: true,
    bridgeReason: 'new_auth_provider_proof_verified_ambiguous_download_output',
  };
}
