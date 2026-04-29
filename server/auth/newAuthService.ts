import { spawn } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export type NewAuthSessionState = 'logged_out' | 'logging_in' | 'pending_2fa' | 'authenticated' | 'failed' | 'unknown';
export type NewAuthPathType = 'file' | 'directory' | 'missing' | 'unknown';

export interface NewAuthEnvValues {
  [key: string]: string | undefined;
}

export interface NewAuthContext {
  envValues?: NewAuthEnvValues;
  platform?: NodeJS.Platform;
  username?: string | null;
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

interface NewAuthSessionEvidence {
  hasSessionFiles: boolean;
  sessionFileCount: number;
  latestModifiedMs: number | null;
  latestModifiedAt: string | null;
}

type NewAuthTwoFactorPromptKind = 'device_index' | 'verification_code' | 'device_index_or_code' | 'apple_hsa2_challenge' | 'unknown';

interface NewAuthTwoFactorPromptInfo {
  kind: NewAuthTwoFactorPromptKind;
  requestedInput: string;
  nextAction: string;
  message: string;
}

const ICLOUDPD_TIMEOUT_MS = 8000;
const ICLOUDPD_LOGIN_TIMEOUT_MS = 120_000;
const MAX_STDIO_CHARS = 6000;
const MAX_SESSION_CHILDREN = 25;
const SENSITIVE_ENV_KEYS = new Set(['user', 'pw', 'APPLE_ID', 'APPLE_PASSWORD', 'ICLOUDPD_COOKIE_DIR']);
const SESSION_FILE_HINT_PATTERN = /(cookie|session|token|auth|icloud|key|credential)/i;

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
  const paths = getNewAuthPathCandidates(context);
  const sessionDirectory = paths.find((entry) => entry.label === 'Configured session directory');
  const sessionFiles = flattenPathMetadata(paths).filter((entry) => entry.exists && entry.type === 'file' && SESSION_FILE_HINT_PATTERN.test(path.basename(entry.path)));
  const state = classifySessionState(paths, sessionFiles);

  return {
    ok: true,
    state,
    message: statusMessageForState(state),
    details: {
      provider: 'icloudpd',
      sessionDirectoryKnown: Boolean(sessionDirectory),
      sessionDirectoryExists: Boolean(sessionDirectory?.exists),
      sessionFileCount: sessionFiles.length,
      envPresence: summarizeEnvPresence(context.envValues ?? {}),
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

  const executable = await resolveIcloudpdExecutable(context.platform ?? process.platform);
  if (!executable.found) {
    return buildNewAuthProviderUnavailablePayload('ICLOUDPD_NOT_FOUND', 'iCloudPD executable was not found on PATH.');
  }

  await mkdir(config.cookieDir as string, { recursive: true });
  const beforeSessionEvidence = collectNewAuthSessionEvidence(config);
  const result = await runCommand(executable.path ?? 'icloudpd', buildNewAuthLoginArgs(config), { timeoutMs: config.timeoutMs });
  return mapNewAuthCommandResult(result, config, {
    successMessage: 'iCloudPD login completed and the local session was verified.',
    startedMessage: 'iCloudPD login command completed, but authenticated session proof was not strong enough to report success.',
  }, beforeSessionEvidence);
}

export async function submitNewAuthTwoFactor(context: NewAuthContext = {}, input: NewAuthTwoFactorInput = {}): Promise<Record<string, unknown>> {
  const config = buildNewAuthIcloudpdConfig(context);
  const missing = validateNewAuthLoginConfig(config);
  if (missing.length > 0) {
    return buildNewAuthMissingConfigPayload(missing, 'submit_2fa');
  }

  const code = typeof input.code === 'string' ? input.code.trim() : '';
  if (!code) {
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

  const executable = await resolveIcloudpdExecutable(context.platform ?? process.platform);
  if (!executable.found) {
    return buildNewAuthProviderUnavailablePayload('ICLOUDPD_NOT_FOUND', 'iCloudPD executable was not found on PATH.');
  }

  await mkdir(config.cookieDir as string, { recursive: true });
  const beforeSessionEvidence = collectNewAuthSessionEvidence(config);
  const result = await runCommand(executable.path ?? 'icloudpd', buildNewAuthLoginArgs(config), { timeoutMs: config.timeoutMs, stdinText: `${code}\n` });
  const mapped = mapNewAuthCommandResult(result, config, {
    successMessage: 'iCloudPD 2FA follow-up command completed and the local session was verified.',
    startedMessage: 'iCloudPD 2FA follow-up command completed, but authenticated session proof was not strong enough to report success.',
  }, beforeSessionEvidence);

  if (mapped.state === 'pending_2fa') {
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

  return mapped;
}

export async function logoutNewAuthSession(context: NewAuthContext = {}): Promise<Record<string, unknown>> {
  const config = buildNewAuthIcloudpdConfig(context);
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
        remoteLogoutClaimed: false,
      },
    };
  }

  return {
    ok: true,
    state: 'logged_out',
    message: 'Local iCloudPD session data was removed and the user is logged out locally. Remote Apple logout was not claimed.',
    details: {
      provider: 'icloudpd',
      sessionDirectory: sanitizePathForDisplay(safeCookieDir),
      remoteLogoutClaimed: false,
      sessionContentsShown: false,
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
        providerOutputPreview: sanitizePreview(combined),
      },
    };
  }

  if (result.errorCode === 'ICLOUDPD_TIMEOUT') {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_ICLOUDPD_TIMEOUT',
      message: 'iCloudPD authentication timed out before a verifiable auth result was produced.',
      details: {
        provider: 'icloudpd',
        providerOutputPreview: sanitizePreview(combined),
      },
    };
  }

  if (indicatesNewAuthInvalidCredentials(lower)) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_INVALID_CREDENTIALS',
      message: 'iCloudPD reported invalid iCloud credentials.',
      details: {
        provider: 'icloudpd',
        providerOutputPreview: sanitizePreview(combined),
      },
    };
  }

  if (result.ok && indicatesNewAuthAuthenticated(lower)) {
    return {
      ok: true,
      state: 'authenticated',
      message: messages.successMessage,
      details: {
        provider: 'icloudpd',
        authenticatedUser: redactEmail(config.username),
        providerSessionRef: 'icloudpd_cookie_directory_internal',
        providerOutputPreview: sanitizePreview(combined),
      },
    };
  }

  const afterSessionEvidence = result.ok ? collectNewAuthSessionEvidence(config) : EMPTY_SESSION_EVIDENCE;
  if (result.ok && hasFreshNewAuthSessionEvidence(beforeSessionEvidence, afterSessionEvidence)) {
    return {
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
    };
  }

  if (result.ok) {
    return {
      ok: false,
      state: 'failed',
      errorCode: 'NEW_AUTH_UNVERIFIED_SESSION',
      message: messages.startedMessage,
      details: {
        provider: 'icloudpd',
        nextAction: 'inspect_icloudpd_auth_output',
        providerOutputPreview: sanitizePreview(combined),
      },
    };
  }

  return {
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
  };
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
  for (const secret of [config.password, config.username]) {
    if (secret) {
      sanitized = sanitized.split(secret).join(secret === config.username ? redactEmail(secret) ?? '[redacted-user]' : '[redacted]');
    }
  }
  return sanitized;
}

function indicatesNewAuthTwoFactorRequired(lower: string): boolean {
  return /two[-\s]?factor|2fa|two[-\s]?step|verification code|mfa|trusted device|trusted phone|enter code|security code|device index|auth"?\s*type"?\s*:\s*"?hsa2|"?authtype"?\s*:\s*"?hsa2|hsa2/.test(lower);
}

function buildNewAuthTwoFactorPromptInfo(lower: string): NewAuthTwoFactorPromptInfo {
  const mentionsDeviceIndex = /device index|send sms|sms with a code|\([a-z]\.\.[a-z]\)|trusted phone/.test(lower);
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

function classifySessionState(paths: NewAuthPathMetadata[], sessionFiles: NewAuthPathMetadata[]): NewAuthSessionState {
  const configuredDirectory = paths.find((entry) => entry.label === 'Configured session directory');
  if (!configuredDirectory || !configuredDirectory.exists) {
    return 'logged_out';
  }
  if (sessionFiles.length > 0) {
    return 'authenticated';
  }
  return 'logged_out';
}

function statusMessageForState(state: NewAuthSessionState): string {
  switch (state) {
    case 'authenticated':
      return 'Authentication session files were found. Treating the local session as authenticated until Slice 3 adds provider proof.';
    case 'logged_out':
      return 'No active iCloudPD session files were found.';
    case 'pending_2fa':
      return 'Authentication is waiting for two-factor verification.';
    case 'logging_in':
      return 'Authentication is currently in progress.';
    case 'failed':
      return 'Authentication state check failed.';
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

function runCommand(command: string, args: string[], options: { timeoutMs: number; shell?: boolean; stdinText?: string }): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
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
    .replace(/password\s*=\s*[^\s]+/gi, 'password=[redacted]')
    .replace(/pw\s*=\s*[^\s]+/gi, 'pw=[redacted]')
    .replace(/token\s*=\s*[^\s]+/gi, 'token=[redacted]')
    .replace(/cookie\s*=\s*[^\s]+/gi, 'cookie=[redacted]');
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function sanitizePathForDisplay(value: string): string {
  const homeDir = os.homedir();
  if (homeDir && value.startsWith(homeDir)) {
    return value.replace(homeDir, '~');
  }
  return value;
}
