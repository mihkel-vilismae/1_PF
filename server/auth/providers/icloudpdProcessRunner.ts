import { execFile } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { sanitizeIcloudpdText } from './icloudpdSanitizer.ts';
import type { IcloudpdCleanupResult, IcloudpdCommandResult, IcloudpdConfig, IcloudpdExecutableCheck, IcloudpdProcessRunner } from '../authTypes.ts';

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_RECENT_COUNT = '1';

type ExecFileLike = typeof execFileAsync;

interface CreateIcloudpdProcessRunnerOptions {
  execFileImpl?: ExecFileLike;
  executable?: string;
}

interface RunIcloudpdCommandOptions {
  execFileImpl: ExecFileLike;
  executable: string;
  args: string[];
  config: IcloudpdConfig;
  timeoutMs?: number;
}

export function createIcloudpdProcessRunner({
  execFileImpl,
  executable = process.env.ICLOUDPD_BIN || 'icloudpd',
}: CreateIcloudpdProcessRunnerOptions = {}): IcloudpdProcessRunner {
  const safeExecFileImpl = execFileImpl || execFileAsync;
  return {
    executable,
    async checkExecutable(): Promise<IcloudpdExecutableCheck> {
      try {
        await safeExecFileImpl(executable, ['--version'], { timeout: 15_000, windowsHide: true });
        return { available: true };
      } catch (error) {
        return {
          available: false,
          code: 'icloudpd_executable_unavailable',
          message: 'icloudpd executable is not available on PATH or could not be started.',
          detailMessage: sanitizeIcloudpdText((error as Error)?.message || ''),
        };
      }
    },
    async startAuth({ config }: { config: IcloudpdConfig }): Promise<IcloudpdCommandResult> {
      const args = buildAuthOnlyArgs(config);
      return runIcloudpdCommand({ execFileImpl: safeExecFileImpl, executable, args, config, timeoutMs: config.timeoutMs });
    },
    async verifySession({ config }: { config: IcloudpdConfig }): Promise<IcloudpdCommandResult> {
      const args = buildVerifySessionArgs(config);
      return runIcloudpdCommand({ execFileImpl: safeExecFileImpl, executable, args, config, timeoutMs: config.timeoutMs });
    },
    async downloadSingleFile({ config }: { config: IcloudpdConfig }): Promise<IcloudpdCommandResult> {
      const args = buildSingleFileDownloadArgs(config);
      return runIcloudpdCommand({ execFileImpl: safeExecFileImpl, executable, args, config, timeoutMs: config.timeoutMs });
    },
    async submitTwoFactor(): Promise<IcloudpdCommandResult> {
      return {
        exitCode: null,
        stdout: '',
        stderr: '',
        sanitizedCombinedOutput: 'icloudpd 2FA submission is interactive in supported CLI flows and is not safely automatable through this backend endpoint.',
        unsupportedTwoFactor: true,
      };
    },
    async cleanup({ config }: { config: IcloudpdConfig }): Promise<IcloudpdCleanupResult> {
      if (!config.cookieDir) {
        return { localCleanupPerformed: false, message: 'No icloudpd cookie directory was configured.' };
      }
      await rm(config.cookieDir, { recursive: true, force: true });
      await mkdir(config.cookieDir, { recursive: true });
      return { localCleanupPerformed: true, message: 'Local icloudpd cookie directory was cleared and recreated.' };
    },
  };
}

export function buildAuthOnlyArgs(config: IcloudpdConfig): string[] {
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

export function buildVerifySessionArgs(config: IcloudpdConfig): string[] {
  const directory = config.downloadDir || config.cookieDir || process.cwd();
  const args = [
    '--username', config.username,
    '--cookie-directory', config.cookieDir,
    '--directory', directory,
    '--recent', String(config.recentCount || DEFAULT_RECENT_COUNT),
    '--dry-run',
  ] as string[];
  if (config.domain) {
    args.push('--domain', config.domain);
  }
  return args;
}

export function buildSingleFileDownloadArgs(config: IcloudpdConfig): string[] {
  const directory = config.downloadDir || process.cwd();
  const args = [
    '--username', config.username,
    '--password', config.password,
    '--cookie-directory', config.cookieDir,
    '--directory', directory,
    '--recent', '1',
    '--folder-structure', 'none',
  ] as string[];
  if (config.domain) {
    args.push('--domain', config.domain);
  }
  return args;
}

async function runIcloudpdCommand({
  execFileImpl,
  executable,
  args,
  config,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: RunIcloudpdCommandOptions): Promise<IcloudpdCommandResult> {
  await mkdir(config.cookieDir as string, { recursive: true });
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
    const execError = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; killed?: boolean; signal?: string };
    return {
      exitCode: typeof execError.code === 'number' ? execError.code : 1,
      stdout: execError.stdout || '',
      stderr: execError.stderr || execError.message || '',
      sanitizedCombinedOutput: sanitizeIcloudpdText(`${execError.stdout || ''}\n${execError.stderr || ''}\n${execError.message || ''}`, config),
      commandForDebug,
      timedOut: Boolean(execError.killed || execError.signal === 'SIGTERM'),
    };
  }
}

export function redactIcloudpdArgs(args: string[], config: Partial<IcloudpdConfig> = {}): string[] {
  const sensitiveValues = new Set([config.password, config.twoFactorCode].filter(Boolean));
  const redacted: string[] = [];
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

export function normalizeProviderPath(value: unknown, { cwd = process.cwd() }: { cwd?: string } = {}): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  return path.isAbsolute(value) ? value : path.resolve(cwd, value);
}
