import { promises as fs } from 'node:fs';
import path from 'node:path';

export const DEFAULT_LOG_DIR = 'logs';

const LEVEL_FILE_NAMES = Object.freeze({
  error: 'error.log',
  debug: 'debug.log',
});

export function createProjectLogger({
  repoRoot = process.cwd(),
  logDir = DEFAULT_LOG_DIR,
  now = () => new Date(),
  source = 'server',
  onWriteError = null,
} = {}) {
  const logDirectory = resolveLogDirectory(logDir, { repoRoot });
  const regularLogFileName = `log_${formatLogFileDate(now())}.log`;
  const paths = {
    directory: logDirectory,
    error: path.join(logDirectory, LEVEL_FILE_NAMES.error),
    debug: path.join(logDirectory, LEVEL_FILE_NAMES.debug),
    regular: path.join(logDirectory, regularLogFileName),
    full: path.join(logDirectory, 'full_log.log'),
  };

  let initialized = false;
  let writeChain = Promise.resolve();

  async function initialize() {
    if (initialized) {
      return paths;
    }

    await fs.mkdir(paths.directory, { recursive: true });
    await Promise.all([
      touchFile(paths.error),
      touchFile(paths.debug),
      touchFile(paths.regular),
      touchFile(paths.full),
    ]);
    initialized = true;
    return paths;
  }

  function write(level, message, details = null) {
    const normalizedLevel = normalizeLevel(level);
    const entry = {
      at: now().toISOString(),
      level: normalizedLevel,
      source,
      message: stringifyMessage(message),
      details: normalizeDetails(details),
    };

    writeChain = writeChain
      .then(() => writeEntry(paths, entry))
      .catch((error) => {
        onWriteError?.(error);
      });
    return writeChain;
  }

  return {
    paths,
    initialize,
    write,
    info(message, details = null) {
      return write('info', message, details);
    },
    debug(message, details = null) {
      return write('debug', message, details);
    },
    error(message, details = null) {
      return write('error', message, details);
    },
  };
}

export function resolveLogDirectory(logDir, { repoRoot = process.cwd() } = {}) {
  const selected = typeof logDir === 'string' && logDir.trim() ? logDir.trim() : DEFAULT_LOG_DIR;
  return path.isAbsolute(selected) ? selected : path.resolve(repoRoot, selected);
}

async function writeEntry(paths, entry) {
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

async function touchFile(filePath) {
  await fs.writeFile(filePath, '', { encoding: 'utf8', flag: 'a' });
}

function normalizeLevel(level) {
  const normalized = String(level || 'info').toLowerCase();
  if (normalized === 'debug' || normalized === 'error') {
    return normalized;
  }
  return 'info';
}

function stringifyMessage(message) {
  if (message instanceof Error) {
    return message.message;
  }
  return typeof message === 'string' ? message : JSON.stringify(message);
}

function normalizeDetails(details) {
  if (details instanceof Error) {
    return serializeError(details);
  }
  if (!details || typeof details !== 'object') {
    return details;
  }
  return JSON.parse(JSON.stringify(details, (_key, value) => {
    if (value instanceof Error) {
      return serializeError(value);
    }
    return value;
  }));
}

function serializeError(error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
  };
}

function formatLogFileDate(date) {
  const value = date instanceof Date ? date : new Date(date);
  const pad = (part) => String(part).padStart(2, '0');
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
