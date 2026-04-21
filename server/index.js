import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  createSchedulerCapability,
  getOperationSupportLevel,
  isOperationExecutable,
  SCHEDULER_OPERATION_SUPPORT,
  SCHEDULER_SUPPORT_LEVELS,
} from '../shared/schedulerPlatformCapabilities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const defaultEnvFilePath = path.join(repoRoot, '.env');
const sqliteScriptPath = path.join(__dirname, 'scripts', 'sqlite_admin.py');
const windowsTaskSchedulerScriptPath = path.join(__dirname, 'scripts', 'windows_task_scheduler.ps1');
const schedulerHostPath = path.join(__dirname, 'scheduler_host.js');
const port = Number(process.env.PORT || 4301);
const schedulerTaskName = 'PhotoFrame-1PF-SchedulerHost';
const schedulerRuntimeDirectory = path.join(repoRoot, 'runtime_data', 'scheduler');
const schedulerStatusFilePath = path.join(schedulerRuntimeDirectory, 'host-status.json');
const runtimeTruthRelativePath = 'conf/runtime-truth.json';
const runtimeTruthFilePath = path.join(repoRoot, runtimeTruthRelativePath);
const schedulerSchemaVersion = 3;
const schedulerHeartbeatGraceSeconds = 20;
const schedulerTickSeconds = Object.freeze({
  pipeline: 5,
  playbackWatchdog: 5,
  screenWatchdog: 5,
  recoveryReconciliation: 15,
});
const databaseViewerRequiredTablesAuthority = Object.freeze({
  sourcePath: 'docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md',
  sourceLabel: 'Truth Surfaces',
  note: 'This is the current canonical target-state contract for required truth surfaces. It is not proof that those tables already exist in the current repo runtime.',
});
const databaseViewerRequiredTables = Object.freeze([
  'canonical_media_assets',
  'media_asset_variants',
  'address_cache',
  'parse_files_for_gps_queue',
  'geocode_queue',
  'slideshow_queue',
  'runtime_state',
  'action_runs',
  'system_logs',
]);
const databaseViewerLoggingCoverage = 'Captures database viewer queries and repo-local backend DB actions observed through this server while the logging session is active. It does not guarantee capture of every SQL statement or activity from external processes.';
let databaseViewerLoggingSession = null;

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
  'POST /api/database-viewer/verify': databaseViewerVerifyHandler,
  'POST /api/database-viewer/connect': databaseViewerConnectHandler,
  'GET /api/database-viewer/tables': databaseViewerTablesHandler,
  'POST /api/database-viewer/rows': databaseViewerRowsHandler,
  'POST /api/database-viewer/logging/start': databaseViewerLoggingStartHandler,
  'POST /api/database-viewer/logging/stop': databaseViewerLoggingStopHandler,
  'GET /api/runtime-truth': getRuntimeTruthHandler,
  'POST /api/runtime-truth': updateRuntimeTruthHandler,
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
  recordDatabaseViewerActivity({
    endpoint: '/api/init/database/status',
    operation: 'init_database_status',
    status: database.exists ? 'ok' : 'warning',
    message: messages[0],
    details: {
      databaseExists: database.exists,
      absolutePath: database.absolutePath,
      sizeBytes: database.sizeBytes,
    },
  });

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
    recordDatabaseViewerActivity({
      endpoint: '/api/init/database/inspect',
      operation: 'init_database_inspect',
      status: 'error',
      message: 'Inspect database failed because the SQLite file does not exist.',
      details: {
        databaseExists: false,
        absolutePath: database.absolutePath,
      },
    });
    throw new HttpError(404, 'database_missing', 'Cannot inspect the database because the DB file does not exist.', {
      database,
    });
  }

  const inspection = await runPythonJson(['inspect', database.absolutePath]);
  recordDatabaseViewerActivity({
    endpoint: '/api/init/database/inspect',
    operation: 'init_database_inspect',
    status: 'ok',
    message: `Inspected ${inspection.tableCount} table/view object(s).`,
    details: {
      tableCount: inspection.tableCount,
      absolutePath: database.absolutePath,
    },
  });
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
  recordDatabaseViewerActivity({
    endpoint: '/api/init/database/delete',
    operation: 'init_database_delete',
    status: removedPaths.length ? 'ok' : 'warning',
    message: removedPaths.length
      ? `Removed ${removedPaths.length} database artifact(s).`
      : 'Delete database was requested, but no DB artifacts were present.',
    details: {
      absolutePath: database.absolutePath,
      removedPaths,
    },
  });

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
  recordDatabaseViewerActivity({
    endpoint: '/api/init/database/recreate-empty',
    operation: 'init_database_recreate_empty',
    status: 'ok',
    message: 'Created an empty SQLite database file.',
    details: {
      absolutePath: database.absolutePath,
      existsAfter: created.exists,
      sizeBytesAfter: created.sizeBytes,
    },
  });
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
  return buildSchedulerRouteResponse(context, SCHEDULER_OPERATION_SUPPORT.install);
}

async function cronStatusHandler({ context }) {
  return buildSchedulerRouteResponse(context, SCHEDULER_OPERATION_SUPPORT.status);
}

async function printCronHandler({ context }) {
  return buildSchedulerRouteResponse(context, SCHEDULER_OPERATION_SUPPORT.print);
}

async function databaseViewerVerifyHandler({ context }) {
  const verification = await buildDatabaseViewerVerification(context);
  const messages = buildDatabaseViewerVerificationMessages(verification);
  recordDatabaseViewerActivity({
    endpoint: '/api/database-viewer/verify',
    operation: 'database_viewer_verify',
    status: verification.verificationPassed ? 'ok' : 'error',
    message: messages[0],
    details: {
      databaseExists: verification.database.exists,
      missingTables: verification.requiredTables.missing,
      requiredTableSource: verification.requiredTables.sourcePath,
    },
  });

  return {
    statusCode: 200,
    payload: {
      status: verification.verificationPassed ? 'ok' : 'error',
      messages,
      verificationPassed: verification.verificationPassed,
      database: verification.database,
      requiredTables: verification.requiredTables,
      availableObjects: verification.availableObjects,
      loggingCoverage: databaseViewerLoggingCoverage,
      schemaVersion: 1,
      verifiedAt: new Date().toISOString(),
    },
  };
}

async function databaseViewerConnectHandler({ context }) {
  const verification = await buildDatabaseViewerVerification(context);
  const connected = verification.verificationPassed;
  const messages = connected
    ? ['Database connect gate opened. Future table-browsing requests still run as fresh backend calls.']
    : buildDatabaseViewerVerificationMessages(verification);
  recordDatabaseViewerActivity({
    endpoint: '/api/database-viewer/connect',
    operation: 'database_viewer_connect',
    status: connected ? 'ok' : 'error',
    message: connected ? messages[0] : `Connect was blocked: ${messages[0]}`,
    details: {
      connected,
      databaseExists: verification.database.exists,
      missingTables: verification.requiredTables.missing,
    },
  });

  return {
    statusCode: 200,
    payload: {
      status: connected ? 'ok' : 'error',
      messages,
      connected,
      gate: 'logical_backend_authorization',
      database: verification.database,
      requiredTables: verification.requiredTables,
      loggingCoverage: databaseViewerLoggingCoverage,
      schemaVersion: 1,
      connectedAt: connected ? new Date().toISOString() : null,
    },
  };
}

async function databaseViewerTablesHandler({ context }) {
  const database = await buildDatabaseStatus(context);
  if (!database.exists) {
    recordDatabaseViewerActivity({
      endpoint: '/api/database-viewer/tables',
      operation: 'database_viewer_list_tables',
      status: 'error',
      message: 'Show tables failed because the SQLite file does not exist.',
      details: {
        databaseExists: false,
        absolutePath: database.absolutePath,
      },
    });
    throw new HttpError(404, 'database_missing', 'Cannot list tables because the DB file does not exist.', {
      database,
    });
  }

  const inspection = await runPythonJson(['inspect', database.absolutePath]);
  recordDatabaseViewerActivity({
    endpoint: '/api/database-viewer/tables',
    operation: 'database_viewer_list_tables',
    status: 'ok',
    message: `Loaded ${inspection.tableCount} table/view object(s).`,
    details: {
      tableCount: inspection.tableCount,
      absolutePath: database.absolutePath,
    },
  });

  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: [`Loaded ${inspection.tableCount} table/view object(s).`],
      database,
      objects: inspection.tables,
      sqlite: inspection.sqlite,
      loggingCoverage: databaseViewerLoggingCoverage,
      schemaVersion: 1,
    },
  };
}

async function databaseViewerRowsHandler({ body, context }) {
  const tableName = String(body?.tableName ?? '').trim();
  if (!tableName) {
    throw new HttpError(400, 'missing_table_name', 'tableName is required when loading database rows.');
  }

  const page = normalizeDatabaseViewerPage(body?.page);
  const pageSize = normalizeDatabaseViewerPageSize(body?.pageSize);
  const database = await buildDatabaseStatus(context);
  if (!database.exists) {
    recordDatabaseViewerActivity({
      endpoint: '/api/database-viewer/rows',
      operation: 'database_viewer_fetch_rows',
      status: 'error',
      message: `Load rows failed for ${tableName} because the SQLite file does not exist.`,
      details: {
        databaseExists: false,
        tableName,
        absolutePath: database.absolutePath,
      },
    });
    throw new HttpError(404, 'database_missing', 'Cannot load rows because the DB file does not exist.', {
      database,
    });
  }

  const table = await runPythonJson(['rows', database.absolutePath, tableName, String(page), String(pageSize)]);
  recordDatabaseViewerActivity({
    endpoint: '/api/database-viewer/rows',
    operation: 'database_viewer_fetch_rows',
    status: 'ok',
    message: `Loaded ${table.table.rowCount} row(s) from ${table.table.name} page ${table.table.page + 1}.`,
    details: {
      tableName: table.table.name,
      page: table.table.page,
      pageSize: table.table.pageSize,
      rowCount: table.table.rowCount,
      totalRows: table.table.totalRows,
      ordering: table.table.ordering,
      querySummary: table.table.querySummary,
    },
  });

  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: [`Loaded ${table.table.rowCount} row(s) from ${table.table.name}.`],
      database,
      table: table.table,
      loggingCoverage: databaseViewerLoggingCoverage,
      schemaVersion: 1,
    },
  };
}

async function databaseViewerLoggingStartHandler({ context }) {
  const database = await buildDatabaseStatus(context);
  if (databaseViewerLoggingSession) {
    return {
      statusCode: 200,
      payload: {
        status: 'warning',
        messages: ['Database logging is already active for this backend process.'],
        logging: buildDatabaseViewerLoggingState({ active: true }),
        database,
        schemaVersion: 1,
      },
    };
  }

  databaseViewerLoggingSession = {
    id: randomUUID(),
    startedAt: new Date().toISOString(),
    coverage: databaseViewerLoggingCoverage,
    entries: [],
  };
  recordDatabaseViewerActivity({
    endpoint: '/api/database-viewer/logging/start',
    operation: 'database_viewer_start_logging',
    status: 'ok',
    message: 'Database activity logging started for this backend process.',
    details: {
      databaseExists: database.exists,
      absolutePath: database.absolutePath,
      coverage: databaseViewerLoggingCoverage,
    },
  });

  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: ['Database activity logging started for this backend process.'],
      logging: buildDatabaseViewerLoggingState({ active: true }),
      database,
      schemaVersion: 1,
    },
  };
}

async function databaseViewerLoggingStopHandler() {
  if (!databaseViewerLoggingSession) {
    return {
      statusCode: 200,
      payload: {
        status: 'warning',
        messages: ['No active database logging session was running.'],
        logging: buildDatabaseViewerLoggingState({ active: false, entries: [] }),
        schemaVersion: 1,
      },
    };
  }

  recordDatabaseViewerActivity({
    endpoint: '/api/database-viewer/logging/stop',
    operation: 'database_viewer_stop_logging',
    status: 'ok',
    message: 'Database activity logging stopped for this backend process.',
    details: {
      capturedEventsBeforeStop: databaseViewerLoggingSession.entries.length,
    },
  });

  const stoppedSession = buildDatabaseViewerLoggingState({
    active: false,
    endedAt: new Date().toISOString(),
    entries: databaseViewerLoggingSession.entries,
    id: databaseViewerLoggingSession.id,
    startedAt: databaseViewerLoggingSession.startedAt,
    coverage: databaseViewerLoggingSession.coverage,
  });
  databaseViewerLoggingSession = null;

  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: [`Database activity logging stopped with ${stoppedSession.entryCount} captured event(s).`],
      logging: stoppedSession,
      schemaVersion: 1,
    },
  };
}

async function getRuntimeTruthHandler() {
  const truth = await readRuntimeTruthFile();
  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      sourcePath: runtimeTruthRelativePath,
      truth,
      schemaVersion: 1,
      persistedAt: new Date().toISOString(),
    },
  };
}

async function updateRuntimeTruthHandler({ body }) {
  const truth = normalizeRuntimeTruthPayload(body?.truth, { source: 'request' });
  await writeRuntimeTruthFile(truth);
  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      sourcePath: runtimeTruthRelativePath,
      truth,
      schemaVersion: 1,
      persistedAt: new Date().toISOString(),
    },
  };
}

async function buildSchedulerRouteResponse(context, operation) {
  const scheduler = await resolveSchedulerOperation(context, operation);
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
  const envFilePath = resolveEnvFilePath();
  let raw;
  try {
    raw = await fs.readFile(envFilePath, 'utf8');
  } catch (error) {
    throw new HttpError(500, 'env_file_read_failed', 'Failed to read the configured env file.', {
      envFilePath,
      message: error.message,
    });
  }
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

function resolveEnvFilePath() {
  const overridePath = process.env.INIT_ENV_FILE;
  if (!overridePath || overridePath.trim() === '') {
    return defaultEnvFilePath;
  }
  if (path.isAbsolute(overridePath)) {
    return overridePath;
  }
  return path.resolve(repoRoot, overridePath);
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

async function buildDatabaseViewerVerification(context) {
  const database = await buildDatabaseStatus(context);
  const requiredTables = {
    ...databaseViewerRequiredTablesAuthority,
    expected: [...databaseViewerRequiredTables],
    present: [],
    missing: [...databaseViewerRequiredTables],
  };

  if (!database.exists) {
    return {
      verificationPassed: false,
      database,
      requiredTables,
      availableObjects: [],
    };
  }

  const inspection = await runPythonJson(['inspect', database.absolutePath]);
  const presentTableNames = inspection.tables
    .filter((entry) => entry.kind === 'table')
    .map((entry) => entry.name);

  return {
    verificationPassed: databaseViewerRequiredTables.every((tableName) => presentTableNames.includes(tableName)),
    database,
    requiredTables: {
      ...requiredTables,
      present: presentTableNames.filter((tableName) => databaseViewerRequiredTables.includes(tableName)).sort(),
      missing: databaseViewerRequiredTables.filter((tableName) => !presentTableNames.includes(tableName)),
    },
    availableObjects: inspection.tables.map((entry) => ({
      name: entry.name,
      kind: entry.kind,
      columnCount: entry.columnCount,
    })),
  };
}

function buildDatabaseViewerVerificationMessages(verification) {
  if (!verification.database.exists) {
    return ['Database file does not exist, so required-table verification could not run.'];
  }

  if (!verification.requiredTables.missing.length) {
    return [`Database file exists and all ${verification.requiredTables.expected.length} required tables are present.`];
  }

  return [
    `Database verification failed because ${verification.requiredTables.missing.length} required table(s) are missing.`,
  ];
}

function buildDatabaseViewerLoggingState(options = {}) {
  const active = options.active === true;
  const entries = Array.isArray(options.entries)
    ? options.entries.map((entry) => structuredClone(entry))
    : active && databaseViewerLoggingSession
      ? databaseViewerLoggingSession.entries.map((entry) => structuredClone(entry))
      : [];
  const id = options.id ?? databaseViewerLoggingSession?.id ?? null;
  const startedAt = options.startedAt ?? databaseViewerLoggingSession?.startedAt ?? null;
  const endedAt = options.endedAt ?? null;
  const coverage = options.coverage ?? databaseViewerLoggingSession?.coverage ?? databaseViewerLoggingCoverage;

  return {
    active,
    sessionId: id,
    startedAt,
    endedAt,
    coverage,
    entryCount: entries.length,
    entries,
  };
}

function recordDatabaseViewerActivity(entry = {}) {
  if (!databaseViewerLoggingSession) {
    return;
  }

  databaseViewerLoggingSession.entries.push({
    id: randomUUID(),
    at: new Date().toISOString(),
    endpoint: entry.endpoint ?? 'unknown',
    operation: entry.operation ?? 'unknown',
    status: entry.status ?? 'info',
    message: entry.message ?? 'Database activity observed.',
    details: entry.details ?? null,
  });
}

function normalizeDatabaseViewerPage(value) {
  const page = Number(value ?? 0);
  if (!Number.isInteger(page) || page < 0) {
    throw new HttpError(400, 'invalid_page', 'page must be a zero-based integer.',
      { page: value });
  }
  return page;
}

function normalizeDatabaseViewerPageSize(value) {
  if (value === undefined) {
    return 50;
  }
  const pageSize = Number(value);
  if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > 100) {
    throw new HttpError(400, 'invalid_page_size', 'pageSize must be an integer between 1 and 100.', {
      pageSize: value,
    });
  }
  return pageSize;
}

function resolveRepoPath(relativeOrAbsolutePath) {
  if (path.isAbsolute(relativeOrAbsolutePath)) {
    return relativeOrAbsolutePath;
  }
  return path.resolve(repoRoot, relativeOrAbsolutePath);
}

async function readRuntimeTruthFile() {
  if (!(await fileExists(runtimeTruthFilePath))) {
    throw new HttpError(404, 'runtime_truth_missing', 'Runtime truth file does not exist yet.', {
      sourcePath: runtimeTruthRelativePath,
    });
  }

  let raw;
  try {
    raw = await fs.readFile(runtimeTruthFilePath, 'utf8');
  } catch (error) {
    throw new HttpError(500, 'runtime_truth_read_failed', 'Failed to read runtime truth file.', {
      sourcePath: runtimeTruthRelativePath,
      message: error.message,
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new HttpError(500, 'runtime_truth_invalid_json', 'Runtime truth file contains invalid JSON.', {
      sourcePath: runtimeTruthRelativePath,
      message: error.message,
    });
  }

  return normalizeRuntimeTruthPayload(parsed, { source: 'file' });
}

async function writeRuntimeTruthFile(truth) {
  try {
    await fs.mkdir(path.dirname(runtimeTruthFilePath), { recursive: true });
    const serialized = `${JSON.stringify(truth, null, 2)}\n`;
    await fs.writeFile(runtimeTruthFilePath, serialized, 'utf8');
  } catch (error) {
    throw new HttpError(500, 'runtime_truth_write_failed', 'Failed to write runtime truth file.', {
      sourcePath: runtimeTruthRelativePath,
      message: error.message,
    });
  }
}

function normalizeRuntimeTruthPayload(value, options = {}) {
  const source = options.source === 'file' ? 'file' : 'request';
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (source === 'file') {
      throw new HttpError(500, 'runtime_truth_invalid_payload', 'Runtime truth file must contain a JSON object.', {
        sourcePath: runtimeTruthRelativePath,
      });
    }
    throw new HttpError(400, 'invalid_runtime_truth_payload', 'Runtime truth payload must be a JSON object.', {
      expected: { truth: { sourceOfTruth: runtimeTruthRelativePath } },
    });
  }

  const truth = structuredClone(value);
  truth.sourceOfTruth = runtimeTruthRelativePath;
  return truth;
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

async function resolveSchedulerOperation(context, operation) {
  const capability = createSchedulerCapability({ nodePlatform: context.platform });
  const operationSupportLevel = getOperationSupportLevel(capability, operation);
  const definition = buildSchedulerDefinition(context, capability);

  if (!isOperationExecutable(capability, operation)) {
    return buildDeferredSchedulerPayload({
      context,
      capability,
      definition,
      operation,
      operationSupportLevel,
    });
  }

  if (operation === SCHEDULER_OPERATION_SUPPORT.install) {
    await fs.mkdir(definition.logDirectory, { recursive: true });
    await fs.mkdir(definition.runtimeDirectory, { recursive: true });
  }

  const task = await runWindowsSchedulerCommand(operation, definition);
  const host = await readSchedulerHostStatus();
  return buildSchedulerPayload({
    context,
    definition,
    capability,
    operation,
    operationSupportLevel,
    task,
    host,
    includeExportedXml: operation === SCHEDULER_OPERATION_SUPPORT.print,
  });
}

function buildSchedulerDefinition(context, capability) {
  const logDirectory = resolveRepoPath(context.envValues.LOG_DIR || 'runtime_data/logs');
  return {
    routeLabel: capability.routeCompatibility,
    taskName: schedulerTaskName,
    platformTarget: capability.schedulerTarget,
    schedulerMode: capability.schedulerMode,
    nodePath: context.nodePath,
    scriptPath: schedulerHostPath,
    repoRoot,
    logDirectory,
    runtimeDirectory: schedulerRuntimeDirectory,
    statusFilePath: schedulerStatusFilePath,
    username: context.username,
    cadence: schedulerTickSeconds,
    notes: capability.notes,
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

function buildDeferredSchedulerPayload({ context, capability, definition, operation, operationSupportLevel }) {
  const profileLabel = capability.profileLabel || 'current platform';
  const operationLabel = operation.toUpperCase();
  const messages = [
    `${operationLabel} is ${operationSupportLevel} for ${profileLabel} in this repository.`,
    'No scheduler installation or runtime service wiring was performed by this request.',
  ];

  if (operation === SCHEDULER_OPERATION_SUPPORT.status || operation === SCHEDULER_OPERATION_SUPPORT.print) {
    messages[1] = 'This response is informational and reports platform capability state only.';
  }

  return buildSchedulerPayload({
    context,
    definition,
    capability,
    operation,
    operationSupportLevel,
    task: {
      installed: false,
      supported: false,
      operation,
      supportLevel: operationSupportLevel,
    },
    host: {
      observed: false,
      state: 'not-implemented',
      message: 'Scheduler host status is unavailable because this platform path is not implemented in this repository.',
    },
    includeExportedXml: operation === SCHEDULER_OPERATION_SUPPORT.print,
    overrideStatus: 'warning',
    prependMessages: messages,
  });
}

function buildSchedulerPayload({
  context,
  definition,
  capability,
  operation,
  operationSupportLevel,
  task,
  host,
  includeExportedXml,
  overrideStatus,
  prependMessages = [],
}) {
  const installed = Boolean(task?.installed);
  const hostRunning = host?.state === 'running';
  const status = overrideStatus || (!installed ? 'warning' : hostRunning ? 'ok' : 'warning');
  const messages = [...prependMessages];

  if (operationSupportLevel === SCHEDULER_SUPPORT_LEVELS.supported) {
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
  }

  messages.push('Business services for pipeline, playback, screen, and recovery remain future implementation work.');

  const payload = {
    status,
    messages,
    routeCompatibility: definition.routeLabel,
    platform: context.platform,
    platformProfile: capability.profileId,
    platformProfileLabel: capability.profileLabel,
    schedulerTarget: definition.platformTarget,
    schedulerMode: definition.schedulerMode,
    supportLevel: capability.supportLevel,
    operation,
    operationSupportLevel,
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
    capability: {
      runtimePlatform: capability.runtimePlatform,
      profileId: capability.profileId,
      profileLabel: capability.profileLabel,
      platformFamily: capability.platformFamily,
      routeCompatibility: capability.routeCompatibility,
      schedulerTarget: capability.schedulerTarget,
      schedulerMode: capability.schedulerMode,
      supportLevel: capability.supportLevel,
      operationSupport: capability.operationSupport,
      notes: capability.notes,
    },
  };

  if (!includeExportedXml && payload.task && payload.task.exportedXml) {
    delete payload.task.exportedXml;
  }

  if (operationSupportLevel !== SCHEDULER_SUPPORT_LEVELS.supported) {
    payload.command = null;
    payload.taskName = null;
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
