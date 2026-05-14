/*
 * Owns the opt-in raw iCloudPD stdout/stderr capture sink.
 * The sink is local-only, disabled by default, isolated under runtime_data,
 * and intentionally separate from sanitized API, UI, event-history, and logs.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const RAW_STDIO_FLAG = 'ICLOUDPD_RAW_STDIO_LOG';
const RAW_STDIO_PATH = 'ICLOUDPD_RAW_STDIO_LOG_PATH';
const DEFAULT_RAW_STDIO_LOG = path.join('runtime_data', 'private_logs', 'icloudpd_raw_stdio.log');

export type IcloudpdRawStdioStream = 'stdout' | 'stderr';

interface RawStdioLoggerOptions {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  label?: string;
}

export interface IcloudpdRawStdioLogger {
  enabled: boolean;
  path: string | null;
  write(stream: IcloudpdRawStdioStream, chunk: unknown): void;
}

/*
 * Builds a best-effort writer for raw provider output when the operator has
 * explicitly enabled the raw-sensitive local debug file.
 */
export function createIcloudpdRawStdioLogger(options: RawStdioLoggerOptions = {}): IcloudpdRawStdioLogger {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const logPath = resolveIcloudpdRawStdioLogPath(env, cwd);
  if (!isIcloudpdRawStdioLogEnabled(env) || !logPath) {
    return {
      enabled: false,
      path: null,
      write() {},
    };
  }

  const label = options.label ?? 'icloudpd';
  return {
    enabled: true,
    path: logPath,
    write(stream, chunk) {
      try {
        const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk ?? '');
        if (!text) {
          return;
        }
        mkdirSync(path.dirname(logPath), { recursive: true });
        appendFileSync(logPath, formatRawStdioRecord({ label, stream, text }), 'utf8');
      } catch {
        // Raw debug logging is diagnostic only and must never alter auth behavior.
      }
    },
  };
}

/*
 * Checks the explicit opt-in flag for raw-sensitive local provider logging.
 */
export function isIcloudpdRawStdioLogEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return /^(1|true|yes|on)$/i.test(String(env[RAW_STDIO_FLAG] ?? '').trim());
}

/*
 * Resolves the raw log path and rejects paths outside private runtime logs.
 */
export function resolveIcloudpdRawStdioLogPath(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): string | null {
  const privateLogRoot = path.resolve(cwd, 'runtime_data', 'private_logs');
  const configured = String(env[RAW_STDIO_PATH] ?? '').trim();
  const requested = path.resolve(cwd, configured || DEFAULT_RAW_STDIO_LOG);
  const relative = path.relative(privateLogRoot, requested);
  if (path.extname(requested).toLowerCase() === '.log' && relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return requested;
  }
  return null;
}

/*
 * Formats one raw stdout/stderr chunk with a timestamped boundary.
 */
export function formatRawStdioRecord({ label, stream, text }: { label: string; stream: IcloudpdRawStdioStream; text: string }): string {
  return `\n===== ${new Date().toISOString()} ${label} ${stream} =====\n${text}`;
}
