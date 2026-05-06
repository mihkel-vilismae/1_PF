import { spawn, type ChildProcessWithoutNullStreams, type SpawnOptionsWithoutStdio } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export type NewAuthSessionState = 'logged_out' | 'logging_in' | 'pending_2fa' | 'requires_2fa' | 'authenticated' | 'failed' | 'unverified' | 'unknown';
export type NewAuthPathType = 'file' | 'directory' | 'missing' | 'unknown';

export interface NewAuthEnvValues {
  [key: string]: string | undefined;
}

export interface NewAuthContext {
  envValues?: NewAuthEnvValues;
  platform?: NodeJS.Platform;
  username?: string | null;
  executablePath?: string | null;
  commandSpawner?: NewAuthCommandSpawner;
}

export interface NewAuthPathMetadata {
  label: string;
  path: string;
  exists: boolean;
  type: NewAuthPathType;
  sizeBytes?: number;
  lastModified?: string;
  contentsShown: false;
  children?: NewAuthPathMetadata[];
}

export interface NewAuthTwoFactorInput {
  code?: unknown;
}

interface NewAuthIcloudpdConfig {
  username: string | null;
  password: string | null;
  cookieDir: string | null;
  downloadDir: string | null;
  domain: string | null;
  timeoutMs: number;
}

interface CommandResult {
  ok: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  errorCode?: string;
  errorMessage?: string;
}

export type NewAuthCommandSpawner = (command: string, args: string[], options: SpawnOptionsWithoutStdio) => ChildProcessWithoutNullStreams;

interface NewAuthSessionEvidence {
  hasSessionFiles: boolean;
  sessionFileCount: number;
  latestModifiedMs: number | null;
  latestModifiedAt: string | null;
}

interface NewAuthProviderSessionProof {
  attempted: boolean;
  verified: boolean;
  reasonCode: string;
  message: string;
  command?: string;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
  providerOutputPreview?: string;
  providerOutputShown: NewAuthProviderOutputShown;
  secretValuesShown: false;
  requires2fa?: boolean;
  canEnterSixDigitCode?: boolean;
  canEnterDeviceIndex?: boolean;
  availableDeviceIndexes?: string[];
  userPrompts?: string[];
}

type NewAuthTwoFactorPromptKind = 'device_index' | 'verification_code' | 'device_index_or_code' | 'apple_hsa2_challenge' | 'unknown';

interface NewAuthTwoFactorPromptInfo {
  kind: NewAuthTwoFactorPromptKind;
  requestedInput: string;
  nextAction: string;
  message: string;
}

interface NewAuthInteractiveAttempt {
  child: ChildProcessWithoutNullStreams;
  config: NewAuthIcloudpdConfig;
  beforeSessionEvidence: NewAuthSessionEvidence;
  createdAt: number;
  expiresAt: number;
  stdout: string;
  stderr: string;
  consumedOutputLength: number;
  closed: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  pendingWaiter: boolean;
}

type NewAuthProviderOutputShown = 'sanitized_preview' | 'classification_only' | 'none';

interface NewAuthStructuredEvent {
  area: 'new-auth';
  operation: string;
  phase: string;
  stateBefore?: NewAuthSessionState | string;
  stateAfter?: NewAuthSessionState | string;
  promptKind?: NewAuthTwoFactorPromptKind | 'none';
  responseType?: 'device_index' | 'verification_code' | 'unknown' | 'none';
  endpoint?: string;
  durationMs?: number;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
  secretValuesShown: false;
  providerOutputShown: NewAuthProviderOutputShown;
  message: string;
}

const ICLOUDPD_TIMEOUT_MS = 8000;
const ICLOUDPD_LOGIN_TIMEOUT_MS = 120_000;
const MAX_STDIO_CHARS = 6000;
const MAX_SESSION_CHILDREN = 25;
const SENSITIVE_ENV_KEYS = new Set(['user', 'pw', 'APPLE_ID', 'APPLE_PASSWORD', 'ICLOUDPD_COOKIE_DIR']);
const SESSION_FILE_HINT_PATTERN = /(cookie|session|token|auth|icloud|key|credential)/i;
const INTERACTIVE_RESULT_POLL_MS = 50;

let activeNewAuthAttempt: NewAuthInteractiveAttempt | null = null;

export async function verifyNewAuthIcloudpd(context: NewAuthContext = {}): Promise<Record<string, unknown>> {
  const executable = await resolveIcloudpdExecutable(context.platform ?? process.platform);

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

  const version = await runCommand(executable.path ?? 'icloudpd', ['--version'], { timeoutMs: ICLOUDPD_TIMEOUT_MS });
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

export async function getNewAuthStatus(context: NewAuthContext = {}): Promise<Record<string, unknown>> {
  const activeAttempt = getActiveNewAuthAttempt();
  if (activeAttempt) {
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

  const paths = getNewAuthPathCandidates(context);
  const sessionDirectory = paths.find((entry) => entry.label === 'Configured session directory');
  const sessionFiles = flattenPathMetadata(paths).filter((entry) => entry.exists && entry.type === 'file' && SESSION_FILE_HINT_PATTERN.test(path.basename(entry.path)));
  const baseDetails = {
    provider: 'icloudpd',
    sessionDirectoryKnown: Boolean(sessionDirectory),
    sessionDirectoryExists: Boolean(sessionDirectory?.exists),
    sessionFileCount: sessionFiles.length,
    localSessionEvidence: {
      hasSessionFiles: sessionFiles.length > 0,
      sessionFileCount: sessionFiles.length,
      contentsShown: false,
    },
    envPresence: summarizeEnvPresence(context.envValues ?? {}),
  };

  if (!sessionDirectory || !sessionDirectory.exists || sessionFiles.length === 0) {
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

export async function getNewAuthSessionFiles(context: NewAuthContext = {}): Promise<Record<string, unknown>> {
  const executable = await resolveIcloudpdExecutable(context.platform ?? process.platform);
  const basePaths = getNewAuthPathCandidates(context);
  const paths: NewAuthPathMetadata[] = [];

  paths.push(buildPathMetadata('iCloudPD executable', executable.displayPath ?? 'icloudpd', executable.found ? executable.path : null));
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

function waitForInteractiveNewAuthResult(
  attempt: NewAuthInteractiveAttempt,
  messages: { successMessage: string; startedMessage: string },
): Promise<Record<string, unknown>> {
  if (attempt.pendingWaiter) {
    return Promise.resolve(buildPendingPayloadFromActiveAttempt(attempt, 'iCloudPD authentication is already processing a submitted response.'));
  }

  attempt.pendingWaiter = true;
  return new Promise((resolve) => {
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
      ok: true,
      state: 'authenticated',
      message: messages.successMessage,
      details: {
        provider: 'icloudpd',
        authenticatedUser: redactEmail(config.username),
        providerSessionRef: 'icloudpd_cookie_directory_internal',
        sessionFileCount: afterSessionEvidence.sessionFileCount,
        latestSessionFileModifiedAt: afterSessionEvidence.latestModifiedAt,
        providerOutputPreview: sanitizePreview(combined),
      },
    }, [
      buildStructuredEvent({
        operation: 'map_command_result',
        phase: 'session_evidence_collected',
        stateBefore: beforeSessionEvidence.hasSessionFiles ? 'authenticated' : 'logging_in',
        stateAfter: 'authenticated',
        responseType: 'none',
        message: `Session evidence collected: count=${afterSessionEvidence.sessionFileCount}, latest=${afterSessionEvidence.latestModifiedAt ?? 'none'}.`,
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

const EMPTY_SESSION_EVIDENCE: NewAuthSessionEvidence = Object.freeze({
  hasSessionFiles: false,
  sessionFileCount: 0,
  latestModifiedMs: null,
  latestModifiedAt: null,
});

function collectNewAuthSessionEvidence(config: NewAuthIcloudpdConfig): NewAuthSessionEvidence {
  if (!config.cookieDir) {
    return EMPTY_SESSION_EVIDENCE;
  }

  const configuredDirectory = buildPathMetadata('Configured session directory', config.cookieDir, config.cookieDir, true);
  const sessionFiles = flattenPathMetadata([configuredDirectory]).filter((entry) => (
    entry.exists && entry.type === 'file' && SESSION_FILE_HINT_PATTERN.test(path.basename(entry.path))
  ));
  const latestModifiedMs = sessionFiles.reduce<number | null>((latest, entry) => {
    const modifiedMs = entry.lastModified ? Date.parse(entry.lastModified) : Number.NaN;
    if (!Number.isFinite(modifiedMs)) {
      return latest;
    }
    return latest === null || modifiedMs > latest ? modifiedMs : latest;
  }, null);

  return {
    hasSessionFiles: sessionFiles.length > 0,
    sessionFileCount: sessionFiles.length,
    latestModifiedMs,
    latestModifiedAt: latestModifiedMs === null ? null : new Date(latestModifiedMs).toISOString(),
  };
}

function hasFreshNewAuthSessionEvidence(before: NewAuthSessionEvidence, after: NewAuthSessionEvidence): boolean {
  if (!after.hasSessionFiles) {
    return false;
  }
  if (!before.hasSessionFiles) {
    return true;
  }
  if (after.sessionFileCount > before.sessionFileCount) {
    return true;
  }
  if (before.latestModifiedMs === null || after.latestModifiedMs === null) {
    return false;
  }
  return after.latestModifiedMs > before.latestModifiedMs;
}

function sanitizeCommandOutput(value: string, config: NewAuthIcloudpdConfig): string {
  let sanitized = sanitizePreview(value, 4000);
  for (const secret of [config.password, config.username, config.cookieDir, config.downloadDir]) {
    if (secret) {
      sanitized = sanitized.split(secret).join(secret === config.username ? redactEmail(secret) ?? '[redacted-user]' : '[redacted]');
    }
  }
  return sanitized;
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

function isSafeSessionCleanupPath(candidate: string): boolean {
  const normalized = path.resolve(candidate);
  const root = path.parse(normalized).root;
  if (normalized === root) return false;
  if (normalized === os.homedir()) return false;
  if (normalized === process.cwd()) return false;
  const basename = path.basename(normalized).toLowerCase();
  return basename.includes('icloud') || basename.includes('auth') || basename.includes('session') || basename.includes('cookie');
}

function normalizeNewAuthPath(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null;
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function stringValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function positiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function redactEmail(value: string | null): string | null {
  if (!value || !value.includes('@')) return value ? '[redacted-user]' : null;
  const [name, domain] = value.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
}

function getNewAuthPathCandidates(context: NewAuthContext): NewAuthPathMetadata[] {
  const envValues = context.envValues ?? {};
  const candidates: NewAuthPathMetadata[] = [];
  const envPath = envValues.INIT_ENV_FILE || process.env.INIT_ENV_FILE || '.env';
  const cookieDir = envValues.ICLOUDPD_COOKIE_DIR;
  const downloadDir = envValues.DOWNLOAD_DIR;
  const homeDir = os.homedir();

  candidates.push(buildPathMetadata('.env file', envPath, resolveCandidatePath(envPath)));
  if (cookieDir) {
    candidates.push(buildPathMetadata('Configured session directory', cookieDir, resolveCandidatePath(cookieDir), true));
  } else {
    candidates.push(buildPathMetadata('Configured session directory', 'ICLOUDPD_COOKIE_DIR is not configured', null));
  }

  if (downloadDir) {
    candidates.push(buildPathMetadata('Configured download/cache directory', downloadDir, resolveCandidatePath(downloadDir), true));
  }

  candidates.push(buildPathMetadata('Default iCloudPD directory', path.join(homeDir, '.icloudpd'), path.join(homeDir, '.icloudpd'), true));
  candidates.push(buildPathMetadata('Default pyicloud directory', path.join(homeDir, '.pyicloud'), path.join(homeDir, '.pyicloud'), true));
  candidates.push(buildPathMetadata('Operating-system cache directory hint', path.join(homeDir, '.cache'), path.join(homeDir, '.cache'), true));
  candidates.push(...buildEnvPresenceMetadata(envValues));
  return candidates;
}

function buildEnvPresenceMetadata(envValues: NewAuthEnvValues): NewAuthPathMetadata[] {
  return Array.from(SENSITIVE_ENV_KEYS).map((key) => ({
    label: `Environment value ${key}`,
    path: `${key}=${envValues[key] ? '[present]' : '[missing]'}`,
    exists: Boolean(envValues[key]),
    type: envValues[key] ? 'unknown' : 'missing',
    contentsShown: false,
  }));
}

function resolveCandidatePath(candidate: string): string {
  if (path.isAbsolute(candidate)) {
    return candidate;
  }
  return path.resolve(process.cwd(), candidate);
}

function buildPathMetadata(label: string, displayPath: string, absolutePath: string | null, includeChildren = false): NewAuthPathMetadata {
  if (!absolutePath || !existsSync(absolutePath)) {
    return {
      label,
      path: sanitizePathForDisplay(displayPath),
      exists: false,
      type: 'missing',
      contentsShown: false,
    };
  }

  try {
    const stat = statSync(absolutePath);
    const metadata: NewAuthPathMetadata = {
      label,
      path: sanitizePathForDisplay(absolutePath),
      exists: true,
      type: stat.isDirectory() ? 'directory' : stat.isFile() ? 'file' : 'unknown',
      lastModified: stat.mtime.toISOString(),
      contentsShown: false,
    };

    if (stat.isFile()) {
      metadata.sizeBytes = stat.size;
    }

    if (includeChildren && stat.isDirectory()) {
      metadata.children = readSafeChildren(absolutePath);
    }

    return metadata;
  } catch {
    return {
      label,
      path: sanitizePathForDisplay(absolutePath),
      exists: true,
      type: 'unknown',
      contentsShown: false,
    };
  }
}

function readSafeChildren(directoryPath: string): NewAuthPathMetadata[] {
  try {
    return readdirSync(directoryPath, { withFileTypes: true })
      .slice(0, MAX_SESSION_CHILDREN)
      .map((entry) => buildPathMetadata(entry.name, entry.name, path.join(directoryPath, entry.name), false));
  } catch {
    return [];
  }
}

function flattenPathMetadata(paths: NewAuthPathMetadata[]): NewAuthPathMetadata[] {
  return paths.flatMap((entry) => [entry, ...(entry.children ? flattenPathMetadata(entry.children) : [])]);
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

function sanitizeProviderProofArgForDisplay(value: string): string {
  if (value === '--username' || value === '--cookie-directory' || value === '--auth-only' || value === '--domain') {
    return value;
  }
  if (value.includes('@')) {
    return redactEmail(value) ?? '[redacted-user]';
  }
  if (path.isAbsolute(value) || value.includes(path.sep)) {
    return '[redacted-path]';
  }
  return value;
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

function summarizeEnvPresence(envValues: NewAuthEnvValues): Record<string, boolean> {
  const summary: Record<string, boolean> = {};
  for (const key of SENSITIVE_ENV_KEYS) {
    summary[key] = Boolean(envValues[key]);
  }
  return summary;
}

async function resolveIcloudpdExecutable(platform: NodeJS.Platform): Promise<{ found: boolean; path: string | null; displayPath: string | null; lookupCommand: string }> {
  const lookupCommand = platform === 'win32' ? 'where' : 'sh';
  const lookupArgs = platform === 'win32' ? ['icloudpd'] : ['-c', 'command -v icloudpd'];
  const result = await runCommand(lookupCommand, lookupArgs, { timeoutMs: ICLOUDPD_TIMEOUT_MS });
  const rawPath = result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? null;
  return {
    found: result.ok && Boolean(rawPath),
    path: rawPath,
    displayPath: rawPath ? sanitizePathForDisplay(rawPath) : null,
    lookupCommand: `${lookupCommand} ${lookupArgs.join(' ')}`,
  };
}

async function resolveIcloudpdExecutableForContext(context: NewAuthContext): Promise<{ found: boolean; path: string | null; displayPath: string | null; lookupCommand: string }> {
  if (context.executablePath) {
    return {
      found: true,
      path: context.executablePath,
      displayPath: sanitizePathForDisplay(context.executablePath),
      lookupCommand: 'injected executablePath',
    };
  }
  return resolveIcloudpdExecutable(context.platform ?? process.platform);
}

function runCommand(command: string, args: string[], options: { timeoutMs: number; shell?: boolean; stdinText?: string; spawnImpl?: NewAuthCommandSpawner }): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = (options.spawnImpl ?? spawn)(command, args, {
      shell: options.shell ?? false,
      windowsHide: true,
      env: process.env,
    });
    const cleanupChild = () => {
      try { child.stdin?.destroy(); } catch {}
      try { child.stdout?.destroy(); } catch {}
      try { child.stderr?.destroy(); } catch {}
      try { child.unref(); } catch {}
    };
    let stdout = '';
    let stderr = '';
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGTERM');
      cleanupChild();
      resolve({
        ok: false,
        exitCode: null,
        signal: 'SIGTERM',
        stdout: sanitizePreview(stdout),
        stderr: sanitizePreview(stderr),
        errorCode: 'ICLOUDPD_TIMEOUT',
        errorMessage: 'Command timed out.',
      });
    }, options.timeoutMs);
    timeout.unref?.();

    if (typeof options.stdinText === 'string') {
      child.stdin?.write(options.stdinText);
      child.stdin?.end();
    }

    child.stdout?.on('data', (chunk) => {
      stdout = `${stdout}${chunk}`.slice(-MAX_STDIO_CHARS);
    });

    child.stderr?.on('data', (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-MAX_STDIO_CHARS);
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      cleanupChild();
      resolve({
        ok: false,
        exitCode: null,
        signal: null,
        stdout: sanitizePreview(stdout),
        stderr: sanitizePreview(stderr),
        errorCode: error.code === 'ENOENT' ? 'ICLOUDPD_NOT_FOUND' : 'ICLOUDPD_EXECUTION_ERROR',
        errorMessage: error.message,
      });
    });

    child.on('close', (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      cleanupChild();
      cleanupChild();
      resolve({
        ok: exitCode === 0,
        exitCode,
        signal,
        stdout: sanitizePreview(stdout),
        stderr: sanitizePreview(stderr),
      });
    });
  });
}

function extractVersion(stdout: string, stderr: string): string | null {
  const text = `${stdout}\n${stderr}`.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return text ? sanitizePreview(text, 300) : null;
}

function summarizeCommandFailure(prefix: string, result: CommandResult): string {
  if (result.errorCode === 'ICLOUDPD_TIMEOUT') {
    return `${prefix} The command timed out.`;
  }
  if (result.errorCode === 'ICLOUDPD_NOT_FOUND') {
    return 'iCloudPD executable was not found on PATH.';
  }
  if (result.errorMessage) {
    return `${prefix} ${sanitizePreview(result.errorMessage, 300)}`;
  }
  if (result.stderr) {
    return `${prefix} ${sanitizePreview(result.stderr, 300)}`;
  }
  return `${prefix} Exit code: ${result.exitCode ?? 'unknown'}.`;
}

function sanitizePreview(value: string, maxLength = 500): string {
  const text = String(value ?? '')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[redacted-email]')
    .replace(/password\s*=\s*[^\s]+/gi, 'password=[redacted]')
    .replace(/pw\s*=\s*[^\s]+/gi, 'pw=[redacted]')
    .replace(/apple[_\s-]?id\s*[:=]\s*[^\s]+/gi, 'apple_id=[redacted]')
    .replace(/(otp|2fa|mfa|verification|security)\s*(code)?\s*[:=]\s*[^\s]+/gi, '$1$2=[redacted]')
    .replace(/\b(otp|2fa|mfa|verification|security|sms)\s*(code)?\s*(?:is|was|:)?\s*\d{4,8}\b/gi, '$1$2 [redacted]')
    .replace(/\b\d{4,8}\s+(otp|2fa|mfa|verification|security|sms)\s*(code)?\b/gi, '[redacted] $1$2')
    .replace(/token\s*=\s*[^\s]+/gi, 'token=[redacted]')
    .replace(/cookie\s*=\s*[^\s]+/gi, 'cookie=[redacted]')
    .replace(/(session|cookie|token)[^\r\n]*(file|path|dir|directory)\s*[:=]\s*[^\r\n]+/gi, '$1_$2=[redacted-path]')
    .replace(/\b([A-Z][A-Z0-9_]{2,})\s*=\s*([^\s]+)/g, (full, key: string) => `${key}=${SENSITIVE_ENV_KEYS.has(key) ? '[redacted]' : '[present]'}`);
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function appendStructuredEvents(payload: Record<string, unknown>, events: NewAuthStructuredEvent[]): Record<string, unknown> {
  const details = payload.details && typeof payload.details === 'object' ? payload.details as Record<string, unknown> : {};
  const existingEvents = Array.isArray(details.events) ? details.events as unknown[] : [];
  return {
    ...payload,
    details: {
      ...details,
      secretValuesShown: false,
      providerOutputShown: providerOutputShownForPayload(payload),
      events: [...existingEvents, ...events],
    },
  };
}

function buildStructuredEvent(input: Omit<NewAuthStructuredEvent, 'area' | 'secretValuesShown'>): NewAuthStructuredEvent {
  return {
    area: 'new-auth',
    secretValuesShown: false,
    ...input,
  };
}

function readPromptKindFromPayload(payload: Record<string, unknown>): NewAuthTwoFactorPromptKind | 'none' {
  const details = payload.details && typeof payload.details === 'object' ? payload.details as Record<string, unknown> : null;
  return typeof details?.twoFactorPromptKind === 'string' ? details.twoFactorPromptKind as NewAuthTwoFactorPromptKind : 'none';
}

function classifyResponseType(value: string): 'device_index' | 'verification_code' | 'unknown' {
  if (/^[a-z]$/i.test(value.trim())) {
    return 'device_index';
  }
  if (/^\d{4,8}$/.test(value.trim())) {
    return 'verification_code';
  }
  return 'unknown';
}

function promptKindForResponseType(responseType: 'device_index' | 'verification_code' | 'unknown'): NewAuthTwoFactorPromptKind {
  if (responseType === 'device_index') {
    return 'device_index';
  }
  if (responseType === 'verification_code') {
    return 'verification_code';
  }
  return 'unknown';
}

function providerOutputShownForPayload(payload: Record<string, unknown>): NewAuthProviderOutputShown {
  const details = payload.details && typeof payload.details === 'object' ? payload.details as Record<string, unknown> : null;
  if (!details) {
    return 'none';
  }
  if (typeof details.providerOutputPreview === 'string' && details.providerOutputPreview.length > 0) {
    return 'sanitized_preview';
  }
  if (typeof details.twoFactorPromptKind === 'string') {
    return 'classification_only';
  }
  return 'none';
}

function sanitizePathForDisplay(value: string): string {
  const homeDir = os.homedir();
  if (homeDir && value.startsWith(homeDir)) {
    return value.replace(homeDir, '~');
  }
  return value;
}
