import { execFile } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { sanitizeIcloudpdText } from './icloudpdSanitizer.ts';

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_RECENT_COUNT = '1';

export function createIcloudpdProcessRunner({ execFileImpl, executable = process.env.ICLOUDPD_BIN || 'icloudpd' }: any = {}) {
  const safeExecFileImpl = execFileImpl || execFileAsync;
  return {
    executable,
    async checkExecutable() {
      try {
        await safeExecFileImpl(executable, ['--version'], { timeout: 15_000, windowsHide: true });
        return { available: true };
      } catch (error) {
        return {
          available: false,
          code: 'icloudpd_executable_unavailable',
          message: 'icloudpd executable is not available on PATH or could not be started.',
          detailMessage: sanitizeIcloudpdText(error?.message || ''),
        };
      }
    },
    async startAuth({ config }: any) {
      const args = buildAuthOnlyArgs(config);
      return runIcloudpdCommand({ execFileImpl: safeExecFileImpl, executable, args, config, timeoutMs: config.timeoutMs });
    },
    async verifySession({ config }: any) {
      const args = buildVerifySessionArgs(config);
      return runIcloudpdCommand({ execFileImpl: safeExecFileImpl, executable, args, config, timeoutMs: config.timeoutMs });
    },
    async downloadSingleFile({ config }: any) {
      const args = buildSingleFileDownloadArgs(config);
      return runIcloudpdCommand({ execFileImpl: safeExecFileImpl, executable, args, config, timeoutMs: config.timeoutMs });
    },
    async submitTwoFactor() {
      return {
        exitCode: null,
        stdout: '',
        stderr: '',
        sanitizedCombinedOutput: 'icloudpd 2FA submission is interactive in supported CLI flows and is not safely automatable through this backend endpoint.',
        unsupportedTwoFactor: true,
      };
    },
    async cleanup({ config }: any) {
      if (!config.cookieDir) {
        return { localCleanupPerformed: false, message: 'No icloudpd cookie directory was configured.' };
      }
      await rm(config.cookieDir, { recursive: true, force: true });
      await mkdir(config.cookieDir, { recursive: true });
      return { localCleanupPerformed: true, message: 'Local icloudpd cookie directory was cleared and recreated.' };
    },
  };
}

export function buildAuthOnlyArgs(config: any) {
  const args = [
    '--username', config.username,
    '--password', config.password,
    '--cookie-directory', config.cookieDir,
    '--auth-only',
  ];
  if (config.domain) {
    args.push('--domain', config.domain);
  }
  return args;
}

export function buildVerifySessionArgs(config: any) {
  const directory = config.downloadDir || config.cookieDir || process.cwd();
  const args = [
    '--username', config.username,
    '--cookie-directory', config.cookieDir,
    '--directory', directory,
    '--recent', String(config.recentCount || DEFAULT_RECENT_COUNT),
    '--dry-run',
  ];
  if (config.domain) {
    args.push('--domain', config.domain);
  }
  return args;
}

export function buildSingleFileDownloadArgs(config: any) {
  const directory = config.downloadDir || process.cwd();
  const args = [
    '--username', config.username,
    '--password', config.password,
    '--cookie-directory', config.cookieDir,
    '--directory', directory,
    '--recent', '1',
    '--folder-structure', 'none',
  ];
  if (config.domain) {
    args.push('--domain', config.domain);
  }
  return args;
}

async function runIcloudpdCommand({ execFileImpl, executable, args, config, timeoutMs = DEFAULT_TIMEOUT_MS }: any) {
  await mkdir(config.cookieDir, { recursive: true });
  if (config.downloadDir) {
    await mkdir(config.downloadDir, { recursive: true });
  }
  const commandForDebug = redactIcloudpdArgs(args, config);
  try {
    const { stdout = '', stderr = '' } = await execFileImpl(executable, args, {
      timeout: Number(timeoutMs) > 0 ? Number(timeoutMs) : DEFAULT_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
    return {
      exitCode: 0,
      stdout,
      stderr,
      sanitizedCombinedOutput: sanitizeIcloudpdText(`${stdout}\n${stderr}`, config),
      commandForDebug,
    };
  } catch (error) {
    return {
      exitCode: typeof error?.code === 'number' ? error.code : 1,
      stdout: error?.stdout || '',
      stderr: error?.stderr || error?.message || '',
      sanitizedCombinedOutput: sanitizeIcloudpdText(`${error?.stdout || ''}\n${error?.stderr || ''}\n${error?.message || ''}`, config),
      commandForDebug,
      timedOut: Boolean(error?.killed || error?.signal === 'SIGTERM'),
    };
  }
}

export function redactIcloudpdArgs(args: any[], config: any = {}) {
  const sensitiveValues = new Set([config.password, config.twoFactorCode].filter(Boolean));
  const redacted = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--password') {
      redacted.push(arg, '[redacted]');
      index += 1;
      continue;
    }
    if (arg === '--cookie-directory') {
      redacted.push(arg, '[redacted-path]');
      index += 1;
      continue;
    }
    redacted.push(sensitiveValues.has(arg) ? '[redacted]' : arg);
  }
  return redacted;
}

export function normalizeProviderPath(value: any, { cwd = process.cwd() }: any = {}) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  return path.isAbsolute(value) ? value : path.resolve(cwd, value);
}
