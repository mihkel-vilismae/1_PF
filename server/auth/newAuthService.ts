/*
 * Implements the NEW AUTH backend service for iCloudPD-backed authentication.
 * Owns provider checks, login process lifecycle, 2FA submission, logout cleanup,
 * session evidence reporting, and safe public result shaping for the dashboard.
 */
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { EMPTY_SESSION_EVIDENCE, ICLOUDPD_LOGIN_TIMEOUT_MS, ICLOUDPD_TIMEOUT_MS, INTERACTIVE_RESULT_POLL_MS, MAX_STDIO_CHARS, UNKNOWN_2FA_PROMPT_GRACE_MS } from './newAuth/newAuthConstants.js';
import { resolveIcloudpdExecutableForContext, runCommand, extractVersion, summarizeCommandFailure } from './newAuth/newAuthCommandRunner.js';
import { collectNewAuthSessionEvidence, flattenPathMetadata, getNewAuthPathCandidates, hasFreshNewAuthSessionEvidence, isSafeSessionCleanupPath } from './newAuth/newAuthPathMetadata.js';
import { normalizeNewAuthPath, positiveNumber, redactEmail, sanitizeCommandOutput, sanitizePathForDisplay, sanitizePreview, sanitizeProviderProofArgForDisplay, stringValue, summarizeEnvPresence } from './newAuth/newAuthSanitization.js';
import { appendStructuredEvents, buildStructuredEvent, classifyResponseType, promptKindForResponseType, providerOutputShownForPayload, readPromptKindFromPayload } from './newAuth/newAuthStructuredEvents.js';
import type {
  CommandResult,
  NewAuthContext,
  NewAuthIcloudpdConfig,
  NewAuthInteractiveAttempt,
  NewAuthPathMetadata,
  NewAuthPathType,
  NewAuthProviderOutputShown,
  NewAuthProviderSessionProof,
  NewAuthSessionEvidence,
  NewAuthSessionState,
  NewAuthStatusOptions,
  NewAuthStructuredEvent,
  NewAuthTwoFactorInput,
  NewAuthTwoFactorPromptInfo,
  NewAuthTwoFactorPromptKind,
  NewAuthCommandSpawner,
  NewAuthEnvValues,
} from './newAuth/newAuthTypes.js';
export type { NewAuthCommandSpawner, NewAuthContext, NewAuthEnvValues, NewAuthPathMetadata, NewAuthPathType, NewAuthSessionState, NewAuthStatusOptions, NewAuthTwoFactorInput } from './newAuth/newAuthTypes.js';

let activeNewAuthAttempt: NewAuthInteractiveAttempt | null = null;


export async function verifyNewAuthIcloudpd(context: NewAuthContext = {}): Promise<Record<string, unknown>> {
  const executable = await resolveIcloudpdExecutableForContext(context);

  if (!executable.found) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'ICLOUDPD_NOT_FOUND',
      message: 'iCloudPD executable was not found on PATH.',
      details: {
        provider: 'icloudpd',
        checkedCommand: 'icloudpd',
        lookupCommand: executable.lookupCommand,
      },
    };
  }

  const version = await runCommand(executable.path ?? 'icloudpd', ['--version'], { timeoutMs: ICLOUDPD_TIMEOUT_MS, spawnImpl: context.commandSpawner });
  if (!version.ok) {
    return {
      ok: false,
      state: 'failed',
      errorCode: version.errorCode ?? 'ICLOUDPD_EXECUTION_FAILED',
      message: summarizeCommandFailure('iCloudPD was found but could not be executed safely.', version),
      details: {
        provider: 'icloudpd',
        executablePath: executable.displayPath,
        exitCode: version.exitCode,
        signal: version.signal,
        stderrPreview: sanitizePreview(version.stderr),
      },
    };
  }

  return {
    ok: true,
    state: 'success',
    message: 'iCloudPD was found and can be executed.',
    details: {
      provider: 'icloudpd',
      executablePath: executable.displayPath,
      version: extractVersion(version.stdout, version.stderr),
      stdoutPreview: sanitizePreview(version.stdout),
    },
  };
}

/*
 * Reports NEW AUTH status while respecting passive checks before any provider
 * interaction. Passive calls only return local/cached state and never inspect,
 * poll, or advance an active iCloudPD process.
 */
export async function getNewAuthStatus(context: NewAuthContext = {}, options: NewAuthStatusOptions = {}): Promise<Record<string, unknown>> {
  const passive = options.providerProof === false;
  const config = buildNewAuthIcloudpdConfig(context);
  const paths = getNewAuthPathCandidates(context);
  const sessionDirectory = paths.find((entry) => entry.label === 'Configured session directory');
  const sessionEvidence = collectNewAuthSessionEvidence(config);
  const baseDetails = {
    provider: 'icloudpd',
    sessionDirectoryKnown: Boolean(sessionDirectory),
    sessionDirectoryExists: Boolean(sessionDirectory?.exists),
    sessionFileCount: sessionEvidence.sessionFileCount,
    localSessionEvidence: {
      hasSessionFiles: sessionEvidence.hasSessionFiles,
      sessionFileCount: sessionEvidence.sessionFileCount,
      contentsShown: false,
    },
    envPresence: summarizeEnvPresence(context.envValues ?? {}),
  };

  const activeAttempt = getActiveNewAuthAttempt();
  if (passive && activeAttempt) {
    return buildPassiveActiveAttemptStatus(baseDetails);
  }

  if (!passive && activeAttempt) {
    return appendStructuredEvents(buildPendingPayloadFromActiveAttempt(activeAttempt, 'iCloudPD authentication is still waiting for provider output or a two-factor response.'), [
      buildStructuredEvent({
        operation: 'status',
        phase: 'active_attempt_detected',
        stateBefore: 'logging_in',
        stateAfter: 'pending_2fa',
        endpoint: 'GET /api/auth/new/status',
        message: 'Status check found an active iCloudPD authentication process.',
        providerOutputShown: 'classification_only',
      }),
    ]);
  }

  if (!sessionDirectory || !sessionDirectory.exists || !sessionEvidence.hasSessionFiles) {
    return {
      ok: true,
      state: 'logged_out',
      message: statusMessageForState('logged_out'),
      details: {
        ...baseDetails,
        providerProof: buildProviderProofSkipped('NO_LOCAL_SESSION_FILES', 'No local session-like files were found, so provider proof was not attempted.'),
      },
    };
  }

  if (passive) {
    return buildPassiveUnverifiedStatus(baseDetails);
  }

  const proof = await verifyExistingNewAuthSessionWithProvider(context);
  const state = stateFromProviderProof(proof);
  return {
    ok: state === 'authenticated',
    state,
    errorCode: state === 'authenticated' ? undefined : proof.reasonCode,
    message: statusMessageForState(state, proof),
    details: {
      ...baseDetails,
      providerProof: proof,
    },
  };
}

/*
 * Builds the passive response for an in-progress login without reading live
 * provider output or classifying fresh prompts from the child process.
 */
function buildPassiveActiveAttemptStatus(baseDetails: Record<string, unknown>): Record<string, unknown> {
  const proof = buildProviderProofSkipped(
    'NEW_AUTH_PASSIVE_ACTIVE_ATTEMPT',
    'A NEW AUTH login attempt is in progress, but passive status did not inspect provider output.',
  );
  return {
    ok: true,
    state: 'logging_in',
    errorCode: proof.reasonCode,
    message: 'A NEW AUTH login attempt is in progress. Passive status did not inspect provider output.',
    details: {
      ...baseDetails,
      activeAttemptKnown: true,
      providerProof: proof,
    },
  };
}

/*
 * Builds the passive response for local session files when provider proof is
 * intentionally skipped by the Check login button.
 */
function buildPassiveUnverifiedStatus(baseDetails: Record<string, unknown>): Record<string, unknown> {
  const proof = buildProviderProofSkipped(
    'NEW_AUTH_PROVIDER_PROOF_SKIPPED',
    'Local session files exist, but passive status check did not start provider proof.',
  );
  return {
    ok: false,
    state: 'unverified',
    errorCode: proof.reasonCode,
    message: statusMessageForState('unverified', proof),
    details: {
      ...baseDetails,
      providerProof: proof,
    },
  };
}

/*
 * Reports executable/session/auth paths as safe metadata only.
 * File paths may be listed for diagnostics, but file contents and secrets are
 * never read or returned.
 */
export async function getNewAuthSessionFiles(context: NewAuthContext = {}): Promise<Record<string, unknown>> {
  const executable = await resolveIcloudpdExecutableForContext(context);
  const basePaths = getNewAuthPathCandidates(context);
  const paths: NewAuthPathMetadata[] = [];

  paths.push({
    label: 'iCloudPD executable',
    path: executable.displayPath ?? 'icloudpd',
    exists: executable.found,
    type: executable.found ? 'file' : 'missing',
    contentsShown: false,
  });
  for (const candidate of basePaths) {
    paths.push(candidate);
  }

  return {
    ok: true,
    state: 'success',
    message: 'Authentication/session paths inspected successfully. File contents were not read or returned.',
    paths,
    details: {
      provider: 'icloudpd',
      contentsShown: false,
      secretValuesShown: false,
    },
  };
}

export async function startNewAuthLogin(context: NewAuthContext = {}): Promise<Record<string, unknown>> {
  const config = buildNewAuthIcloudpdConfig(context);
  const missing = validateNewAuthLoginConfig(config);
  if (missing.length > 0) {
    return buildNewAuthMissingConfigPayload(missing, 'login');
  }

  const executable = await resolveIcloudpdExecutableForContext(context);
  if (!executable.found) {
    return buildNewAuthProviderUnavailablePayload('ICLOUDPD_NOT_FOUND', 'iCloudPD executable was not found on PATH.');
  }

  await mkdir(config.cookieDir as string, { recursive: true });
  const existingAttempt = getActiveNewAuthAttempt();
  if (existingAttempt) {
    return buildPendingPayloadFromActiveAttempt(existingAttempt, 'iCloudPD authentication is already waiting for a response.');
  }

  const beforeSessionEvidence = collectNewAuthSessionEvidence(config);
  const attempt = startInteractiveNewAuthAttempt({
    executablePath: executable.path ?? 'icloudpd',
    config,
    beforeSessionEvidence,
    commandSpawner: context.commandSpawner,
  });
  const mapped = await waitForInteractiveNewAuthResult(attempt, {
    successMessage: 'iCloudPD login completed and the local session was verified.',
    startedMessage: 'iCloudPD login command completed, but authenticated session proof was not strong enough to report success.',
  });
  return appendStructuredEvents(mapped, [
    buildStructuredEvent({
      operation: 'login',
      phase: 'process_spawned',
      stateBefore: beforeSessionEvidence.hasSessionFiles ? 'authenticated' : 'logged_out',
      stateAfter: typeof mapped.state === 'string' ? mapped.state : 'unknown',
      endpoint: 'POST /api/auth/new/login',
      message: 'Started interactive iCloudPD login process.',
      providerOutputShown: 'none',
    }),
  ]);
}

export async function submitNewAuthTwoFactor(context: NewAuthContext = {}, input: NewAuthTwoFactorInput = {}): Promise<Record<string, unknown>> {
  // Validate that required config values are present.
  const config = buildNewAuthIcloudpdConfig(context);
  const missing = validateNewAuthLoginConfig(config);
  if (missing.length > 0) {
    return buildNewAuthMissingConfigPayload(missing, 'submit_2fa');
  }

  // Normalize input and validate that a value was provided.
  const raw = typeof input.code === 'string' ? input.code.trim() : '';
  if (!raw) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_2FA_CODE_MISSING',
      message: 'Two-factor authentication submission requires a non-empty code or device index.',
      details: {
        provider: 'icloudpd',
        responseReceived: false,
        secretsShown: false,
      },
    };
  }

  // Determine response type. Only allow a single letter device index or exactly six digits as verification code.
  const responseType = classifyResponseType(raw);
  if (responseType === 'verification_code' && !/^\d{6}$/.test(raw)) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_INVALID_2FA_CODE',
      message: 'The verification code must be exactly six digits.',
      details: {
        provider: 'icloudpd',
        responseReceived: false,
        secretsShown: false,
      },
    };
  }
  if (responseType === 'device_index' && !/^[a-z]$/i.test(raw)) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_INVALID_2FA_DEVICE_INDEX',
      message: 'The device index must be a single letter.',
      details: {
        provider: 'icloudpd',
        responseReceived: false,
        secretsShown: false,
      },
    };
  }
  if (responseType === 'unknown') {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_INVALID_2FA_CODE',
      message: 'Two-factor authentication input must be either a six-digit code or a device index letter.',
      details: {
        provider: 'icloudpd',
        responseReceived: false,
        secretsShown: false,
      },
    };
  }

  // Only allow submissions if an interactive login attempt is active.
  const activeAttempt = getActiveNewAuthAttempt();
  if (!activeAttempt) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_NO_ACTIVE_2FA_CHALLENGE',
      message: 'There is no active two-factor authentication challenge in progress. Start a login first.',
      details: {
        provider: 'icloudpd',
        responseReceived: false,
        secretsShown: false,
      },
    };
  }

  // Submit the response to the active attempt.
  activeAttempt.child.stdin.write(`${raw}\n`);
  const messages = {
    successMessage: 'iCloudPD 2FA follow-up command completed and the local session was verified.',
    startedMessage: 'iCloudPD 2FA follow-up command completed, but authenticated session proof was not strong enough to report success.',
  };
  const mapped = await waitForInteractiveNewAuthResult(activeAttempt, messages);

  return addTwoFactorResponseHiddenFlag(
    appendStructuredEvents(mapped, [
      buildStructuredEvent({
        operation: 'submit_2fa',
        phase: 'response_submitted',
        stateBefore: 'pending_2fa',
        stateAfter: typeof mapped.state === 'string' ? (mapped.state as string) : 'unknown',
        promptKind: promptKindForResponseType(responseType),
        responseType,
        endpoint: 'POST /api/auth/new/submit-2fa',
        message: 'Submitted two-factor response to active iCloudPD process.',
        providerOutputShown: 'none',
      }),
    ]),
  );
}

export async function logoutNewAuthSession(context: NewAuthContext = {}): Promise<Record<string, unknown>> {
  const config = buildNewAuthIcloudpdConfig(context);
  clearActiveNewAuthAttempt();
  if (!config.cookieDir) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_COOKIE_DIR_MISSING',
      message: 'Cannot remove local auth/session data because ICLOUDPD_COOKIE_DIR is not configured.',
      details: {
        provider: 'icloudpd',
        remoteLogoutClaimed: false,
      },
    };
  }

  const safeCookieDir = config.cookieDir;
  if (!isSafeSessionCleanupPath(safeCookieDir)) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_UNSAFE_SESSION_PATH',
      message: 'Refusing to remove local session data because the configured session path is too broad or unsafe.',
      details: {
        provider: 'icloudpd',
        sessionDirectory: sanitizePathForDisplay(safeCookieDir),
        remoteLogoutClaimed: false,
      },
    };
  }

  // Count files within the cookie directory before removal for reporting. This helper counts only file entries, not directories.
  function countFiles(dir: string): number {
    let count = 0;
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          count += countFiles(full);
        } else {
          count += 1;
        }
      }
    } catch {
      // Ignore traversal errors and assume no files when inaccessible.
    }
    return count;
  }

  const removedFileCount = countFiles(safeCookieDir);
  let skippedFileCount = 0;
  try {
    await rm(safeCookieDir, { recursive: true, force: true });
    await mkdir(safeCookieDir, { recursive: true });
  } catch (error) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_SESSION_REMOVE_FAILED',
      message: `Failed to remove local auth/session data: ${sanitizePreview((error as Error)?.message ?? 'unknown error')}`,
      details: {
        provider: 'icloudpd',
        sessionDirectory: sanitizePathForDisplay(safeCookieDir),
        removedFileCount,
        skippedFileCount,
        remoteLogoutClaimed: false,
      },
    };
  }

  const status = await getNewAuthStatus(context);
  if (status.state === 'authenticated') {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_SESSION_STILL_PRESENT',
      message: 'Local session cleanup ran, but session-like files still appear to exist.',
      details: {
        provider: 'icloudpd',
        sessionDirectory: sanitizePathForDisplay(safeCookieDir),
        removedFileCount,
        skippedFileCount,
        remoteLogoutClaimed: false,
      },
    };
  }

  return {
    ok: true,
    state: 'logged_out',
    message: 'Local iCloudPD session data was removed and the user is logged out locally.',
    details: {
      provider: 'icloudpd',
      sessionDirectory: sanitizePathForDisplay(safeCookieDir),
      removedFileCount,
      skippedFileCount,
      remoteLogoutClaimed: false,
      sessionContentsShown: false,
    },
  };
}

/**
 * Perform a test download or verification step to prove the authenticated iCloudPD session is usable.
 * This endpoint does not download real media yet; it verifies that a saved session is authenticated.
 * If the session is unverified or requires authentication, it returns an error requiring login/2FA.
 */
/*
 * Verifies the NEW AUTH session for runtime actions that need real iCloudPD
 * access. This keeps runtime routes gated by the same provider-proof model as
 * /api/auth/new/status instead of the older auth-state persistence layer.
 */
export async function verifyNewAuthSessionForRuntimeDownload(context: NewAuthContext = {}): Promise<Record<string, unknown>> {
  return getNewAuthStatus(context, { providerProof: true });
}

export async function testNewAuthDownload(context: NewAuthContext = {}): Promise<Record<string, unknown>> {
  const config = buildNewAuthIcloudpdConfig(context);
  const missing = validateNewAuthLoginConfig(config);
  if (missing.length > 0) {
    return buildNewAuthMissingConfigPayload(missing, 'test_download');
  }

  // Use provider proof to verify existing session authenticity.
  const proof = await verifyExistingNewAuthSessionWithProvider(context);
  if (!proof.verified) {
    // When provider proof fails or requires 2FA, surface the provider's reason code and message.
    return {
      ok: false,
      state: 'failed',
      errorCode: proof.reasonCode || 'NEW_AUTH_TEST_DOWNLOAD_AUTH_REQUIRED',
      message: proof.message || 'Authentication is required before test download.',
      details: {
        provider: 'icloudpd',
        providerProof: proof,
      },
    };
  }

  // In this slice, we do not perform a real download; simply return success when the session is verified.
  return {
    ok: true,
    state: 'success',
    message: 'Test download succeeded: authenticated session is usable.',
    details: {
      provider: 'icloudpd',
      providerProof: proof,
    },
  };
}

function startInteractiveNewAuthAttempt({
  executablePath,
  config,
  beforeSessionEvidence,
  commandSpawner,
}: {
  executablePath: string;
  config: NewAuthIcloudpdConfig;
  beforeSessionEvidence: NewAuthSessionEvidence;
  commandSpawner?: NewAuthCommandSpawner;
}): NewAuthInteractiveAttempt {
  clearActiveNewAuthAttempt();
  const child = (commandSpawner ?? spawn)(executablePath, buildNewAuthLoginArgs(config), {
    shell: false,
    windowsHide: true,
    env: process.env,
  });
  const now = Date.now();
  const attempt: NewAuthInteractiveAttempt = {
    child,
    config,
    beforeSessionEvidence,
    createdAt: now,
    expiresAt: now + config.timeoutMs,
    stdout: '',
    stderr: '',
    consumedOutputLength: 0,
    closed: false,
    exitCode: null,
    signal: null,
    pendingWaiter: false,
  };

  child.stdout?.on('data', (chunk) => {
    attempt.stdout = `${attempt.stdout}${chunk}`.slice(-MAX_STDIO_CHARS);
  });

  child.stderr?.on('data', (chunk) => {
    attempt.stderr = `${attempt.stderr}${chunk}`.slice(-MAX_STDIO_CHARS);
  });

  child.on('error', (error: NodeJS.ErrnoException) => {
    attempt.closed = true;
    attempt.exitCode = 1;
    attempt.signal = null;
    attempt.stderr = `${attempt.stderr}\n${error.message}`.slice(-MAX_STDIO_CHARS);
  });

  child.on('close', (exitCode, signal) => {
    attempt.closed = true;
    attempt.exitCode = exitCode;
    attempt.signal = signal;
  });

  activeNewAuthAttempt = attempt;
  return attempt;
}

/*
 * Waits for an interactive iCloudPD result while keeping the child process
 * alive for 2FA follow-up. Generic 2FA text gets a short grace period so a
 * concrete code/device prompt can arrive before the modal is rendered.
 */
function waitForInteractiveNewAuthResult(
  attempt: NewAuthInteractiveAttempt,
  messages: { successMessage: string; startedMessage: string },
): Promise<Record<string, unknown>> {
  if (attempt.pendingWaiter) {
    return Promise.resolve(buildPendingPayloadFromActiveAttempt(attempt, 'iCloudPD authentication is already processing a submitted response.'));
  }

  attempt.pendingWaiter = true;
  return new Promise((resolve) => {
    let unknownPromptDetectedAt: number | null = null;
    const finish = (payload: Record<string, unknown>, keepAttemptActive: boolean) => {
      clearInterval(interval);
      attempt.pendingWaiter = false;
      const durationMs = Math.max(0, Date.now() - attempt.createdAt);
      if (keepAttemptActive) {
        attempt.consumedOutputLength = combinedAttemptOutput(attempt).length;
      } else {
        clearActiveNewAuthAttempt(attempt);
      }
      const phase = keepAttemptActive ? 'process_prompt_waiting' : 'process_close_cleanup';
      resolve(appendStructuredEvents(payload, [
        buildStructuredEvent({
          operation: 'interactive_auth',
          phase,
          stateBefore: 'logging_in',
          stateAfter: typeof payload.state === 'string' ? payload.state : 'unknown',
          promptKind: readPromptKindFromPayload(payload),
          responseType: 'none',
          durationMs,
          exitCode: keepAttemptActive ? null : attempt.exitCode,
          signal: keepAttemptActive ? null : attempt.signal,
          message: keepAttemptActive ? 'Provider prompt detected; process kept active for follow-up response.' : 'Interactive auth process closed and cleanup completed.',
          providerOutputShown: providerOutputShownForPayload(payload),
        }),
      ]));
    };

    const inspect = () => {
      const now = Date.now();
      const combined = combinedAttemptOutput(attempt);
      const newOutput = combined.slice(attempt.consumedOutputLength);

      if (newOutput) {
        const promptResult = mapNewAuthCommandResult(
          {
            ok: true,
            exitCode: 0,
            signal: null,
            stdout: newOutput,
            stderr: '',
          },
          attempt.config,
          messages,
          attempt.beforeSessionEvidence,
        );
        if (promptResult.state === 'pending_2fa') {
          const promptKind = readPromptKindFromPayload(promptResult);
          if (promptKind === 'unknown') {
            unknownPromptDetectedAt ??= now;
            if (now - unknownPromptDetectedAt < UNKNOWN_2FA_PROMPT_GRACE_MS) {
              return;
            }
          }
          finish(promptResult, true);
          return;
        }
        if (promptResult.state === 'authenticated' || promptResult.errorCode === 'NEW_AUTH_INVALID_CREDENTIALS') {
          finish(promptResult, false);
          return;
        }
      }

      if (attempt.closed) {
        const result = mapNewAuthCommandResult(
          {
            ok: attempt.exitCode === 0,
            exitCode: attempt.exitCode,
            signal: attempt.signal,
            stdout: attempt.stdout,
            stderr: attempt.stderr,
          },
          attempt.config,
          messages,
          attempt.beforeSessionEvidence,
        );
        finish(result, false);
        return;
      }

      if (now >= attempt.expiresAt) {
        try { attempt.child.kill('SIGTERM'); } catch {}
        finish({
          ok: false,
          state: 'failed',
          errorCode: 'NEW_AUTH_ICLOUDPD_TIMEOUT',
          message: 'iCloudPD authentication timed out before a verifiable auth result was produced.',
          details: {
            provider: 'icloudpd',
            providerOutputPreview: sanitizePreview(combined),
          },
        }, false);
      }
    };

    const interval = setInterval(inspect, INTERACTIVE_RESULT_POLL_MS);
    inspect();
  });
}

function getActiveNewAuthAttempt(): NewAuthInteractiveAttempt | null {
  if (!activeNewAuthAttempt) {
    return null;
  }
  if (activeNewAuthAttempt.closed || Date.now() >= activeNewAuthAttempt.expiresAt) {
    clearActiveNewAuthAttempt(activeNewAuthAttempt);
    return null;
  }
  return activeNewAuthAttempt;
}

function clearActiveNewAuthAttempt(attempt: NewAuthInteractiveAttempt | null = activeNewAuthAttempt): void {
  if (!attempt) {
    return;
  }
  if (!attempt.closed) {
    try { attempt.child.kill('SIGTERM'); } catch {}
  }
  try { attempt.child.stdin?.destroy(); } catch {}
  try { attempt.child.stdout?.destroy(); } catch {}
  try { attempt.child.stderr?.destroy(); } catch {}
  if (activeNewAuthAttempt === attempt) {
    activeNewAuthAttempt = null;
  }
}

function combinedAttemptOutput(attempt: NewAuthInteractiveAttempt): string {
  return sanitizeCommandOutput(`${attempt.stdout}\n${attempt.stderr}`, attempt.config);
}

function buildPendingPayloadFromActiveAttempt(attempt: NewAuthInteractiveAttempt, fallbackMessage: string): Record<string, unknown> {
  const combined = combinedAttemptOutput(attempt);
  const lower = combined.toLowerCase();
  if (indicatesNewAuthTwoFactorRequired(lower)) {
    const promptInfo = buildNewAuthTwoFactorPromptInfo(lower);
    return {
      ok: true,
      state: 'pending_2fa',
      message: promptInfo.message,
      details: {
        provider: 'icloudpd',
        nextAction: promptInfo.nextAction,
        twoFactorPromptKind: promptInfo.kind,
        requestedInput: promptInfo.requestedInput,
        twoFactorResponseShown: false,
        ...buildTwoFactorPromptDiagnostics(combined),
        providerOutputPreview: sanitizePreview(combined),
      },
    };
  }

  return {
    ok: true,
    state: 'pending_2fa',
    message: fallbackMessage,
    details: {
      provider: 'icloudpd',
      nextAction: 'submit_two_factor_response',
      twoFactorPromptKind: 'unknown',
      requestedInput: 'Two-factor response',
      twoFactorResponseShown: false,
      providerOutputPreview: sanitizePreview(combined),
    },
  };
}

function addTwoFactorResponseHiddenFlag(mapped: Record<string, unknown>): Record<string, unknown> {
  if (mapped.state !== 'pending_2fa') {
    return mapped;
  }

  return {
    ...mapped,
    message: typeof mapped.message === 'string'
      ? mapped.message
      : 'iCloudPD still reports that two-factor authentication is required.',
    details: {
      ...(typeof mapped.details === 'object' && mapped.details ? mapped.details : {}),
      twoFactorResponseShown: false,
    },
  };
}

function buildNewAuthIcloudpdConfig(context: NewAuthContext): NewAuthIcloudpdConfig {
  const envValues = context.envValues ?? {};
  return {
    username: stringValue(envValues.user) || stringValue(envValues.APPLE_ID),
    password: stringValue(envValues.pw) || stringValue(envValues.APPLE_PASSWORD),
    cookieDir: normalizeNewAuthPath(envValues.ICLOUDPD_COOKIE_DIR),
    downloadDir: normalizeNewAuthPath(envValues.DOWNLOAD_DIR),
    domain: stringValue(envValues.ICLOUDPD_DOMAIN),
    timeoutMs: positiveNumber(envValues.ICLOUDPD_AUTH_TIMEOUT_MS, ICLOUDPD_LOGIN_TIMEOUT_MS),
  };
}

function validateNewAuthLoginConfig(config: NewAuthIcloudpdConfig): string[] {
  const missing: string[] = [];
  if (!config.username) missing.push('user');
  if (!config.password) missing.push('pw');
  if (!config.cookieDir) missing.push('ICLOUDPD_COOKIE_DIR');
  return missing;
}

function buildNewAuthLoginArgs(config: NewAuthIcloudpdConfig): string[] {
  const args = [
    '--username', config.username,
    '--password', config.password,
    '--cookie-directory', config.cookieDir,
    '--auth-only',
  ] as string[];
  if (config.domain) {
    args.push('--domain', config.domain);
  }
  return args;
}

function buildNewAuthMissingConfigPayload(missingKeys: string[], operation: string): Record<string, unknown> {
  return {
    ok: false,
    state: 'failed',
    errorCode: 'NEW_AUTH_MISSING_CONFIG',
    message: `New auth ${operation} is missing required .env configuration: ${missingKeys.join(', ')}.`,
    missingRequiredKeys: missingKeys,
    details: {
      provider: 'icloudpd',
      secretValuesShown: false,
    },
  };
}

function buildNewAuthProviderUnavailablePayload(errorCode: string, message: string): Record<string, unknown> {
  return {
    ok: false,
    state: 'failed',
    errorCode,
    message,
    details: {
      provider: 'icloudpd',
      nextAction: 'install_or_configure_icloudpd',
    },
  };
}

export function mapNewAuthCommandResult(
  result: CommandResult,
  config: NewAuthIcloudpdConfig,
  messages: { successMessage: string; startedMessage: string },
  beforeSessionEvidence: NewAuthSessionEvidence = EMPTY_SESSION_EVIDENCE,
): Record<string, unknown> {
  const combined = sanitizeCommandOutput(`${result.stdout}\n${result.stderr}`, config);
  const lower = combined.toLowerCase();

  if (indicatesNewAuthTwoFactorRequired(lower)) {
    const promptInfo = buildNewAuthTwoFactorPromptInfo(lower);
    return appendStructuredEvents({
      ok: true,
      state: 'pending_2fa',
      message: promptInfo.message,
      details: {
        provider: 'icloudpd',
        nextAction: promptInfo.nextAction,
        twoFactorPromptKind: promptInfo.kind,
        requestedInput: promptInfo.requestedInput,
        twoFactorResponseShown: false,
        ...buildTwoFactorPromptDiagnostics(combined),
        providerOutputPreview: sanitizePreview(combined),
      },
    }, [
      buildStructuredEvent({
        operation: 'map_command_result',
        phase: 'provider_prompt_detected',
        stateBefore: 'logging_in',
        stateAfter: 'pending_2fa',
        promptKind: promptInfo.kind,
        responseType: 'none',
        message: 'Provider output classified as a two-factor prompt.',
        providerOutputShown: 'classification_only',
      }),
    ]);
  }

  if (result.errorCode === 'ICLOUDPD_TIMEOUT') {
    return appendStructuredEvents({
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_ICLOUDPD_TIMEOUT',
      message: 'iCloudPD authentication timed out before a verifiable auth result was produced.',
      details: {
        provider: 'icloudpd',
        providerOutputPreview: sanitizePreview(combined),
      },
    }, [
      buildStructuredEvent({
        operation: 'map_command_result',
        phase: 'process_timeout',
        stateBefore: 'logging_in',
        stateAfter: 'failed',
        responseType: 'none',
        exitCode: result.exitCode,
        signal: result.signal,
        message: 'Provider command timed out.',
        providerOutputShown: 'sanitized_preview',
      }),
    ]);
  }

  if (indicatesNewAuthInvalidCredentials(lower)) {
    return appendStructuredEvents({
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_INVALID_CREDENTIALS',
      message: 'iCloudPD reported invalid iCloud credentials.',
      details: {
        provider: 'icloudpd',
        providerOutputPreview: sanitizePreview(combined),
      },
    }, [
      buildStructuredEvent({
        operation: 'map_command_result',
        phase: 'process_close',
        stateBefore: 'logging_in',
        stateAfter: 'failed',
        responseType: 'none',
        exitCode: result.exitCode,
        signal: result.signal,
        message: 'Provider output indicates invalid credentials.',
        providerOutputShown: 'sanitized_preview',
      }),
    ]);
  }

  if (result.ok && indicatesNewAuthAuthenticated(lower)) {
    return appendStructuredEvents({
      ok: true,
      state: 'authenticated',
      message: messages.successMessage,
      details: {
        provider: 'icloudpd',
        authenticatedUser: redactEmail(config.username),
        providerSessionRef: 'icloudpd_cookie_directory_internal',
        providerOutputPreview: sanitizePreview(combined),
      },
    }, [
      buildStructuredEvent({
        operation: 'map_command_result',
        phase: 'process_close',
        stateBefore: 'logging_in',
        stateAfter: 'authenticated',
        responseType: 'none',
        exitCode: result.exitCode,
        signal: result.signal,
        message: 'Provider output indicates authenticated state.',
        providerOutputShown: 'sanitized_preview',
      }),
    ]);
  }

  const afterSessionEvidence = result.ok ? collectNewAuthSessionEvidence(config) : EMPTY_SESSION_EVIDENCE;
  if (result.ok && hasFreshNewAuthSessionEvidence(beforeSessionEvidence, afterSessionEvidence)) {
    return appendStructuredEvents({
      ok: false,
      state: 'unverified',
      errorCode: 'NEW_AUTH_UNVERIFIED_SESSION',
      message: messages.startedMessage,
      details: {
        provider: 'icloudpd',
        nextAction: 'check_login_status_or_retry_provider_proof',
        sessionFileCount: afterSessionEvidence.sessionFileCount,
        latestSessionFileModifiedAt: afterSessionEvidence.latestModifiedAt,
        providerOutputPreview: sanitizePreview(combined),
      },
    }, [
      buildStructuredEvent({
        operation: 'map_command_result',
        phase: 'session_evidence_collected',
        stateBefore: beforeSessionEvidence.hasSessionFiles ? 'unverified' : 'logging_in',
        stateAfter: 'unverified',
        responseType: 'none',
        message: `Session evidence collected but not promoted to authenticated without provider proof: count=${afterSessionEvidence.sessionFileCount}, latest=${afterSessionEvidence.latestModifiedAt ?? 'none'}.`,
        providerOutputShown: 'sanitized_preview',
      }),
    ]);
  }

  if (result.ok) {
    return appendStructuredEvents({
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_UNVERIFIED_SESSION',
      message: messages.startedMessage,
      details: {
        provider: 'icloudpd',
        nextAction: 'inspect_icloudpd_auth_output',
        providerOutputPreview: sanitizePreview(combined),
      },
    }, [
      buildStructuredEvent({
        operation: 'map_command_result',
        phase: 'session_evidence_collected',
        stateBefore: 'logging_in',
        stateAfter: 'failed',
        responseType: 'none',
        message: 'Command completed without verifiable authenticated session evidence.',
        providerOutputShown: 'sanitized_preview',
      }),
    ]);
  }

  return appendStructuredEvents({
    ok: false,
    state: 'failed',
    errorCode: result.errorCode ?? 'NEW_AUTH_ICLOUDPD_FAILED',
    message: 'iCloudPD authentication failed before a verifiable auth state was produced.',
    details: {
      provider: 'icloudpd',
      exitCode: result.exitCode,
      signal: result.signal,
      providerOutputPreview: sanitizePreview(combined),
    },
  }, [
    buildStructuredEvent({
      operation: 'map_command_result',
      phase: 'process_close',
      stateBefore: 'logging_in',
      stateAfter: 'failed',
      responseType: 'none',
      exitCode: result.exitCode,
      signal: result.signal,
      message: 'Provider command closed without verifiable auth state.',
      providerOutputShown: 'sanitized_preview',
    }),
  ]);
}


interface NewAuthTwoFactorPromptDiagnostics {
  requires2fa: true;
  canEnterSixDigitCode: boolean;
  canEnterDeviceIndex: boolean;
  availableDeviceIndexes: string[];
  userPrompts: string[];
}

function buildTwoFactorPromptDiagnostics(output: string): NewAuthTwoFactorPromptDiagnostics {
  const lower = output.toLowerCase();
  const canEnterDeviceIndex = /device index|send sms|sms with a code|^[a-z]:/im.test(output);
  const canEnterSixDigitCode = /verification code|security code|two[-\s]?factor authentication code|enter code|2fa code|six[-\s]?digit|6[-\s]?digit/i.test(output);
  const availableDeviceIndexes = extractAvailableDeviceIndexes(output);
  const prompts = new Set<string>();
  if (canEnterSixDigitCode || !canEnterDeviceIndex || /code/.test(lower)) {
    prompts.add('ENTER 6-DIGIT CODE');
  }
  if (canEnterDeviceIndex || availableDeviceIndexes.length > 0) {
    const index = availableDeviceIndexes[0]?.toUpperCase() ?? 'A';
    prompts.add(`ENTER DEVICE INDEX (${index})`);
  }
  if (prompts.size === 0) {
    prompts.add('ENTER 6-DIGIT CODE');
  }

  return {
    requires2fa: true,
    canEnterSixDigitCode,
    canEnterDeviceIndex: canEnterDeviceIndex || availableDeviceIndexes.length > 0,
    availableDeviceIndexes,
    userPrompts: Array.from(prompts),
  };
}

function extractAvailableDeviceIndexes(output: string): string[] {
  const indexes = new Set<string>();
  for (const match of output.matchAll(/^\s*([a-z])\s*:/gim)) {
    indexes.add(match[1].toLowerCase());
  }
  const rangeMatch = output.match(/device index\s*\(([a-z])\.\.([a-z])\)/i);
  if (rangeMatch) {
    indexes.add(rangeMatch[1].toLowerCase());
  }
  return Array.from(indexes).sort();
}

function indicatesNewAuthTwoFactorRequired(lower: string): boolean {
  return /two[-\s]?factor|2fa|two[-\s]?step|verification code|mfa|trusted device|trusted phone|enter code|security code|device index|auth"?\s*type"?\s*:\s*"?hsa2|"?authtype"?\s*:\s*"?hsa2|hsa2/.test(lower);
}

function buildNewAuthTwoFactorPromptInfo(lower: string): NewAuthTwoFactorPromptInfo {
  const mentionsDeviceIndex = /device index|send sms|sms with a code|\([a-z]\.\.[a-z]\)/.test(lower);
  const mentionsVerificationCode = /verification code|security code|enter code|two[-\s]?factor authentication code|2fa code|six[-\s]?digit|6[-\s]?digit/.test(lower);
  const mentionsHsa2 = /auth"?\s*type"?\s*:\s*"?hsa2|"?authtype"?\s*:\s*"?hsa2|hsa2/.test(lower);

  if (mentionsDeviceIndex && mentionsVerificationCode) {
    return {
      kind: 'device_index_or_code',
      requestedInput: 'Device index or six-digit verification code',
      nextAction: 'submit_device_index_or_verification_code',
      message: 'iCloudPD is asking for a trusted-device index or a verification code. Enter a device index such as "a" if you need Apple to send a code, or enter the six-digit code if you already have it.',
    };
  }

  if (mentionsDeviceIndex) {
    return {
      kind: 'device_index',
      requestedInput: 'Trusted-device index, such as "a"',
      nextAction: 'submit_trusted_device_index',
      message: 'iCloudPD is asking for a trusted-device index. Enter the listed device index, such as "a", to request a verification code.',
    };
  }

  if (mentionsVerificationCode) {
    return {
      kind: 'verification_code',
      requestedInput: 'Six-digit verification code',
      nextAction: 'submit_verification_code',
      message: 'iCloudPD is asking for the six-digit verification code from Apple.',
    };
  }

  if (mentionsHsa2) {
    return {
      kind: 'apple_hsa2_challenge',
      requestedInput: 'Apple HSA2 challenge; exact prompt not visible',
      nextAction: 'inspect_hsa2_prompt_then_submit_response',
      message: 'Apple returned an HSA2 two-factor challenge, but iCloudPD output did not expose whether it wants a device index or the six-digit code. If no code is visible yet, submit the trusted-device index such as "a"; otherwise submit the six-digit code.',
    };
  }

  return {
    kind: 'unknown',
    requestedInput: 'Two-factor response',
    nextAction: 'submit_two_factor_response',
    message: 'iCloudPD reported that a two-factor authentication challenge is required, but the exact requested input was not visible in the provider output.',
  };
}

function indicatesNewAuthInvalidCredentials(lower: string): boolean {
  return /invalid.*(password|credential|email)|incorrect.*password|authentication error|failed to login|bad username|bad password/.test(lower);
}

function indicatesNewAuthAuthenticated(lower: string): boolean {
  return /authenticated|authentication successful|valid session|cookie.*valid|auth.*successful|successfully authenticated|using existing session|auth-only/.test(lower) && !indicatesNewAuthInvalidCredentials(lower);
}

async function verifyExistingNewAuthSessionWithProvider(context: NewAuthContext): Promise<NewAuthProviderSessionProof> {
  const config = buildNewAuthIcloudpdConfig(context);
  if (!config.username) {
    return buildProviderProofSkipped('NEW_AUTH_USERNAME_MISSING', 'Local session files exist, but provider proof requires the configured iCloud username.');
  }
  if (!config.cookieDir) {
    return buildProviderProofSkipped('NEW_AUTH_COOKIE_DIR_MISSING', 'Local session files exist, but provider proof requires ICLOUDPD_COOKIE_DIR.');
  }

  const executable = await resolveIcloudpdExecutableForContext(context);
  if (!executable.found) {
    return buildProviderProofSkipped('ICLOUDPD_NOT_FOUND', 'Local session files exist, but iCloudPD could not be found to verify them.');
  }

  const args = buildNewAuthSessionProofArgs(config);
  const result = await runCommand(executable.path ?? 'icloudpd', args, {
    timeoutMs: Math.min(config.timeoutMs, ICLOUDPD_TIMEOUT_MS),
    spawnImpl: context.commandSpawner,
  });
  const combined = sanitizeCommandOutput(`${result.stdout}\n${result.stderr}`, config);
  const lower = combined.toLowerCase();
  const command = `icloudpd ${args.map(sanitizeProviderProofArgForDisplay).join(' ')}`;

  if (indicatesNewAuthTwoFactorRequired(lower)) {
    return buildProviderProofAttempted({
      verified: false,
      reasonCode: 'NEW_AUTH_PROVIDER_REQUIRES_2FA',
      message: 'iCloudPD requires two-factor authentication. ENTER 6-DIGIT CODE or ENTER DEVICE INDEX (A) when prompted by the provider.',
      command,
      result,
      providerOutputPreview: combined,
      twoFactorDiagnostics: buildTwoFactorPromptDiagnostics(combined),
    });
  }

  if (result.errorCode === 'ICLOUDPD_TIMEOUT') {
    return buildProviderProofAttempted({
      verified: false,
      reasonCode: 'NEW_AUTH_PROVIDER_PROOF_TIMEOUT',
      message: 'Local session files exist, but iCloudPD provider proof timed out before verifying them.',
      command,
      result,
      providerOutputPreview: combined,
    });
  }

  if (indicatesNewAuthInvalidCredentials(lower)) {
    return buildProviderProofAttempted({
      verified: false,
      reasonCode: 'NEW_AUTH_INVALID_CREDENTIALS',
      message: 'Local session files exist, but iCloudPD provider proof reported invalid credentials.',
      command,
      result,
      providerOutputPreview: combined,
    });
  }

  if (result.ok && indicatesNewAuthAuthenticated(lower)) {
    return buildProviderProofAttempted({
      verified: true,
      reasonCode: 'NEW_AUTH_PROVIDER_VERIFIED',
      message: 'iCloudPD provider proof verified the saved local session.',
      command,
      result,
      providerOutputPreview: combined,
    });
  }

  return buildProviderProofAttempted({
    verified: false,
    reasonCode: result.ok ? 'NEW_AUTH_PROVIDER_PROOF_INCONCLUSIVE' : (result.errorCode ?? 'NEW_AUTH_PROVIDER_PROOF_FAILED'),
    message: result.ok
      ? 'Local session files exist, but iCloudPD provider proof did not verify an authenticated session.'
      : 'Local session files exist, but iCloudPD provider proof failed before verifying them.',
    command,
    result,
    providerOutputPreview: combined,
  });
}

function buildNewAuthSessionProofArgs(config: NewAuthIcloudpdConfig): string[] {
  const args = [
    '--username', config.username,
    '--cookie-directory', config.cookieDir,
    '--auth-only',
  ] as string[];
  if (config.domain) {
    args.push('--domain', config.domain);
  }
  return args;
}

function buildProviderProofSkipped(reasonCode: string, message: string): NewAuthProviderSessionProof {
  return {
    attempted: false,
    verified: false,
    reasonCode,
    message,
    providerOutputShown: 'none',
    secretValuesShown: false,
  };
}

function buildProviderProofAttempted({
  verified,
  reasonCode,
  message,
  command,
  result,
  providerOutputPreview,
  twoFactorDiagnostics = null,
}: {
  verified: boolean;
  reasonCode: string;
  message: string;
  command: string;
  result: CommandResult;
  providerOutputPreview: string;
  twoFactorDiagnostics?: NewAuthTwoFactorPromptDiagnostics | null;
}): NewAuthProviderSessionProof {
  return {
    attempted: true,
    verified,
    reasonCode,
    message,
    command,
    exitCode: result.exitCode,
    signal: result.signal,
    providerOutputPreview: sanitizePreview(providerOutputPreview),
    providerOutputShown: 'sanitized_preview',
    secretValuesShown: false,
    ...(twoFactorDiagnostics ?? {}),
  };
}

function stateFromProviderProof(proof: NewAuthProviderSessionProof): NewAuthSessionState {
  if (proof.verified) {
    return 'authenticated';
  }
  if (proof.reasonCode === 'NEW_AUTH_PROVIDER_REQUIRES_2FA') {
    return 'requires_2fa';
  }
  if (proof.reasonCode === 'NEW_AUTH_INVALID_CREDENTIALS') {
    return 'failed';
  }
  return 'unverified';
}


function statusMessageForState(state: NewAuthSessionState, providerProof?: NewAuthProviderSessionProof): string {
  switch (state) {
    case 'authenticated':
      return 'iCloudPD provider proof verified the saved local session as authenticated.';
    case 'logged_out':
      return 'No active iCloudPD session files were found.';
    case 'pending_2fa':
      return 'iCloudPD authentication is waiting for two-factor verification.';
    case 'requires_2fa':
      return providerProof?.message ?? 'iCloudPD requires two-factor authentication. ENTER 6-DIGIT CODE or ENTER DEVICE INDEX (A).';
    case 'logging_in':
      return 'Authentication is currently in progress.';
    case 'failed':
      return 'iCloudPD provider proof reported an authentication failure.';
    case 'unverified':
      return providerProof?.message ?? 'Local session files exist, but iCloudPD provider proof has not verified them.';
    default:
      return 'Authentication state is unknown.';
  }
}
