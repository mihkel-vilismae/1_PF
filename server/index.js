import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createAuthRoutes } from './auth/authRoutes.js';
import { createDatabaseService } from './database/databaseService.js';
import { attachSafeAuthRuntimeTruth } from './auth/authRuntimeTruth.js';
import { createProjectLogger, DEFAULT_LOG_DIR } from './logging/projectLogger.js';
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
const generatedTestDataDirectory = path.join(repoRoot, 'generated_test_data');
const defaultEnvFilePath = path.join(repoRoot, '.env');
const windowsTaskSchedulerScriptPath = path.join(__dirname, 'scripts', 'windows_task_scheduler.ps1');
const schedulerHostPath = path.join(__dirname, 'scheduler_host.js');
const port = Number(process.env.PORT || 4301);
const logger = createProjectLogger({
  repoRoot,
  logDir: await resolveInitialLogDirectory(),
  source: 'init-api',
  onWriteError: reportLoggerWriteError,
});
await logger.initialize().catch(reportLoggerWriteError);
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
const supportedMediaExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.webp',
  '.tif',
  '.tiff',
  '.heic',
  '.heif',
  '.mp4',
  '.mov',
  '.m4v',
  '.avi',
  '.mkv',
  '.webm',
  '.wmv',
  '.mpeg',
  '.mpg',
]);
let databaseViewerLoggingSession = null;

const authRouteHandlers = createAuthRoutes({ getAuthReadinessChecks });

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
  'GET /api/auth/status': authRouteHandlers.statusHandler,
  'POST /api/auth/run': authRouteHandlers.runHandler,
  'POST /api/auth/2fa/submit': authRouteHandlers.twoFactorSubmitHandler,
  'POST /api/auth/reset': authRouteHandlers.resetHandler,
  'POST /api/auth/logout': authRouteHandlers.logoutHandler,
  'POST /api/auth/resume': authRouteHandlers.resumeHandler,
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
  'POST /api/runtime/download/run': runtimeDownloadRunHandler,
  'POST /api/runtime/index/run': runtimeIndexRunHandler,
  'POST /api/runtime/gps/run': runtimeGpsRunHandler,
  'POST /api/runtime/geocode/run': runtimeGeocodeRunHandler,
  'POST /api/runtime/queue/prepare': runtimeQueuePrepareHandler,
  'POST /api/runtime/playback/select-current': runtimePlaybackSelectCurrentHandler,
  // Wave E orchestration endpoints
  'POST /api/runtime/orchestration/run': runtimeOrchestrationRunHandler,
  'GET /api/runtime/orchestration/current': runtimeOrchestrationCurrentHandler,
  'GET /api/runtime/orchestration/last': runtimeOrchestrationLastHandler,
  'GET /api/runtime-truth': getRuntimeTruthHandler,
  'POST /api/runtime-truth': updateRuntimeTruthHandler,
};

const server = createServer(async (request, response) => {
  const startedAt = Date.now();
  let routeKey = `${request.method || 'GET'} ${request.url || ''}`;
  let url = null;
  try {
    if (!request.url) {
      sendJson(response, 400, errorPayload('missing_request_url', 'Request URL was not provided.'));
      void logRequest({ request, routeKey, statusCode: 400, startedAt });
      return;
    }

    url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
    routeKey = `${request.method || 'GET'} ${url.pathname}`;
    const handler = routes[routeKey];

    if (!handler) {
      sendJson(response, 404, errorPayload('not_found', `No handler exists for ${routeKey}.`));
      void logRequest({ request, url, routeKey, statusCode: 404, startedAt });
      return;
    }

    const body = await readJsonBody(request);
    const context = await buildRequestContext();
    const result = await handler({ request, response, url, body, context });
    sendJson(response, result.statusCode, result.payload);
    void logRequest({ request, url, routeKey, statusCode: result.statusCode, startedAt });
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const code = error instanceof HttpError ? error.code : 'internal_error';
    const details = error instanceof HttpError ? error.details : undefined;
    void logger.error('HTTP request failed.', {
      method: request.method || 'GET',
      path: url?.pathname || request.url || null,
      routeKey,
      statusCode,
      code,
      durationMs: Date.now() - startedAt,
      error,
    });
    sendJson(response, statusCode, errorPayload(code, error.message, details));
  }
});

server.listen(port, '127.0.0.1', () => {
  const message = `Init API server listening on http://127.0.0.1:${port}`;
  console.log(message);
  void logger.info(message, { port, url: `http://127.0.0.1:${port}` });
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

  // Additional validation: ensure test environment paths do not overlap with real paths.
  // According to the authoritative spec, the .env must define separate test paths and
  // `.env` verification must fail if any test path overlaps its corresponding real path.
  // A test path key is considered to start with the prefix `TEST_` followed by the real key
  // (e.g. `TEST_DOWNLOAD_DIR` pairs with `DOWNLOAD_DIR`). We compare absolute paths and
  // reject if one is equal to or contains the other.
  const envValues = context.envValues;
  const overlapPairs = [];
  for (const testKey of Object.keys(envValues)) {
    if (!testKey.startsWith('TEST_')) continue;
    const baseKey = testKey.slice(5);
    const testRaw = envValues[testKey];
    const realRaw = envValues[baseKey];
    if (!testRaw || !realRaw) {
      continue;
    }
    // Compute absolute paths relative to repo root when needed.
    const testAbs = resolveRepoPath(testRaw.trim());
    const realAbs = resolveRepoPath(realRaw.trim());
    // Normalize case for comparison on case‑insensitive platforms.
    const normTest = path.normalize(testAbs);
    const normReal = path.normalize(realAbs);
    const lowerTest = normTest.toLowerCase();
    const lowerReal = normReal.toLowerCase();
    const sep = path.sep;
    // Determine if the two paths overlap. Either they are identical or one is a prefix of the other.
    const overlaps =
      lowerTest === lowerReal ||
      lowerTest.startsWith(lowerReal + sep) ||
      lowerReal.startsWith(lowerTest + sep);
    if (overlaps) {
      overlapPairs.push({ testKey, realKey: baseKey, testPath: normTest, realPath: normReal });
    }
  }
  if (overlapPairs.length) {
    messages.push('Detected overlap between test and real environment paths.');
  }
  // Determine overall status. Any overlaps or missing/invalid values result in an error.
  let status;
  if (missingRequired.length || invalidRequired.length || overlapPairs.length) {
    status = 'error';
  } else if (optionalWarnings.length) {
    status = 'warning';
  } else {
    status = 'ok';
  }
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
  let inspected;
  try {
    inspected = await inspectDatabase(context);
  } catch (error) {
    if (error instanceof HttpError && error.code === 'database_missing') {
      recordDatabaseViewerActivity({
        endpoint: '/api/init/database/inspect',
        operation: 'init_database_inspect',
        status: 'error',
        message: 'Inspect database failed because the SQLite file does not exist.',
        details: {
          databaseExists: false,
          absolutePath: error.details?.database?.absolutePath,
        },
      });
    }
    throw error;
  }
  const { database, inspection } = inspected;
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
  const { database, removedPaths } = await deleteDatabaseArtifacts(context);
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
  const { database, created } = await recreateEmptyDatabase(context);
  recordDatabaseViewerActivity({
    endpoint: '/api/init/database/recreate-empty',
    operation: 'init_database_recreate_empty',
    status: 'ok',
    message: 'Recreated SQLite database and applied canonical schema tables.',
    details: {
      absolutePath: database.absolutePath,
      existsAfter: created.exists,
      sizeBytesAfter: created.sizeBytes,
      schemaBootstrap: created.schemaBootstrap ?? null,
    },
  });
  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: ['Recreated SQLite database and applied canonical schema tables.'],
      confirmed: true,
      database: {
        ...database,
        existsAfter: created.exists,
        sizeBytesAfter: created.sizeBytes,
      },
      schemaBootstrap: created.schemaBootstrap ?? null,
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
      loggingCoverage: getDatabaseViewerLoggingCoverage(),
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
      loggingCoverage: getDatabaseViewerLoggingCoverage(),
      schemaVersion: 1,
      connectedAt: connected ? new Date().toISOString() : null,
    },
  };
}

async function databaseViewerTablesHandler({ context }) {
  let listed;
  try {
    listed = await listDatabaseViewerTables(context);
  } catch (error) {
    if (error instanceof HttpError && error.code === 'database_missing') {
      recordDatabaseViewerActivity({
        endpoint: '/api/database-viewer/tables',
        operation: 'database_viewer_list_tables',
        status: 'error',
        message: 'Show tables failed because the SQLite file does not exist.',
        details: {
          databaseExists: false,
          absolutePath: error.details?.database?.absolutePath,
        },
      });
    }
    throw error;
  }
  const { database, inspection } = listed;
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
      loggingCoverage: getDatabaseViewerLoggingCoverage(),
      schemaVersion: 1,
    },
  };
}

async function databaseViewerRowsHandler({ body, context }) {
  let loaded;
  try {
    loaded = await loadDatabaseViewerRows(context, body);
  } catch (error) {
    if (error instanceof HttpError && error.code === 'database_missing') {
      const tableName = String(body?.tableName ?? '').trim();
      recordDatabaseViewerActivity({
        endpoint: '/api/database-viewer/rows',
        operation: 'database_viewer_fetch_rows',
        status: 'error',
        message: `Load rows failed for ${tableName} because the SQLite file does not exist.`,
        details: {
          databaseExists: false,
          tableName,
          absolutePath: error.details?.database?.absolutePath,
        },
      });
    }
    throw error;
  }
  const { database, table } = loaded;
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
      loggingCoverage: getDatabaseViewerLoggingCoverage(),
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
    coverage: getDatabaseViewerLoggingCoverage(),
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
      coverage: getDatabaseViewerLoggingCoverage(),
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
  const truth = attachSafeAuthRuntimeTruth(await readRuntimeTruthFile());
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

async function runtimeDownloadRunHandler({ context }) {
  const envValues = context.envValues;
  const downloadDirectory = resolveRepoPath(envValues.DOWNLOAD_DIR || '');
  const sourceDirectory = resolveRepoPath(envValues.MOCK_DOWNLOAD_SOURCE_DIR || generatedTestDataDirectory);
  const sourceLabel = envValues.MOCK_DOWNLOAD_SOURCE_DIR ? 'configured mock download source' : 'generated_test_data';

  await fs.mkdir(downloadDirectory, { recursive: true });
  const mediaFilesBefore = await collectSupportedMediaFiles(downloadDirectory);
  const executedAt = new Date().toISOString();

  let sourceStats;
  try {
    sourceStats = await fs.stat(sourceDirectory);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new HttpError(500, 'download_source_missing', 'Mock download source directory does not exist.', {
        sourceDirectory,
        sourceLabel,
      });
    }
    throw new HttpError(500, 'download_source_stat_failed', 'Failed to inspect the mock download source directory.', {
      sourceDirectory,
      message: error.message,
    });
  }

  if (!sourceStats.isDirectory()) {
    throw new HttpError(500, 'download_source_not_directory', 'Mock download source path must be a directory.', {
      sourceDirectory,
      sourceLabel,
    });
  }

  const sourceFiles = await collectRegularFiles(sourceDirectory);
  if (!sourceFiles.length) {
    throw new HttpError(500, 'download_source_empty', 'Mock download source directory does not contain any files to copy.', {
      sourceDirectory,
      sourceLabel,
    });
  }

  const copyResult = await copyMockDownloadFiles({
    sourceFiles,
    sourceRoot: sourceDirectory,
    destinationRoot: downloadDirectory,
  });
  if (copyResult.copiedCount === 0) {
    throw new HttpError(500, 'mock_download_copy_failed', 'Mock download could not copy any files into the destination directory.', {
      sourceDirectory,
      downloadDirectory,
      sourceFileCount: sourceFiles.length,
      failures: copyResult.failedCopies,
    });
  }

  const mediaFilesAfter = await collectSupportedMediaFiles(downloadDirectory);
  const previous = new Set(mediaFilesBefore);
  const newMediaFiles = mediaFilesAfter.filter((candidate) => !previous.has(candidate));
  const hasFailedCopies = copyResult.failedCopies.length > 0;
  const summaryMessage = hasFailedCopies
    ? `Mock download copied ${copyResult.copiedCount} file(s) from ${sourceLabel}; ${copyResult.failedCopies.length} file(s) failed to copy.`
    : `Mock download copied ${copyResult.copiedCount} file(s) from ${sourceLabel} into the test download directory.`;

  return {
    statusCode: 200,
    payload: {
      status: hasFailedCopies ? 'warning' : 'ok',
      messages: [summaryMessage],
      stage: 'stage1_auth_download',
      download: {
        mode: 'generated_test_data_copy',
        sourceLabel,
        sourceDirectory,
        sourceFileCount: sourceFiles.length,
        downloadDirectory,
        copiedFiles: copyResult.copiedCount,
        failedFiles: copyResult.failedCopies.length,
        copiedRelativePathSample: copyResult.copiedRelativePaths.slice(0, 20),
        failedCopies: copyResult.failedCopies.slice(0, 20),
        mediaFilesBefore: mediaFilesBefore.length,
        mediaFilesAfter: mediaFilesAfter.length,
        newMediaFiles: newMediaFiles.length,
      },
      schemaVersion: 1,
      executedAt,
    },
  };
}

async function runtimeIndexRunHandler({ context }) {
  const { database, indexedAt, indexing } = await getDatabaseService().runStage2IndexRegister(context);

  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: indexing.scannedMediaCount
        ? [
          `Indexed ${indexing.scannedMediaCount} media file(s); inserted ${indexing.insertedCanonicalCount} canonical row(s).`,
        ]
        : ['No supported media files were found in the download directory.'],
      stage: 'stage2_index_register',
      indexing,
      database,
      schemaVersion: 1,
      indexedAt,
    },
  };
}

async function runtimeGpsRunHandler({ context }) {
  const { database, executedAt, gps } = await getDatabaseService().runStage3ProcessGpsQueue(context);

  return {
    statusCode: 200,
    payload: {
      status: gps.failureCount ? 'warning' : 'ok',
      messages: gps.processedCount
        ? [`GPS parsing processed ${gps.processedCount} queued asset(s): ${gps.successCount} success, ${gps.failureCount} without GPS.`]
        : ['No queued GPS work was available. Stage 3 completed as a successful no-op.'],
      stage: 'stage3_process_gps_queue',
      processed_count: gps.processedCount,
      success_count: gps.successCount,
      failure_count: gps.failureCount,
      message: gps.processedCount
        ? `Processed ${gps.processedCount} GPS queue row(s).`
        : 'No queued GPS work was available.',
      gps,
      database,
      schemaVersion: 1,
      executedAt,
    },
  };
}

async function runtimeGeocodeRunHandler({ context }) {
  const { database, executedAt, geocode } = await getDatabaseService().runStage4ProcessGeocodeQueue(context);

  return {
    statusCode: 200,
    payload: {
      status: geocode.failureCount ? 'warning' : 'ok',
      messages: geocode.processedCount
        ? [`Geocoding processed ${geocode.processedCount} queued asset(s): ${geocode.successCount} success, ${geocode.failureCount} failed using the deterministic placeholder geocoder (not production).`]
        : ['No queued geocode work was available. Stage 4 completed as a successful no-op. The configured geocoder in this repo is still the deterministic placeholder implementation, not a production provider.'],
      stage: 'stage4_process_geocode_queue',
      processed_count: geocode.processedCount,
      success_count: geocode.successCount,
      failure_count: geocode.failureCount,
      message: geocode.processedCount
        ? `Processed ${geocode.processedCount} geocode queue row(s) with the deterministic placeholder geocoder (not production).`
        : 'No queued geocode work was available. Deterministic placeholder geocoder only; not production.',
      geocode,
      database,
      schemaVersion: 1,
      executedAt,
    },
  };
}

async function runtimeQueuePrepareHandler({ context }) {
  const { database, executedAt, queue } = await getDatabaseService().runStage5PrepareQueue(context);

  return {
    statusCode: 200,
    payload: {
      inserted_count: queue.insertedCount,
      skipped_count: queue.skippedCount,
      inserted_ids: queue.insertedIds,
      skipped: queue.skipped,
      message: queue.message,
      queue,
      database,
      schemaVersion: 1,
      executedAt,
    },
  };
}

async function runtimePlaybackSelectCurrentHandler({ context }) {
  const { database, executedAt, playback } = await getDatabaseService().runStage6SelectCurrent(context);

  if (playback.outcome === 'no_ready_row') {
    throw new HttpError(409, 'no_ready_row', 'No READY slideshow rows exist for playback selection.', {
      database,
      stage: 'stage6_run_playback',
      playback,
    });
  }

  if (playback.outcome === 'no_playable_ready_row') {
    throw new HttpError(409, 'no_playable_ready_row', 'READY slideshow rows exist but none are currently playable.', {
      database,
      stage: 'stage6_run_playback',
      playback,
    });
  }

  const selectedAssetId = playback.selected?.mediaAssetId ?? null;
  return {
    statusCode: 200,
    payload: {
      status: playback.failedCandidateCount ? 'warning' : 'ok',
      messages: playback.failedCandidateCount
        ? [
          `Selected media asset ${selectedAssetId} after failing ${playback.failedCandidateCount} invalid READY candidate(s).`,
        ]
        : [`Selected media asset ${selectedAssetId} as the current playback item.`],
      stage: 'stage6_run_playback',
      playback,
      database,
      schemaVersion: 1,
      executedAt,
    },
  };
}

/*
 * Wave E orchestration service.
 *
 * Coordinates the existing Stage 2-6 pipeline in a deterministic order, persists run state
 * across stages using the runtime_state table, provides inspection endpoints for
 * current and last run summaries, and stops immediately on the first failure. A
 * successful run ends with status SUCCEEDED and records the selected playback
 * asset summary. A failure run ends with status FAILED and records the failed
 * stage and reason.
 */

const ORCHESTRATION_STAGE_PIPELINE = [
  { key: 'download', handler: runtimeDownloadRunHandler },
  { key: 'index', handler: runtimeIndexRunHandler },
  { key: 'gps', handler: runtimeGpsRunHandler },
  { key: 'geocode', handler: runtimeGeocodeRunHandler },
  { key: 'queue_prepare', handler: runtimeQueuePrepareHandler },
  { key: 'playback_select', handler: runtimePlaybackSelectCurrentHandler },
];

async function getOrchestrationState(context, key) {
  try {
    return await getDatabaseService().getRuntimeState(context, key);
  } catch {
    // If the database is missing or the bridge fails, treat as no state.
    return null;
  }
}

async function setOrchestrationState(context, key, value) {
  await getDatabaseService().setRuntimeState(context, key, value);
}

async function runtimeOrchestrationRunHandler({ context }) {
  // Ensure the target database exists
  const database = await buildDatabaseStatus(context);
  if (!database.exists) {
    throw new HttpError(404, 'database_missing', 'Cannot run orchestration because the DB file does not exist.', {
      database,
    });
  }

  // Read existing orchestration states
  let currentState = await getOrchestrationState(context, 'orchestration_current');
  let lastState = await getOrchestrationState(context, 'orchestration_last');

  // Prevent concurrent runs
  if (currentState && currentState.status === 'RUNNING') {
    throw new HttpError(409, 'orchestration_already_running', 'An orchestration run is already in progress.', {});
  }

  // Determine next run ID
  let nextRunId = 1;
  const existingRunId = currentState?.run_id ?? lastState?.run_id;
  if (typeof existingRunId === 'number' && Number.isFinite(existingRunId)) {
    nextRunId = existingRunId + 1;
  }

  // Promote a previous completed state to last if current is not running
  if (currentState && currentState.status !== 'RUNNING') {
    lastState = currentState;
    await setOrchestrationState(context, 'orchestration_last', lastState);
  }

  // Initialize new current state
  const startIso = new Date().toISOString();
  currentState = {
    run_id: nextRunId,
    status: 'RUNNING',
    current_stage: null,
    last_successful_stage: null,
    started_at: startIso,
    finished_at: null,
    failed_stage: null,
    failure_reason: null,
    stage_order_executed: [],
    stage_results: {},
    selected_asset_summary: null,
  };
  await setOrchestrationState(context, 'orchestration_current', currentState);

  // Execute the pipeline sequentially
  for (const stage of ORCHESTRATION_STAGE_PIPELINE) {
    currentState.current_stage = stage.key;
    currentState.stage_order_executed.push(stage.key);
    await setOrchestrationState(context, 'orchestration_current', currentState);

    try {
      const result = await stage.handler({ context });
      // Stage succeeded
      currentState.last_successful_stage = stage.key;
      const payload = result?.payload || {};
      currentState.stage_results[stage.key] = payload;
      if (stage.key === 'playback_select') {
        // Final stage success
        currentState.status = 'SUCCEEDED';
        currentState.finished_at = new Date().toISOString();
        currentState.selected_asset_summary = payload?.playback?.selected ?? null;
        await setOrchestrationState(context, 'orchestration_current', currentState);
        await setOrchestrationState(context, 'orchestration_last', currentState);
        return { statusCode: 200, payload: currentState };
      }
    } catch (error) {
      // Stage failed; capture failure and stop
      const failureReason = error instanceof HttpError && error.code ? error.code : error?.message;
      currentState.status = 'FAILED';
      currentState.failed_stage = stage.key;
      currentState.failure_reason = failureReason;
      currentState.finished_at = new Date().toISOString();
      await setOrchestrationState(context, 'orchestration_current', currentState);
      await setOrchestrationState(context, 'orchestration_last', currentState);
      return { statusCode: 200, payload: currentState };
    }
  }
  // Should not reach here; but ensure state is marked succeeded
  currentState.status = 'SUCCEEDED';
  currentState.finished_at = new Date().toISOString();
  await setOrchestrationState(context, 'orchestration_current', currentState);
  await setOrchestrationState(context, 'orchestration_last', currentState);
  return { statusCode: 200, payload: currentState };
}

async function runtimeOrchestrationCurrentHandler({ context }) {
  const state = await getOrchestrationState(context, 'orchestration_current');
  if (state) {
    return { statusCode: 200, payload: state };
  }
  // No state yet; return a default non-running shape
  return {
    statusCode: 200,
    payload: {
      run_id: null,
      status: 'NOT_RUNNING',
      current_stage: null,
      last_successful_stage: null,
      started_at: null,
      finished_at: null,
      failed_stage: null,
      failure_reason: null,
      stage_order_executed: [],
      stage_results: {},
      selected_asset_summary: null,
    },
  };
}

async function runtimeOrchestrationLastHandler({ context }) {
  const last = await getOrchestrationState(context, 'orchestration_last');
  if (last) {
    return { statusCode: 200, payload: last };
  }
  const current = await getOrchestrationState(context, 'orchestration_current');
  if (current && current.status !== 'RUNNING') {
    return { statusCode: 200, payload: current };
  }
  return { statusCode: 200, payload: null };
}

async function updateRuntimeTruthHandler({ body }) {
  const truth = attachSafeAuthRuntimeTruth(normalizeRuntimeTruthPayload(body?.truth, { source: 'request' }));
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

async function resolveInitialLogDirectory() {
  if (process.env.LOG_DIR && process.env.LOG_DIR.trim()) {
    return process.env.LOG_DIR;
  }

  let raw;
  try {
    raw = await fs.readFile(resolveEnvFilePath(), 'utf8');
  } catch {
    return DEFAULT_LOG_DIR;
  }

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
    if (key === 'LOG_DIR') {
      const value = trimmed.slice(separatorIndex + 1).trim();
      return value || DEFAULT_LOG_DIR;
    }
  }

  return DEFAULT_LOG_DIR;
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

function getAuthReadinessChecks(context) {
  const authEnvKeys = new Set(['user', 'pw', 'ICLOUDPD_COOKIE_DIR']);
  return envSchema
    .filter((entry) => authEnvKeys.has(entry.key))
    .map((entry) => buildEnvCheck(entry, context.envValues));
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

let databaseService = null;

function getDatabaseService() {
  if (!databaseService) {
    databaseService = createDatabaseService({
      repoRoot,
      createHttpError: (statusCode, code, message, details) => new HttpError(statusCode, code, message, details),
    });
  }
  return databaseService;
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
  return getDatabaseService().buildDatabaseStatus(context);
}

async function buildDatabaseViewerVerification(context) {
  return getDatabaseService().buildDatabaseViewerVerification(context);
}

function buildDatabaseViewerVerificationMessages(verification) {
  return getDatabaseService().buildDatabaseViewerVerificationMessages(verification);
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
  const coverage = options.coverage ?? databaseViewerLoggingSession?.coverage ?? getDatabaseViewerLoggingCoverage();

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

function resolveRepoPath(relativeOrAbsolutePath) {
  return getDatabaseService().resolveRepoPath(relativeOrAbsolutePath);
}

function getSchemaPath() {
  return getDatabaseService().getSchemaPath();
}

function getDatabaseArtifactPaths(databaseOrAbsolutePath) {
  return getDatabaseService().getDatabaseArtifactPaths(databaseOrAbsolutePath);
}

function getDatabaseViewerLoggingCoverage() {
  return getDatabaseService().getDatabaseViewerLoggingCoverage();
}

async function inspectDatabase(context) {
  return getDatabaseService().inspectDatabase(context);
}

async function deleteDatabaseArtifacts(context) {
  return getDatabaseService().deleteDatabaseArtifacts(context);
}

async function recreateEmptyDatabase(context) {
  return getDatabaseService().recreateEmptyDatabase(context);
}

async function listDatabaseViewerTables(context) {
  return getDatabaseService().listDatabaseViewerTables(context);
}

async function loadDatabaseViewerRows(context, body) {
  return getDatabaseService().loadDatabaseViewerRows(context, body);
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
  return getDatabaseService().runPythonJson(args);
}

function runProcess(command, args, options = {}) {
  void logger.debug('Spawning child process.', {
    command,
    args,
    shell: options.shell === true,
  });
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: options.shell === true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      void logger.error('Child process failed to start.', { command, args, error });
      reject(error);
    });
    child.on('close', (code) => {
      void logger.debug('Child process exited.', { command, code });
      resolve({ code, stdout, stderr });
    });
  });
}

async function collectSupportedMediaFiles(rootDirectory) {
  const files = [];
  await collectSupportedMediaFilesRecursive(rootDirectory, files);
  files.sort();
  return files;
}

async function collectRegularFiles(rootDirectory) {
  const files = [];
  await collectRegularFilesRecursive(rootDirectory, files);
  files.sort();
  return files;
}

async function collectSupportedMediaFilesRecursive(directoryPath, sink) {
  let entries;
  try {
    entries = await fs.readdir(directoryPath, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      await collectSupportedMediaFilesRecursive(absolutePath, sink);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    if (supportedMediaExtensions.has(path.extname(entry.name).toLowerCase())) {
      sink.push(absolutePath);
    }
  }
}

async function collectRegularFilesRecursive(directoryPath, sink) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      await collectRegularFilesRecursive(absolutePath, sink);
      continue;
    }
    if (entry.isFile()) {
      sink.push(absolutePath);
    }
  }
}

async function copyMockDownloadFiles({ sourceFiles, sourceRoot, destinationRoot }) {
  const copiedRelativePaths = [];
  const failedCopies = [];

  for (const sourceFile of sourceFiles) {
    const relativePath = path.relative(sourceRoot, sourceFile);
    const destinationFile = path.join(destinationRoot, relativePath);
    try {
      await fs.mkdir(path.dirname(destinationFile), { recursive: true });
      await fs.copyFile(sourceFile, destinationFile);
      copiedRelativePaths.push(relativePath);
    } catch (error) {
      failedCopies.push({
        relativePath,
        message: error.message,
      });
    }
  }

  return {
    copiedCount: copiedRelativePaths.length,
    copiedRelativePaths,
    failedCopies,
  };
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
  // On non‑Windows platforms, return a deferred (informational) scheduler payload instead of invoking
  // the Windows Task Scheduler. This prevents misrepresenting Windows behavior as Unix cron and
  // ensures the frontend receives a safe capability description. See authoritative spec section 3.1.
  if (capability.platformFamily !== 'windows') {
    return buildDeferredSchedulerPayload({
      context,
      capability,
      definition,
      operation,
      operationSupportLevel,
    });
  }

  // For Windows platforms, continue with existing logic. If the operation is not executable,
  // return a deferred payload. Otherwise run the Windows scheduler command.
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
  const logDirectory = resolveRepoPath(context.envValues.LOG_DIR || DEFAULT_LOG_DIR);
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
    '-LogDir',
    definition.logDirectory,
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

function logRequest({ request, url = null, routeKey, statusCode, startedAt }) {
  const entry = {
    method: request.method || 'GET',
    path: url?.pathname || request.url || null,
    routeKey,
    statusCode,
    durationMs: Date.now() - startedAt,
  };

  if (statusCode >= 500) {
    return logger.error('HTTP request completed with server error.', entry);
  }
  return logger.info('HTTP request completed.', entry);
}

function reportLoggerWriteError(error) {
  console.warn('[logger] Failed to write project log.', error?.message || error);
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
