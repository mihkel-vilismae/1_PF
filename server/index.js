import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const envFilePath = path.join(repoRoot, '.env');
const sqliteScriptPath = path.join(__dirname, 'scripts', 'sqlite_admin.py');
const windowsTaskSchedulerScriptPath = path.join(__dirname, 'scripts', 'windows_task_scheduler.ps1');
const schedulerHostPath = path.join(__dirname, 'scheduler_host.js');
const port = Number(process.env.PORT || 4301);
const schedulerTaskName = 'PhotoFrame-1PF-SchedulerHost';
const schedulerRuntimeDirectory = path.join(repoRoot, 'runtime_data', 'scheduler');
const schedulerStatusFilePath = path.join(schedulerRuntimeDirectory, 'host-status.json');
const schedulerSchemaVersion = 2;
const schedulerHeartbeatGraceSeconds = 20;
const schedulerTickSeconds = Object.freeze({
  pipeline: 5,
  playbackWatchdog: 5,
  screenWatchdog: 5,
  recoveryReconciliation: 15,
});

const envSchema = [
  { key: 'user', label: 'Account email', required: true, sensitive: true, kind: 'string' },
  { key: 'pw', label: 'Account password', required: true, sensitive: true, kind: 'string' },
  { key: 'DOWNLOAD_DIR', label: 'Download directory', required: true, kind: 'path' },
  { key: 'DB_PATH', label: 'SQLite database path', required: true, kind: 'path' },
  { key: 'LOG_DIR', label: 'Log directory', required: true, kind: 'path' },
  { key: 'ICLOUDPD_COOKIE_DIR', label: 'Cookie directory', required: true, kind: 'path' },
  { key: 'DOWNLOAD_RECENT', label: 'Recent download count', required: true, kind: 'integer' },
  { key: 'GEOCODE_LANGUAGE', label: 'Geocode language', required: true, kind: 'string' },
  { key: 'GEOCODE_BATCH_SIZE', label: 'Geocode batch size', required: true, kind: 'integer' },
  { key: 'GEONAMES_USERNAME', label: 'GeoNames username', required: false, kind: 'string' },
  { key: 'LOCK_TIMEOUT_SECONDS', label: 'Lock timeout', required: true, kind: 'integer' },
  { key: 'REGULAR_WORKER_STALE_SECONDS', label: 'Regular worker stale threshold', required: true, kind: 'integer' },
  { key: 'PLAYBACK_WORKER_STALE_SECONDS', label: 'Playback worker stale threshold', required: true, kind: 'integer' },
  { key: 'REGULAR_WORKER_HEARTBEAT_SECONDS', label: 'Regular worker heartbeat', required: true, kind: 'integer' },
  { key: 'PLAYBACK_WORKER_HEARTBEAT_SECONDS', label: 'Playback worker heartbeat', required: true, kind: 'integer' },
  { key: 'WORKER_LOCK_RECLAIM_CONFLICT_THRESHOLD', label: 'Lock reclaim conflict threshold', required: true, kind: 'integer' },
  { key: 'REGULAR_WORKER_FORCE_RECLAIM_AFTER_SECONDS', label: 'Regular worker force reclaim threshold', required: true, kind: 'integer' },
  { key: 'PLAYBACK_WORKER_FORCE_RECLAIM_AFTER_SECONDS', label: 'Playback worker force reclaim threshold', required: true, kind: 'integer' },
  { key: 'GEOCODE_CACHE_KEY_DECIMALS', label: 'Geocode cache precision', required: true, kind: 'integer' },
  { key: 'UNRESOLVED_ASSET_POLICY', label: 'Unresolved asset policy', required: true, kind: 'string' },
  { key: 'PLAYBACK_RESTART_POLICY', label: 'Playback restart policy', required: true, kind: 'string' },
  { key: 'VIDEO_SHOWN_POLICY', label: 'Video shown policy', required: true, kind: 'string' },
  { key: 'CLEANUP_ENABLED', label: 'Cleanup enabled', required: true, kind: 'boolean' },
  { key: 'MEDIA_RETENTION_DAYS', label: 'Media retention days', required: true, kind: 'integer' },
  { key: 'LOG_RETENTION_DAYS', label: 'Log retention days', required: true, kind: 'integer' },
  { key: 'PLAYBACK_LEASE_SECONDS', label: 'Playback lease seconds', required: true, kind: 'integer' },
];

const routes = {
  'POST /api/init/verify-env': verifyEnvHandler,
  'GET /api/init/database/status': databaseStatusHandler,
  'POST /api/init/database/inspect': inspectDatabaseHandler,
  'POST /api/init/database/delete': deleteDatabaseHandler,
  'POST /api/init/database/recreate-empty': recreateEmptyDatabaseHandler,
  'POST /api/init/cron/install': installCronHandler,
  'GET /api/init/cron/status': cronStatusHandler,
  'GET /api/init/cron/print': printCronHandler,
};

const server = createServer(async (request, response) => {
  try {
    if (!request.url) {
      sendJson(response, 400, errorPayload('missing_request_url', 'Request URL was not provided.'));
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
    const routeKey = `${request.method || 'GET'} ${url.pathname}`;
    const handler = routes[routeKey];

    if (!handler) {
      sendJson(response, 404, errorPayload('not_found', `No handler exists for ${routeKey}.`));
      return;
    }

    const body = await readJsonBody(request);
    const context = await buildRequestContext();
    const result = await handler({ request, response, url, body, context });
    sendJson(response, result.statusCode, result.payload);
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const code = error instanceof HttpError ? error.code : 'internal_error';
    const details = error instanceof HttpError ? error.details : undefined;
    sendJson(response, statusCode, errorPayload(code, error.message, details));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Init API server listening on http://127.0.0.1:${port}`);
});

async function verifyEnvHandler({ context }) {
  const checks = envSchema.map((entry) => buildEnvCheck(entry, context.envValues));
  const missingRequired = checks.filter((check) => check.required && !check.present);
  const invalidRequired = checks.filter((check) => check.required && check.present && !check.valid);
  const optionalWarnings = checks.filter((check) => !check.required && check.present && !check.valid);

  const messages = [];
  if (missingRequired.length) {
    messages.push(`${missingRequired.length} required key(s) are missing.`);
  }
  if (invalidRequired.length) {
    messages.push(`${invalidRequired.length} required key(s) are present but invalid.`);
  }
  if (optionalWarnings.length) {
    messages.push(`${optionalWarnings.length} optional key(s) need attention.`);
  }
  if (!messages.length) {
    messages.push(`Validated ${checks.filter((check) => check.required).length} required key(s).`);
  }

  const status = missingRequired.length || invalidRequired.length ? 'error' : optionalWarnings.length ? 'warning' : 'ok';
  return {
    statusCode: 200,
    payload: {
      status,
      messages,
      checks,
      schemaVersion: 1,
      verifiedAt: new Date().toISOString(),
    },
  };
}

async function databaseStatusHandler({ context }) {
  const database = await buildDatabaseStatus(context);
  const messages = database.exists
    ? ['Database file exists and can be inspected.']
    : ['Database file does not exist yet. Use recreate-empty to create it.'];

  return {
    statusCode: 200,
    payload: {
      status: database.exists ? 'ok' : 'warning',
      messages,
      database,
      schemaVersion: 1,
    },
  };
}

async function inspectDatabaseHandler({ context }) {
  const database = await buildDatabaseStatus(context);
  if (!database.exists) {
    throw new HttpError(404, 'database_missing', 'Cannot inspect the database because the DB file does not exist.', {
      database,
    });
  }

  const inspection = await runPythonJson(['inspect', database.absolutePath]);
  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: [`Inspected ${inspection.tableCount} table/view object(s).`],
      database,
      inspection,
      schemaVersion: 1,
    },
  };
}

async function deleteDatabaseHandler({ body, context }) {
  ensureConfirmed(body, 'delete-db');
  const database = await buildDatabaseStatus(context);
  const removedPaths = [];
  const candidatePaths = [database.absolutePath, `${database.absolutePath}-wal`, `${database.absolutePath}-shm`];

  for (const candidate of candidatePaths) {
    if (await fileExists(candidate)) {
      await fs.rm(candidate, { force: true });
      removedPaths.push(candidate);
    }
  }

  return {
    statusCode: 200,
    payload: {
      status: removedPaths.length ? 'ok' : 'warning',
      messages: removedPaths.length
        ? [`Removed ${removedPaths.length} database artifact(s).`]
        : ['No database artifacts were present, so nothing was deleted.'],
      confirmed: true,
      database: {
        ...database,
        existsAfter: false,
      },
      removedPaths,
      schemaVersion: 1,
    },
  };
}

async function recreateEmptyDatabaseHandler({ body, context }) {
  ensureConfirmed(body, 'recreate-db');
  const database = await buildDatabaseStatus(context);
  const candidatePaths = [database.absolutePath, `${database.absolutePath}-wal`, `${database.absolutePath}-shm`];

  for (const candidate of candidatePaths) {
    if (await fileExists(candidate)) {
      await fs.rm(candidate, { force: true });
    }
  }

  const created = await runPythonJson(['recreate', database.absolutePath]);
  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: ['Created an empty SQLite database file.'],
      confirmed: true,
      database: {
        ...database,
        existsAfter: created.exists,
        sizeBytesAfter: created.sizeBytes,
      },
      schemaVersion: 1,
    },
  };
}

async function installCronHandler({ context }) {
  const scheduler = await installScheduler(context);
  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: [
        'Installed the Windows Task Scheduler bootstrap task for the repo-local scheduler host.',
        'The scheduler host preserves the documented 5-second timing model inside one long-running process.',
      ],
      scheduler,
      schemaVersion: schedulerSchemaVersion,
    },
  };
}

async function cronStatusHandler({ context }) {
  const scheduler = await getSchedulerStatus(context);
  return {
    statusCode: 200,
    payload: {
      status: scheduler.status,
      messages: scheduler.messages,
      scheduler,
      schemaVersion: schedulerSchemaVersion,
    },
  };
}

async function printCronHandler({ context }) {
  const scheduler = await printSchedulerDefinition(context);
  return {
    statusCode: 200,
    payload: {
      status: scheduler.status,
      messages: scheduler.messages,
      scheduler,
      schemaVersion: schedulerSchemaVersion,
    },
  };
}

async function buildRequestContext() {
  const envValues = await loadEnvValues();
  return {
    envValues,
    platform: process.platform,
    nodePath: process.execPath,
    username: process.env.USERNAME || process.env.USER || null,
  };
}

async function loadEnvValues() {
  const raw = await fs.readFile(envFilePath, 'utf8');
  const values = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1);
    values[key] = value;
  }
  return values;
}

function buildEnvCheck(entry, envValues) {
  const rawValue = envValues[entry.key];
  const present = rawValue !== undefined;
  const nonEmpty = present && rawValue.trim() !== '';
  const validation = validateEnvValue(entry, rawValue);
  return {
    key: entry.key,
    label: entry.label,
    required: entry.required,
    present,
    valid: validation.valid,
    severity: entry.required ? validation.valid ? 'info' : 'error' : validation.valid ? 'info' : 'warning',
    message: validation.message,
    valuePreview: present ? previewValue(entry, rawValue) : null,
    details: buildEnvCheckDetails(entry, rawValue, nonEmpty),
  };
}

function buildEnvCheckDetails(entry, rawValue, nonEmpty) {
  if (entry.kind === 'path' && rawValue) {
    const absolutePath = resolveRepoPath(rawValue);
    return {
      kind: entry.kind,
      absolutePath,
      exists: existsSync(absolutePath),
      parentDirectory: path.dirname(absolutePath),
    };
  }

  return {
    kind: entry.kind,
    nonEmpty,
  };
}

function validateEnvValue(entry, rawValue) {
  if (rawValue === undefined) {
    return { valid: !entry.required, message: entry.required ? 'Missing required key.' : 'Optional key is not set.' };
  }
  if (rawValue.trim() === '') {
    return { valid: !entry.required, message: entry.required ? 'Required key is empty.' : 'Optional key is empty.' };
  }

  if (entry.kind === 'integer') {
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return { valid: false, message: 'Expected a positive integer.' };
    }
  }

  if (entry.kind === 'boolean') {
    if (!['true', 'false'].includes(rawValue.trim().toLowerCase())) {
      return { valid: false, message: 'Expected "true" or "false".' };
    }
  }

  return { valid: true, message: 'Value is present and structurally valid.' };
}

function previewValue(entry, rawValue) {
  if (entry.sensitive) {
    return '***redacted***';
  }
  if (entry.kind === 'path') {
    return rawValue;
  }
  if (rawValue.length <= 16) {
    return rawValue;
  }
  return `${rawValue.slice(0, 6)}...${rawValue.slice(-4)}`;
}

async function buildDatabaseStatus(context) {
  const dbPath = context.envValues.DB_PATH;
  if (!dbPath) {
    throw new HttpError(500, 'missing_db_path', 'DB_PATH is required before database actions can run.');
  }

  const absolutePath = resolveRepoPath(dbPath);
  const exists = await fileExists(absolutePath);
  const stats = exists ? await fs.stat(absolutePath) : null;
  const parentDirectory = path.dirname(absolutePath);

  return {
    kind: 'sqlite',
    configuredPath: dbPath,
    absolutePath,
    exists,
    sizeBytes: stats?.size ?? 0,
    parentDirectory,
    parentDirectoryExists: await fileExists(parentDirectory),
    inspectRuntime: 'python sqlite3 bridge',
  };
}

function resolveRepoPath(relativeOrAbsolutePath) {
  if (path.isAbsolute(relativeOrAbsolutePath)) {
    return relativeOrAbsolutePath;
  }
  return path.resolve(repoRoot, relativeOrAbsolutePath);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new HttpError(400, 'invalid_json', 'Request body must be valid JSON.', { raw });
  }
}

async function runPythonJson(args) {
  const { stdout, stderr, code } = await runProcess('python', [sqliteScriptPath, ...args]);
  if (code !== 0) {
    throw new HttpError(500, 'python_bridge_failed', 'Python bridge command failed.', {
      stderr: stderr.trim(),
      stdout: stdout.trim(),
    });
  }

  try {
    return JSON.parse(stdout.trim());
  } catch (error) {
    throw new HttpError(500, 'python_bridge_invalid_json', 'Python bridge returned invalid JSON.', {
      stdout: stdout.trim(),
    });
  }
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => reject(error));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function ensureConfirmed(body, expectedAction) {
  if (!body || body.confirm !== true || body.action !== expectedAction) {
    throw new HttpError(400, 'missing_confirmation', `The ${expectedAction} action requires an explicit confirmation payload.`, {
      expected: { confirm: true, action: expectedAction },
    });
  }
}

function cronUnsupportedError(context) {
  return new HttpError(
    501,
    'cron_contract_blocked',
    'The legacy /api/init/cron/* endpoints are only implemented for the Windows Task Scheduler bootstrap path in this repository.',
    {
      platform: context.platform,
      blockers: [
        'This repository only implements the Windows bootstrap path today.',
        'Standard cron is unavailable on Windows and the documented 5-second cadence cannot be expressed directly by Task Scheduler repetition either.',
      ],
      nextStep: 'Use the Windows Task Scheduler bootstrap host on win32 or add another platform-specific scheduler implementation.',
    },
  );
}

async function installScheduler(context) {
  const definition = ensureWindowsSchedulerContext(context);
  await fs.mkdir(definition.logDirectory, { recursive: true });
  await fs.mkdir(definition.runtimeDirectory, { recursive: true });

  const task = await runWindowsSchedulerCommand('install', definition);
  const host = await readSchedulerHostStatus();
  return buildSchedulerPayload({
    context,
    definition,
    task,
    host,
    includeExportedXml: false,
  });
}

async function getSchedulerStatus(context) {
  const definition = ensureWindowsSchedulerContext(context);
  const task = await runWindowsSchedulerCommand('status', definition);
  const host = await readSchedulerHostStatus();
  return buildSchedulerPayload({
    context,
    definition,
    task,
    host,
    includeExportedXml: false,
  });
}

async function printSchedulerDefinition(context) {
  const definition = ensureWindowsSchedulerContext(context);
  const task = await runWindowsSchedulerCommand('print', definition);
  const host = await readSchedulerHostStatus();
  return buildSchedulerPayload({
    context,
    definition,
    task,
    host,
    includeExportedXml: true,
  });
}

function ensureWindowsSchedulerContext(context) {
  if (context.platform !== 'win32') {
    throw cronUnsupportedError(context);
  }
  return buildSchedulerDefinition(context);
}

function buildSchedulerDefinition(context) {
  const logDirectory = resolveRepoPath(context.envValues.LOG_DIR || 'runtime_data/logs');
  return {
    routeLabel: '/api/init/cron/*',
    taskName: schedulerTaskName,
    platformTarget: 'windows-task-scheduler',
    schedulerMode: 'bootstrap-host',
    nodePath: context.nodePath,
    scriptPath: schedulerHostPath,
    repoRoot,
    logDirectory,
    runtimeDirectory: schedulerRuntimeDirectory,
    statusFilePath: schedulerStatusFilePath,
    username: context.username,
    cadence: schedulerTickSeconds,
    notes: [
      'The existing cron endpoint names are kept for compatibility with the current frontend contract.',
      'On Windows, installation creates an AtLogOn Task Scheduler task that starts one long-running Node scheduler host.',
      'The scheduler host preserves the 5-second and 15-second timing model because Task Scheduler repetition intervals have a 1-minute minimum.',
      'The host currently emits heartbeat/tick state only; runtime business services are still future work.',
    ],
  };
}

async function runWindowsSchedulerCommand(operation, definition) {
  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    windowsTaskSchedulerScriptPath,
    '-Operation',
    operation,
    '-TaskName',
    definition.taskName,
    '-NodePath',
    definition.nodePath,
    '-ScriptPath',
    definition.scriptPath,
    '-RepoRoot',
    definition.repoRoot,
  ];
  const { stdout, stderr, code } = await runProcess('powershell.exe', args);
  const parsed = parseJsonOutput(stdout);

  if (code !== 0) {
    throw new HttpError(500, 'windows_scheduler_failed', 'Windows Task Scheduler command failed.', {
      operation,
      stderr: stderr.trim() || null,
      stdout: stdout.trim() || null,
      scriptError: parsed?.message || null,
    });
  }

  return parsed;
}

function parseJsonOutput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new HttpError(500, 'invalid_scheduler_json', 'Scheduler helper returned invalid JSON.', {
      stdout: trimmed,
    });
  }
}

async function readSchedulerHostStatus() {
  if (!(await fileExists(schedulerStatusFilePath))) {
    return {
      observed: false,
      state: 'not-observed',
      statusFilePath: schedulerStatusFilePath,
      message: 'The scheduler host has not written a status file yet.',
    };
  }

  try {
    const raw = await fs.readFile(schedulerStatusFilePath, 'utf8');
    const payload = JSON.parse(raw);
    const heartbeatAt = payload.heartbeatAt || payload.lastTickAt || null;
    const heartbeatAgeSeconds = heartbeatAt ? Math.max(0, Math.round((Date.now() - Date.parse(heartbeatAt)) / 1000)) : null;
    return {
      observed: true,
      state: heartbeatAgeSeconds !== null && heartbeatAgeSeconds <= schedulerHeartbeatGraceSeconds ? 'running' : 'stale',
      heartbeatAgeSeconds,
      statusFilePath: schedulerStatusFilePath,
      payload,
    };
  } catch (error) {
    return {
      observed: true,
      state: 'invalid-status-file',
      statusFilePath: schedulerStatusFilePath,
      message: error.message,
    };
  }
}

function buildSchedulerPayload({ context, definition, task, host, includeExportedXml }) {
  const installed = Boolean(task?.installed);
  const hostRunning = host?.state === 'running';
  const status = !installed ? 'warning' : hostRunning ? 'ok' : 'warning';
  const messages = [];

  if (!installed) {
    messages.push('Scheduler bootstrap task is not installed for the current Windows user.');
  } else {
    messages.push('Scheduler bootstrap task is installed through Windows Task Scheduler.');
  }

  if (hostRunning) {
    messages.push('The repo-local scheduler host is emitting fresh heartbeats.');
  } else if (host?.observed) {
    messages.push(`The scheduler host status file is present but not fresh (${host.state}).`);
  } else {
    messages.push('No scheduler host heartbeat has been observed yet.');
  }

  messages.push('Business services for pipeline, playback, screen, and recovery remain future implementation work.');

  const payload = {
    status,
    messages,
    routeCompatibility: definition.routeLabel,
    platform: context.platform,
    schedulerTarget: definition.platformTarget,
    schedulerMode: definition.schedulerMode,
    taskName: definition.taskName,
    cadence: definition.cadence,
    command: {
      executable: definition.nodePath,
      arguments: [definition.scriptPath, '--repo-root', definition.repoRoot],
      workingDirectory: definition.repoRoot,
    },
    task: task ?? {
      installed: false,
    },
    host,
    notes: definition.notes,
  };

  if (!includeExportedXml && payload.task?.exportedXml) {
    delete payload.task.exportedXml;
  }

  return payload;
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
}

function errorPayload(code, message, details) {
  return {
    status: 'error',
    error: code,
    message,
    details,
    schemaVersion: 1,
  };
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

class HttpError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
