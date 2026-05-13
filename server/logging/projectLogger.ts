/*
 * Provides JSONL project logging for backend runtime diagnostics.
 * The logger owns log file paths, serialization, and best-effort write ordering.
 * Auth/login diagnostics can be mirrored to a dedicated login debug file.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const DEFAULT_LOG_DIR = 'logs';

type LogLevel = 'debug' | 'error' | 'info';

interface ProjectLoggerOptions {
  repoRoot?: string;
  logDir?: string;
  verboseEnabled?: boolean;
  now?: () => Date;
  source?: string;
  onWriteError?: ((error: Error) => void) | null;
}

interface ProjectLoggerPaths {
  directory: string;
  error: string;
  debug: string;
  regular: string;
  full: string;
  verbose: string;
  loginDebug: string;
}

interface ProjectLogEntry {
  at: string;
  level: LogLevel;
  source: string;
  message: string;
  details: unknown;
}

export interface ProjectLogger {
  paths: ProjectLoggerPaths;
  initialize(): Promise<ProjectLoggerPaths>;
  write(level: unknown, message: unknown, details?: unknown): Promise<void | ProjectLoggerPaths>;
  info(message: unknown, details?: unknown): Promise<void | ProjectLoggerPaths>;
  debug(message: unknown, details?: unknown): Promise<void | ProjectLoggerPaths>;
  error(message: unknown, details?: unknown): Promise<void | ProjectLoggerPaths>;
  loginDebug(message: unknown, details?: unknown): Promise<void | ProjectLoggerPaths>;
  verbose(entry: unknown): Promise<void | ProjectLoggerPaths>;
}

interface ResolveLogDirectoryOptions {
  repoRoot?: string;
}

interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: unknown;
}

const LEVEL_FILE_NAMES = Object.freeze({
  error: 'error.log',
  debug: 'debug.log',
});

// Creates a JSONL logger rooted in the configured project log directory.
export function createProjectLogger({
  repoRoot = process.cwd(),
  logDir = DEFAULT_LOG_DIR,
  verboseEnabled = false,
  now = () => new Date(),
  source = 'server',
  onWriteError = null,
}: ProjectLoggerOptions = {}): ProjectLogger {
  const logDirectory = resolveLogDirectory(logDir, { repoRoot });
  const regularLogFileName = `log_${formatLogFileDate(now())}.log`;
  const paths: ProjectLoggerPaths = {
    directory: logDirectory,
    error: path.join(logDirectory, LEVEL_FILE_NAMES.error),
    debug: path.join(logDirectory, LEVEL_FILE_NAMES.debug),
    regular: path.join(logDirectory, regularLogFileName),
    full: path.join(logDirectory, 'full_log.log'),
    verbose: path.join(logDirectory, 'full_log_verbose.log'),
    loginDebug: path.join(logDirectory, 'logindebug.log'),
  };

  let initialized = false;
  let writeChain: Promise<void | ProjectLoggerPaths> = Promise.resolve();

  // Creates all configured log files without truncating existing contents.
  async function initialize(): Promise<ProjectLoggerPaths> {
    if (initialized) {
      return paths;
    }

    await fs.mkdir(paths.directory, { recursive: true });
    await Promise.all([
      touchFile(paths.error),
      touchFile(paths.debug),
      touchFile(paths.regular),
      touchFile(paths.full),
      touchFile(paths.loginDebug),
      ...(verboseEnabled ? [touchFile(paths.verbose)] : []),
    ]);
    initialized = true;
    return paths;
  }

  // Writes one entry to the normal level log and the full aggregate log.
  function write(level: unknown, message: unknown, details: unknown = null): Promise<void | ProjectLoggerPaths> {
    const normalizedLevel = normalizeLevel(level);
    const entry: ProjectLogEntry = {
      at: now().toISOString(),
      level: normalizedLevel,
      source,
      message: stringifyMessage(message),
      details: normalizeDetails(details),
    };

    writeChain = writeChain
      .then(() => writeEntry(paths, entry))
      .catch((error: Error) => {
        onWriteError?.(error);
      });
    return writeChain;
  }

  // Writes one auth/login diagnostic entry to the dedicated login debug log.
  function loginDebug(message: unknown, details: unknown = null): Promise<void | ProjectLoggerPaths> {
    const entry: ProjectLogEntry = {
      at: now().toISOString(),
      level: 'debug',
      source,
      message: stringifyMessage(message),
      details: normalizeDetails(details),
    };

    writeChain = writeChain
      .then(() => writeLoginDebugEntry(paths, entry))
      .catch((error: Error) => {
        onWriteError?.(error);
      });
    return writeChain;
  }

  // Writes one raw verbose lifecycle entry when verbose logging is enabled.
  function verbose(entry: unknown): Promise<void | ProjectLoggerPaths> {
    if (!verboseEnabled) {
      return Promise.resolve();
    }

    writeChain = writeChain
      .then(() => writeVerboseEntry(paths, normalizeDetails(entry)))
      .catch((error: Error) => {
        onWriteError?.(error);
      });
    return writeChain;
  }

  return {
    paths,
    initialize,
    write,
    info(message: unknown, details: unknown = null): Promise<void | ProjectLoggerPaths> {
      return write('info', message, details);
    },
    debug(message: unknown, details: unknown = null): Promise<void | ProjectLoggerPaths> {
      return write('debug', message, details);
    },
    error(message: unknown, details: unknown = null): Promise<void | ProjectLoggerPaths> {
      return write('error', message, details);
    },
    loginDebug,
    verbose,
  };
}

// Resolves relative log directories against the repository root.
export function resolveLogDirectory(logDir: unknown, { repoRoot = process.cwd() }: ResolveLogDirectoryOptions = {}): string {
  const selected = typeof logDir === 'string' && logDir.trim() ? logDir.trim() : DEFAULT_LOG_DIR;
  return path.isAbsolute(selected) ? selected : path.resolve(repoRoot, selected);
}

// Appends one serialized entry to the matching level log and full log.
async function writeEntry(paths: ProjectLoggerPaths, entry: ProjectLogEntry): Promise<void> {
  await fs.mkdir(paths.directory, { recursive: true });
  const line = `${JSON.stringify(entry)}\n`;
  const targetPath = entry.level === 'debug'
    ? paths.debug
    : entry.level === 'error'
      ? paths.error
      : paths.regular;

  await Promise.all([
    fs.appendFile(targetPath, line, 'utf8'),
    fs.appendFile(paths.full, line, 'utf8'),
  ]);
}

// Appends one serialized auth/login diagnostic entry to logindebug.log.
async function writeLoginDebugEntry(paths: ProjectLoggerPaths, entry: ProjectLogEntry): Promise<void> {
  await fs.mkdir(paths.directory, { recursive: true });
  await fs.appendFile(paths.loginDebug, `${JSON.stringify(entry)}\n`, 'utf8');
}

// Appends one serialized verbose lifecycle entry to full_log_verbose.log.
async function writeVerboseEntry(paths: ProjectLoggerPaths, entry: unknown): Promise<void> {
  await fs.mkdir(paths.directory, { recursive: true });
  await fs.appendFile(paths.verbose, `${JSON.stringify(entry)}\n`, 'utf8');
}

// Ensures a log file exists without truncating existing contents.
async function touchFile(filePath: string): Promise<void> {
  await fs.writeFile(filePath, '', { encoding: 'utf8', flag: 'a' });
}

// Normalizes unknown level input to one of the supported project log levels.
function normalizeLevel(level: unknown): LogLevel {
  const normalized = String(level || 'info').toLowerCase();
  if (normalized === 'debug' || normalized === 'error') {
    return normalized;
  }
  return 'info';
}

// Converts arbitrary message values into a stable string.
function stringifyMessage(message: unknown): string {
  if (message instanceof Error) {
    return message.message;
  }
  return typeof message === 'string' ? message : JSON.stringify(message);
}

// Converts details into JSON-safe data while preserving useful error fields.
function normalizeDetails(details: unknown): unknown {
  if (details instanceof Error) {
    return serializeError(details);
  }
  if (!details || typeof details !== 'object') {
    return details;
  }
  return JSON.parse(JSON.stringify(details, (_key, value: unknown) => {
    if (value instanceof Error) {
      return serializeError(value);
    }
    return value;
  }));
}

// Captures the useful public fields from thrown errors.
function serializeError(error: Error & { code?: unknown }): SerializedError {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
  };
}

// Formats a timestamp for the per-start regular log file name.
function formatLogFileDate(date: Date | string | number): string {
  const value = date instanceof Date ? date : new Date(date);
  const pad = (part: number): string => String(part).padStart(2, '0');
  return [
    value.getFullYear(),
    pad(value.getMonth() + 1),
    pad(value.getDate()),
  ].join('-') + '_' + [
    pad(value.getHours()),
    pad(value.getMinutes()),
    pad(value.getSeconds()),
  ].join('-');
}
