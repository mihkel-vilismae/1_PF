/*
 * Wraps NEW AUTH provider process execution and executable discovery.
 * The runner preserves existing timeout/error semantics and only exposes redacted
 * command diagnostics to callers.
 */
import { spawn } from 'node:child_process';
import { ICLOUDPD_TIMEOUT_MS, MAX_STDIO_CHARS } from './newAuthConstants.js';
import type { NewAuthCommandSpawner, NewAuthContext, CommandResult } from './newAuthTypes.js';
import { sanitizePathForDisplay, sanitizePreview } from './newAuthSanitization.js';

/*
 * Resolves the iCloudPD executable from explicit context, PATH, or platform lookup.
 */
export async function resolveIcloudpdExecutableForContext(context: NewAuthContext): Promise<{ found: boolean; path: string | null; displayPath: string | null; lookupCommand: string }> {
  if (Object.hasOwn(context, 'executablePath')) {
    if (!context.executablePath) {
      return {
        found: false,
        path: null,
        displayPath: null,
        lookupCommand: 'injected executablePath',
      };
    }
    return {
      found: true,
      path: context.executablePath,
      displayPath: sanitizePathForDisplay(context.executablePath),
      lookupCommand: 'injected executablePath',
    };
  }
  return resolveIcloudpdExecutable(context.platform ?? process.platform);
}

/*
 * Runs a provider command with bounded output and timeout handling.
 */
export function runCommand(command: string, args: string[], options: { timeoutMs: number; shell?: boolean; stdinText?: string; spawnImpl?: NewAuthCommandSpawner }): Promise<CommandResult> {
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

/*
 * Extracts a concise provider version string from command output.
 */
export function extractVersion(stdout: string, stderr: string): string | null {
  const text = `${stdout}\n${stderr}`.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return text ?? null;
}

/*
 * Converts command failure details into a safe dashboard message.
 */
export function summarizeCommandFailure(prefix: string, result: CommandResult): string {
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

/*
 * Resolves iCloudPD by using the platform-appropriate PATH lookup command.
 */
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
