import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createProjectLogger, DEFAULT_LOG_DIR, resolveLogDirectory } from './logging/projectLogger.ts';

type SchedulerTickName = 'pipeline' | 'playbackWatchdog' | 'screenWatchdog' | 'recoveryReconciliation';

type SchedulerHostMode = 'placeholder-services' | 'stopped';

type ParsedArgs = Record<string, string | true>;

interface SchedulerTicks extends Record<SchedulerTickName, number> {}

interface SchedulerHostState {
  pid: number;
  startedAt: string;
  repoRoot: string;
  mode: SchedulerHostMode;
  platformTarget: string;
  tickSeconds: Readonly<Record<SchedulerTickName, number>>;
  ticks: SchedulerTicks;
  lastTickAt: string | null;
  lastSummaryAt: string | null;
  notes: string[];
  stopReason?: string;
}

interface SchedulerStatusPayload extends SchedulerHostState {
  heartbeatAt: string;
}

interface SchedulerLogEntry {
  at: string;
  pid: number;
  event: string;
  message: string;
}

interface SchedulerLockFile {
  pid: number;
  acquiredAt: string;
  repoRoot: string;
}

const DEFAULT_TICKS: Readonly<Record<SchedulerTickName, number>> = Object.freeze({
  pipeline: 5,
  playbackWatchdog: 5,
  screenWatchdog: 5,
  recoveryReconciliation: 15,
});

const args = parseArgs(process.argv.slice(2));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(stringArg(args['repo-root']) || path.join(__dirname, '..'));
const runtimeDirectory = path.join(repoRoot, 'runtime_data', 'scheduler');
const logsDirectory = resolveLogDirectory(stringArg(args['log-dir']) || process.env.LOG_DIR || DEFAULT_LOG_DIR, { repoRoot });
const statusFilePath = path.join(runtimeDirectory, 'host-status.json');
const lockFilePath = path.join(runtimeDirectory, 'host-lock.json');
const logFilePath = path.join(logsDirectory, 'scheduler-host.ndjson');
const logger = createProjectLogger({
  repoRoot,
  logDir: logsDirectory,
  source: 'scheduler-host',
});

const state: SchedulerHostState = {
  pid: process.pid,
  startedAt: new Date().toISOString(),
  repoRoot,
  mode: 'placeholder-services',
  platformTarget: 'windows-task-scheduler-bootstrap',
  tickSeconds: DEFAULT_TICKS,
  ticks: {
    pipeline: 0,
    playbackWatchdog: 0,
    screenWatchdog: 0,
    recoveryReconciliation: 0,
  },
  lastTickAt: null,
  lastSummaryAt: null,
  notes: [
    'This host preserves the documented 5-second and 15-second timing model inside one long-running process.',
    'Business services for pipeline, playback, screen, and recovery are not implemented in this repository yet.',
  ],
};

let summaryTimer: ReturnType<typeof setInterval> | null = null;
const intervalHandles: Array<ReturnType<typeof setInterval>> = [];

try {
  await fs.mkdir(runtimeDirectory, { recursive: true });
  await fs.mkdir(logsDirectory, { recursive: true });
  await logger.initialize();

  await acquireLock();
  await appendLog('host-started', 'Scheduler host started.');
  await writeStatus();

  for (const [name, seconds] of Object.entries(DEFAULT_TICKS) as Array<[SchedulerTickName, number]>) {
    const handle = setInterval(() => {
      void recordTick(name);
    }, seconds * 1000);
    intervalHandles.push(handle);
  }

  summaryTimer = setInterval(() => {
    void appendSummary();
  }, 60 * 1000);

  process.on('SIGINT', () => void shutdown('sigint'));
  process.on('SIGTERM', () => void shutdown('sigterm'));
  process.on('beforeExit', () => void shutdown('before-exit'));
  process.on('uncaughtException', (error: Error) => {
    void appendLog('uncaught-exception', `Scheduler host crashed: ${error.message}`);
    void shutdown('uncaught-exception', 1);
  });
  process.on('unhandledRejection', (reason: unknown) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    void appendLog('unhandled-rejection', `Scheduler host rejected a promise: ${message}`);
    void shutdown('unhandled-rejection', 1);
  });

  await new Promise(() => {});
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await appendLog('startup-failed', `Scheduler host failed to start: ${message}`).catch(() => {});
  await releaseLock().catch(() => {});
  process.exitCode = 1;
}

async function recordTick(name: SchedulerTickName): Promise<void> {
  state.ticks[name] += 1;
  state.lastTickAt = new Date().toISOString();
  await writeStatus();
}

async function appendSummary(): Promise<void> {
  state.lastSummaryAt = new Date().toISOString();
  await writeStatus();
  await appendLog(
    'tick-summary',
    `Tick counters: pipeline=${state.ticks.pipeline}, playback=${state.ticks.playbackWatchdog}, screen=${state.ticks.screenWatchdog}, recovery=${state.ticks.recoveryReconciliation}.`,
  );
}

async function writeStatus(): Promise<void> {
  const payload: SchedulerStatusPayload = {
    ...state,
    heartbeatAt: new Date().toISOString(),
  };
  await fs.writeFile(statusFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function appendLog(event: string, message: string): Promise<void> {
  const entry: SchedulerLogEntry = {
    at: new Date().toISOString(),
    pid: process.pid,
    event,
    message,
  };
  await fs.appendFile(logFilePath, `${JSON.stringify(entry)}\n`, 'utf8');
  if (event.includes('failed') || event.includes('exception') || event.includes('rejection') || event.includes('crashed')) {
    await logger.error(message, { event, pid: process.pid });
    return;
  }
  await logger.info(message, { event, pid: process.pid });
}

async function acquireLock(): Promise<void> {
  const payload: SchedulerLockFile = {
    pid: process.pid,
    acquiredAt: new Date().toISOString(),
    repoRoot,
  };

  try {
    await fs.writeFile(lockFilePath, `${JSON.stringify(payload, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    return;
  } catch (error) {
    if (!isNodeErrorWithCode(error, 'EEXIST')) {
      throw error;
    }
  }

  const existing = await readJsonFile<Partial<SchedulerLockFile>>(lockFilePath);
  if (typeof existing?.pid === 'number' && processExists(existing.pid)) {
    throw new Error(`Scheduler host is already running with pid ${existing.pid}.`);
  }

  await fs.rm(lockFilePath, { force: true });
  await fs.writeFile(lockFilePath, `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
}

async function releaseLock(): Promise<void> {
  await fs.rm(lockFilePath, { force: true });
}

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function shutdown(reason: string, exitCode = 0): Promise<void> {
  if (summaryTimer) {
    clearInterval(summaryTimer);
    summaryTimer = null;
  }
  for (const handle of intervalHandles) {
    clearInterval(handle);
  }
  state.mode = 'stopped';
  state.stopReason = reason;
  await writeStatus().catch(() => {});
  await appendLog('host-stopped', `Scheduler host stopped (${reason}).`).catch(() => {});
  await releaseLock().catch(() => {});
  process.exit(exitCode);
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      continue;
    }
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

function stringArg(value: string | true | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isNodeErrorWithCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && (error as NodeJS.ErrnoException).code === code;
}
