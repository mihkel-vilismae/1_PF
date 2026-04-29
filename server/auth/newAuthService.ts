import { spawn } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';
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

interface CommandResult {
  ok: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  errorCode?: string;
  errorMessage?: string;
}

const ICLOUDPD_TIMEOUT_MS = 8000;
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

function runCommand(command: string, args: string[], options: { timeoutMs: number; shell?: boolean }): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      shell: options.shell ?? false,
      windowsHide: true,
      env: process.env,
    });
    const cleanupChild = () => {
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
