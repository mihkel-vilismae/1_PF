/*
 * Hosts the repo-local HTTP API used by the dashboard frontend.
 * Routes expose initialization, auth, runtime, scheduler, and status surfaces.
 * The server owns filesystem and process access that the browser cannot perform.
 */
import { createServer } from 'node:http';
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createAuthRoutes } from './auth/authRoutes.ts';
import { testAuthLoginByDownloadingSingleFile } from './auth/authService.ts';
import { REDACTED_VALUE, isSensitiveKey, sanitizeAuthValue } from './auth/authLogSanitizer.ts';
import { verifyNewAuthSessionForRuntimeDownload } from './auth/newAuthService.ts';
import { reconcileRuntimeDownloadAuth } from './runtimeRealDownloadAuthBridge.ts';
import { createNewAuthRoutes } from './auth/newAuthRoutes.ts';
import { createDatabaseService } from './database/databaseService.ts';
import type { DatabaseService } from './database/databaseService.ts';
import { createProjectLogger, DEFAULT_LOG_DIR } from './logging/projectLogger.ts';
import {
  createSchedulerCapability,
  getOperationSupportLevel,
  isOperationExecutable,
  SCHEDULER_OPERATION_SUPPORT,
  SCHEDULER_SUPPORT_LEVELS,
  SCHEDULER_TARGETS,
  isSchedulerTarget,
} from '../shared/schedulerPlatformCapabilities.ts';
import type { SchedulerCapability, SchedulerOperation, SchedulerSupportLevel, SchedulerTarget } from '../shared/schedulerPlatformCapabilities.ts';

// Import runtime projection constants used by the live runtime projection endpoint.
import { RUNTIME_PROJECTION_SOURCES, RUNTIME_NAMESPACES } from '../shared/runtimeProjectionContracts.ts';
import {
  RASPBERRY_PLAYBACK_WORKER_CRON_ROW,
  RASPBERRY_REGULAR_STAGE_WORKER_CRON_ROW,
  RASPBERRY_SCREEN_ON_OFF_WORKER_CRON_ROW,
  SCHEDULER_WORKER_NAMES,
} from '../shared/schedulerWorkerCommands.ts';
import { selectCurrentPlayableItem } from './playback/playbackSelectionService.ts';
import { runPlaybackWorker } from './workers/playbackWorker.ts';
import { createSchedulerRoutes } from './routes/schedulerRoutes.ts';
import { createScreenSimulationRoutes } from './routes/screenSimulationRoutes.ts';
import { createRuntimeTruthRoutes } from './routes/runtimeTruthRoutes.ts';
import { createInspectionRoutes } from './routes/inspectionRoutes.ts';
import { createRuntimeStatusRoutes } from './routes/runtimeStatusRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const versionFilePath = path.join(repoRoot, 'VERSION');
const backendVersion = (await readTextIfExists(versionFilePath))?.trim() || 'unknown';
const generatedTestDataDirectory = path.join(repoRoot, 'generated_test_data');
const defaultEnvFilePath = path.join(repoRoot, '.env');
const schedulerNodeArguments = Object.freeze(['--import', 'tsx']);
const port = Number(process.env.PORT || 4301);
const fullLogVerboseEnabled = await resolveInitialFullLogVerboseEnabled();
const logger = createProjectLogger({
  repoRoot,
  logDir: await resolveInitialLogDirectory(),
  verboseEnabled: fullLogVerboseEnabled,
  source: 'init-api',
  onWriteError: reportLoggerWriteError,
});
await logger.initialize().catch(reportLoggerWriteError);
const dashboardRequestIdHeader = 'X-Dashboard-Request-Id';
const schedulerRuntimeDirectory = path.join(repoRoot, 'runtime_data', 'scheduler');
const schedulerTargetSelectionFilePath = path.join(schedulerRuntimeDirectory, 'selected-target.json');
const cronEmulatorRoot = path.join(repoRoot, 'tools', 'CronEmulator');
const cronEmulatorSourcePath = path.join(cronEmulatorRoot, 'src');
const cronEmulatorDefaultCrontabPath = process.env.CRON_EMULATOR_CRONTAB_FILE
  ? path.resolve(process.env.CRON_EMULATOR_CRONTAB_FILE)
  : path.join(cronEmulatorRoot, 'crontab_emulated.txt');
const cronEmulatorRuntimeDirectory = path.join(schedulerRuntimeDirectory, 'cron-emulator');
const cronEmulatorLogFilePath = path.join(cronEmulatorRuntimeDirectory, 'cron_calls.jsonl');
const cronEmulatorHost = '127.0.0.1';
const cronEmulatorPort = 8765;
const cronEmulatorStateUrl = `http://${cronEmulatorHost}:${cronEmulatorPort}/api/state`;
const raspberryCrontabStartMarker = '# BEGIN 1_PF PHOTO FRAME CRON';
const raspberryCrontabEndMarker = '# END 1_PF PHOTO FRAME CRON';
const runtimeTruthRelativePath = 'conf/runtime-truth.json';
const runtimeTruthFilePath = path.join(repoRoot, runtimeTruthRelativePath);
const authSingleFileDownloadDirectory = path.join(repoRoot, 'runtime_data', 'tmp');
const schedulerSchemaVersion = 3;
const verboseBodyCharacterLimit = 8000;
const schedulerEmulatorOperations = Object.freeze({
  check: 'emulator-check',
  run: 'emulator-run',
  stop: 'emulator-stop',
  installCrontab: 'emulator-install-crontab',
  activeCrontab: 'emulator-active-crontab',
});
const schedulerTickSeconds = Object.freeze({
  pipeline: 5,
  playbackWatchdog: 5,
  screenWatchdog: 5,
  recoveryReconciliation: 15,
});
const schedulerWorkerName = normalizeSchedulerWorkerName(process.argv);
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


type JsonObject = Record<string, unknown>;
type EnvSchemaKind = 'string' | 'path' | 'integer' | 'boolean';
type EnvCheckSeverity = 'info' | 'warning' | 'error';
type SchedulerRouteOperation = SchedulerOperation | string;
type SchedulerTargetSelectionSource = 'file' | 'default' | 'request';
type SchedulerWorkerName = typeof SCHEDULER_WORKER_NAMES[keyof typeof SCHEDULER_WORKER_NAMES];

interface EnvValues {
  [key: string]: string | undefined;
}

interface RequestContext {
  envValues: EnvValues;
  platform: NodeJS.Platform;
  nodePath: string;
  username: string | null;
}

interface DatabaseStatusPayload {
  exists: boolean;
  absolutePath?: string;
  [key: string]: unknown;
}

interface EnvSchemaEntry {
  key: string;
  label: string;
  required: boolean;
  sensitive?: boolean;
  kind: EnvSchemaKind;
}

interface EnvValidationResult {
  valid: boolean;
  message: string;
}

interface EnvCheckDetails {
  kind: EnvSchemaKind;
  nonEmpty?: boolean;
  absolutePath?: string;
  exists?: boolean;
  parentDirectory?: string;
}

interface EnvCheck {
  key: string;
  label: string;
  required: boolean;
  present: boolean;
  valid: boolean;
  severity: EnvCheckSeverity;
  message: string;
  valuePreview: string | null;
  details: EnvCheckDetails;
}

interface HandlerArgs {
  request: IncomingMessage;
  response: ServerResponse;
  url: URL;
  body: JsonObject;
  context: RequestContext;
}

interface HandlerResult {
  statusCode: number;
  payload: unknown;
}

interface SentJsonResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  bodyBytes: number;
  payload: unknown;
}

export type RouteHandler = (args: HandlerArgs) => HandlerResult | Promise<HandlerResult>;

interface DatabaseViewerLoggingEntry {
  id: string;
  at: string;
  endpoint: string;
  operation: string;
  status: string;
  message: string;
  details: unknown;
}

interface DatabaseViewerLoggingSession {
  id: string;
  startedAt: string;
  coverage: string;
  entries: DatabaseViewerLoggingEntry[];
}

interface DatabaseViewerLoggingStateOptions {
  active?: boolean;
  endedAt?: string | null;
  entries?: DatabaseViewerLoggingEntry[];
  id?: string | null;
  startedAt?: string | null;
  coverage?: string;
}

interface DatabaseViewerActivityInput {
  endpoint?: string;
  operation?: string;
  status?: string;
  message?: string;
  details?: unknown;
}

interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

interface SchedulerOperationInput {
  context: RequestContext;
  capability: SchedulerCapability;
  definition: SchedulerDefinition;
  selection: SchedulerTargetSelection;
  operation: SchedulerRouteOperation;
  operationSupportLevel: SchedulerSupportLevel;
  crontabText?: string | null;
}

interface CopyMockDownloadFilesInput {
  sourceFiles: string[];
  sourceRoot: string;
  destinationRoot: string;
}

interface CopyMockDownloadFilesResult {
  copiedCount: number;
  copiedRelativePaths: string[];
  failedCopies: Array<{ relativePath: string; message: string }>;
}

type OrchestrationStageKey = 'download' | 'index' | 'gps' | 'geocode' | 'queue_prepare' | 'playback_select';
type OrchestrationStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'NOT_RUNNING';

interface OrchestrationState {
  run_id: number | null;
  status: OrchestrationStatus;
  current_stage: OrchestrationStageKey | null;
  last_successful_stage: OrchestrationStageKey | null;
  started_at: string | null;
  finished_at: string | null;
  failed_stage: OrchestrationStageKey | null;
  failure_reason: string | null;
  stage_order_executed: OrchestrationStageKey[];
  stage_results: Record<string, unknown>;
  selected_asset_summary: unknown;
}

interface OrchestrationStageDefinition {
  key: OrchestrationStageKey;
  handler: (args: Pick<HandlerArgs, 'context'>) => Promise<HandlerResult>;
}

interface SchedulerDefinition {
  routeLabel: string;
  taskName: string | null;
  selectedTarget: SchedulerTarget;
  platformTarget: string;
  schedulerMode: string;
  nodePath: string;
  nodeArguments: readonly string[];
  scriptPath: string | null;
  repoRoot: string;
  logDirectory: string;
  runtimeDirectory: string;
  statusFilePath: string;
  username: string | null;
  cadence: typeof schedulerTickSeconds;
  notes: string[];
}

interface SchedulerTaskResult {
  installed?: boolean;
  supported?: boolean;
  operation?: SchedulerRouteOperation;
  supportLevel?: SchedulerSupportLevel;
  exportedXml?: string;
  [key: string]: unknown;
}

interface SchedulerTargetSelection {
  selectedTarget: SchedulerTarget;
  source: SchedulerTargetSelectionSource;
  targetFilePath: string;
  selectedAt?: string;
}

interface SchedulerHostStatus {
  observed: boolean;
  state: string;
  statusFilePath?: string;
  message?: string;
  heartbeatAgeSeconds?: number | null;
  payload?: unknown;
}

interface BuildSchedulerPayloadInput {
  context: RequestContext;
  definition: SchedulerDefinition;
  capability: SchedulerCapability;
  selection: SchedulerTargetSelection;
  operation: SchedulerRouteOperation;
  operationSupportLevel: SchedulerSupportLevel;
  task: SchedulerTaskResult | null;
  host: SchedulerHostStatus;
  includeExportedXml: boolean;
  overrideStatus?: string;
  prependMessages?: string[];
}

interface DeferredSchedulerPayloadInput {
  context: RequestContext;
  capability: SchedulerCapability;
  definition: SchedulerDefinition;
  selection: SchedulerTargetSelection;
  operation: SchedulerRouteOperation;
  operationSupportLevel: SchedulerSupportLevel;
  reason?: string;
}


interface ErrorPayload {
  status: 'error';
  error: string;
  message: string;
  details: unknown;
  schemaVersion: number;
}

let databaseViewerLoggingSession: DatabaseViewerLoggingSession | null = null;
let cronEmulatorProcess: ChildProcessWithoutNullStreams | null = null;
const authRouteHandlers = createAuthRoutes({
  getAuthReadinessChecks,
  singleFileDownloadDirectory: authSingleFileDownloadDirectory,
});
const newAuthRouteHandlers = createNewAuthRoutes();

const envSchema: EnvSchemaEntry[] = [
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

const routes: Record<string, RouteHandler> = {
  ...createInspectionRoutes({
    versionHandler,
    verifyEnvHandler,
  }),
  'GET /api/auth/status': authRouteHandlers.statusHandler,
  'POST /api/auth/verify-icloudpd': authRouteHandlers.verifyIcloudpdHandler,
  'POST /api/auth/run': authRouteHandlers.runHandler,
  'POST /api/auth/2fa/submit': authRouteHandlers.twoFactorSubmitHandler,
  'POST /api/auth/test-login-download-one': authRouteHandlers.testLoginDownloadOneHandler,
  'POST /api/auth/reset': authRouteHandlers.resetHandler,
  'POST /api/auth/logout': authRouteHandlers.logoutHandler,
  'POST /api/auth/resume': authRouteHandlers.resumeHandler,
  'GET /api/auth/new/status': newAuthRouteHandlers.statusHandler,
  'POST /api/auth/new/verify-icloudpd': newAuthRouteHandlers.verifyIcloudpdHandler,
  'GET /api/auth/new/session-files': newAuthRouteHandlers.sessionFilesHandler,
  'POST /api/auth/new/login': newAuthRouteHandlers.loginHandler,
  'POST /api/auth/new/submit-2fa': newAuthRouteHandlers.submitTwoFactorHandler,
  'POST /api/auth/new/logout': newAuthRouteHandlers.logoutHandler,
  'POST /api/auth/new/test-download': newAuthRouteHandlers.testDownloadHandler,
  'POST /api/auth/new/artifacts/generate': newAuthRouteHandlers.generateArtifactPackHandler,
  'GET /api/auth/new/artifacts': newAuthRouteHandlers.listArtifactPacksHandler,
  'GET /api/init/database/status': databaseStatusHandler,
  'POST /api/init/database/inspect': inspectDatabaseHandler,
  'POST /api/init/database/delete': deleteDatabaseHandler,
  'POST /api/init/database/recreate-empty': recreateEmptyDatabaseHandler,
  ...createSchedulerRoutes({
    cronTargetStatusHandler,
    selectCronTargetHandler,
    installCronHandler,
    cronStatusHandler,
    printCronHandler,
    checkEmulatorSchedulerHandler,
    runEmulatorHandler,
    stopEmulatorHandler,
    installEmulatorCrontabHandler,
    activeEmulatorCrontabHandler,
    schedulerRunLogHandler,
  }),
  'POST /api/database-viewer/verify': databaseViewerVerifyHandler,
  'POST /api/database-viewer/connect': databaseViewerConnectHandler,
  'GET /api/database-viewer/tables': databaseViewerTablesHandler,
  'POST /api/database-viewer/rows': databaseViewerRowsHandler,
  'POST /api/database-viewer/logging/start': databaseViewerLoggingStartHandler,
  'POST /api/database-viewer/logging/stop': databaseViewerLoggingStopHandler,
  'POST /api/runtime/download/run': runtimeDownloadRunHandler,
  'POST /api/runtime/download/real-run': runtimeRealDownloadRunHandler,
  'POST /api/runtime/index/run': runtimeIndexRunHandler,
  'POST /api/runtime/gps/run': runtimeGpsRunHandler,
  'POST /api/runtime/geocode/run': runtimeGeocodeRunHandler,
  'POST /api/runtime/queue/prepare': runtimeQueuePrepareHandler,
  'POST /api/runtime/playback/select-current': runtimePlaybackSelectCurrentHandler,
  // Live runtime projection: returns a combined runtime projection for the live monitor (View D).
  // This read‑only endpoint provides run state, worker health, playback and screen status,
  // along with field provenance.  It should never mutate runtime truth or lock state.
  'GET /api/runtime/projection/live': runtimeLiveProjectionHandler,
  // Wave E orchestration endpoints
  'POST /api/runtime/orchestration/run': runtimeOrchestrationRunHandler,
  ...createRuntimeStatusRoutes({
    runtimeOrchestrationCurrentHandler,
    runtimeOrchestrationLastHandler,
  }),
  ...createScreenSimulationRoutes({
    createBadRequestError: (code, message, details) => new HttpError(400, code, message, details),
    isJsonObject,
  }),
  ...createRuntimeTruthRoutes({
    runtimeTruthFilePath,
    runtimeTruthRelativePath,
    createHttpError: (statusCode, code, message, details) => new HttpError(statusCode, code, message, details),
  }),
};

// Handles every backend HTTP request and mirrors auth/login diagnostics when applicable.
const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
  const startedAt = Date.now();
  const dashboardRequestId = readDashboardRequestId(request);
  const verboseRequestId = dashboardRequestId ?? randomUUID();
  if (dashboardRequestId) {
    response.setHeader(dashboardRequestIdHeader, dashboardRequestId);
  }
  let routeKey = `${request.method || 'GET'} ${request.url || ''}`;
  let url = null;
  let requestBody: JsonObject | null = null;
  try {
    if (!request.url) {
      const sentResponse = sendJson(response, 400, errorPayload('missing_request_url', 'Request URL was not provided.'));
      void logRequest({ request, requestId: dashboardRequestId, routeKey, statusCode: 400, startedAt });
      void logVerboseRequestFailed({ request, requestId: verboseRequestId, url, routeKey, body: requestBody, statusCode: 400, startedAt, sentResponse });
      return;
    }

    url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
    routeKey = `${request.method || 'GET'} ${url.pathname}`;

    if (routeKey === 'GET /api/runtime/playback/media') {
      const context = await buildRequestContext();
      const statusCode = await runtimePlaybackMediaHandler({ response, url, context });
      void logRequest({ request, requestId: dashboardRequestId, url, routeKey, statusCode, startedAt });
      return;
    }

    const handler = routes[routeKey];

    if (!handler) {
      sendJson(response, 404, errorPayload('not_found', `No handler exists for ${routeKey}.`));
      void logRequest({ request, requestId: dashboardRequestId, url, routeKey, statusCode: 404, startedAt });
      return;
    }

    requestBody = await readJsonBody(request);
    void logVerboseRequestStarted({ request, requestId: verboseRequestId, url, routeKey, body: requestBody, startedAt });
    void logLoginDebugRequestReceived({ request, url, routeKey, body: requestBody, startedAt });
    const context = await buildRequestContext();
    const result = await handler({ request, response, url, body: requestBody, context });
    const sentResponse = sendJson(response, result.statusCode, result.payload);
    void logLoginDebugRequestCompleted({ request, url, routeKey, statusCode: result.statusCode, startedAt, payload: result.payload });
    void logRequest({ request, requestId: dashboardRequestId, url, routeKey, statusCode: result.statusCode, startedAt });
    void logVerboseRequestCompleted({ request, requestId: verboseRequestId, url, routeKey, body: requestBody, statusCode: result.statusCode, startedAt, sentResponse });
  } catch (error: unknown) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const code = error instanceof HttpError ? error.code : 'internal_error';
    const details = error instanceof HttpError ? error.details : undefined;
    const errorResponsePayload = errorPayload(code, getErrorMessage(error), details);
    void logger.error('HTTP request failed.', {
      requestId: dashboardRequestId,
      method: request.method || 'GET',
      path: url?.pathname || request.url || null,
      routeKey,
      statusCode,
      code,
      durationMs: Date.now() - startedAt,
      error,
    });
    void logLoginDebugRequestFailed({ request, url, routeKey, statusCode, startedAt, code, details, error });
    const sentResponse = sendJson(response, statusCode, errorResponsePayload);
    void logVerboseRequestFailed({ request, requestId: verboseRequestId, url, routeKey, body: requestBody, statusCode, startedAt, sentResponse, code, details, error });
  }
});

if (schedulerWorkerName) {
  await runSchedulerWorker(schedulerWorkerName);
} else {
  server.listen(port, '127.0.0.1', () => {
    const message = `Init API server listening on http://127.0.0.1:${port}`;
    console.log(message);
    void logger.info(message, { port, url: `http://127.0.0.1:${port}` });
  });
}


// Dispatches the scheduler CLI worker mode used by cron/crontab commands.
async function runSchedulerWorker(workerName: SchedulerWorkerName): Promise<void> {
  // Runs the supported scheduler worker entrypoint without starting the HTTP server.
  const context = await buildRequestContext();
  await logger.info('Scheduler worker invoked by cron/crontab.', {
    worker: workerName,
    invokedAt: new Date().toISOString(),
    command: process.argv.join(' '),
    source: 'scheduler-worker-cli',
  });
  if (workerName !== SCHEDULER_WORKER_NAMES.playback) {
    const message = `Scheduler worker ${workerName} is not implemented in this slice.`;
    console.error(message);
    await logger.error('Scheduler worker invocation failed.', {
      worker: workerName,
      failureReason: message,
      source: 'scheduler-worker-cli',
    });
    process.exitCode = 2;
    return;
  }

  const result = await runPlaybackWorker({
    context,
    databaseService: getDatabaseService(),
    repoRoot,
  });
  console.log(JSON.stringify(result, null, 2));
  await logger.info('playback_worker completed.', {
    status: result.status,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    skippedReason: result.skippedReason,
    failureReason: result.failureReason,
  });
  process.exitCode = result.status === 'failed' ? 1 : 0;
}

// Reads the optional `--scheduler <worker>` argument without affecting HTTP server mode.
function normalizeSchedulerWorkerName(argv: string[]): SchedulerWorkerName | null {
  // Parses the scheduler worker flag and rejects unknown worker names.
  const flagIndex = argv.indexOf('--scheduler');
  const raw = flagIndex >= 0 ? argv[flagIndex + 1] : null;
  if (raw === SCHEDULER_WORKER_NAMES.playback) {
    return raw;
  }
  if (raw === SCHEDULER_WORKER_NAMES.regularStage || raw === SCHEDULER_WORKER_NAMES.screenOnOff) {
    return raw;
  }
  return null;
}

// Returns the backend component version from the backend process workspace.
function versionHandler(): HandlerResult {
  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      component: 'backend',
      version: backendVersion,
      versionSource: 'VERSION',
      schemaVersion: 1,
    },
  };
}

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

async function cronTargetStatusHandler({ context }) {
  const selection = await readSchedulerTargetSelection(context);
  return {
    statusCode: 200,
    payload: buildSchedulerTargetPayload(context, selection, 'Scheduler target selection loaded.'),
  };
}

async function selectCronTargetHandler({ body, context }) {
  const requestedTarget = normalizeRequestedSchedulerTarget(body?.target);
  if (!requestedTarget) {
    throw new HttpError(400, 'invalid_scheduler_target', 'Scheduler target must be windows-cron-emulator or raspberry-real-crontab.', {
      supportedTargets: Object.values(SCHEDULER_TARGETS),
    });
  }

  const selection = await writeSchedulerTargetSelection(context, requestedTarget);
  return {
    statusCode: 200,
    payload: buildSchedulerTargetPayload(context, selection, `Selected scheduler target: ${requestedTarget}.`),
  };
}

async function installCronHandler({ context, body, url }) {
  return buildSchedulerRouteResponse(context, SCHEDULER_OPERATION_SUPPORT.install, {
    requestedTarget: getRequestedSchedulerTarget(url, body),
  });
}

async function cronStatusHandler({ context, body, url }) {
  return buildSchedulerRouteResponse(context, SCHEDULER_OPERATION_SUPPORT.status, {
    requestedTarget: getRequestedSchedulerTarget(url, body),
  });
}

async function printCronHandler({ context, body, url }) {
  return buildSchedulerRouteResponse(context, SCHEDULER_OPERATION_SUPPORT.print, {
    requestedTarget: getRequestedSchedulerTarget(url, body),
  });
}

// Checks Windows CronEmulator API reachability without starting it.
async function checkEmulatorSchedulerHandler({ context, body, url }) {
  return buildSchedulerRouteResponse(context, schedulerEmulatorOperations.check, {
    requestedTarget: getRequestedSchedulerTarget(url, body),
  });
}

// Starts Windows CronEmulator and its internal scheduler loop.
async function runEmulatorHandler({ context, body, url }) {
  return buildSchedulerRouteResponse(context, schedulerEmulatorOperations.run, {
    requestedTarget: getRequestedSchedulerTarget(url, body),
  });
}

// Stops Windows CronEmulator scheduler loop and the backend-owned process.
async function stopEmulatorHandler({ context, body, url }) {
  return buildSchedulerRouteResponse(context, schedulerEmulatorOperations.stop, {
    requestedTarget: getRequestedSchedulerTarget(url, body),
  });
}

// Installs the posted crontab text into CronEmulator's active crontab file.
async function installEmulatorCrontabHandler({ context, body, url }) {
  return buildSchedulerRouteResponse(context, schedulerEmulatorOperations.installCrontab, {
    requestedTarget: getRequestedSchedulerTarget(url, body),
    crontabText: typeof body?.crontabText === 'string' ? body.crontabText : null,
  });
}

// Reads the active CronEmulator crontab text.
async function activeEmulatorCrontabHandler({ context, body, url }) {
  return buildSchedulerRouteResponse(context, schedulerEmulatorOperations.activeCrontab, {
    requestedTarget: getRequestedSchedulerTarget(url, body),
  });
}


// Returns actual cron row execution evidence from the selected scheduler target.
async function schedulerRunLogHandler({ context, body, url }) {
  const selection = await readSchedulerTargetSelection(context);
  const requestedTarget = getRequestedSchedulerTarget(url, body);
  const selectedTarget = requestedTarget && isSchedulerTarget(requestedTarget) ? requestedTarget : selection.selectedTarget;
  const runLog = selectedTarget === SCHEDULER_TARGETS.windowsCronEmulator
    ? await buildWindowsCronRunLog()
    : await buildRaspberryCronRunLog(context);

  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: [runLog.message],
      schedulerTarget: selectedTarget,
      runLog,
      schemaVersion: 1,
    },
  };
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

async function runtimeDownloadRunHandler({ context }: Pick<HandlerArgs, 'context'>): Promise<HandlerResult> {
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
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new HttpError(500, 'download_source_missing', 'Mock download source directory does not exist.', {
        sourceDirectory,
        sourceLabel,
      });
    }
    throw new HttpError(500, 'download_source_stat_failed', 'Failed to inspect the mock download source directory.', {
      sourceDirectory,
      message: getErrorMessage(error),
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

// Runs the real iCloudPD download path after verifying a local authenticated session.
async function runtimeRealDownloadRunHandler({ body, context }: Pick<HandlerArgs, 'body' | 'context'>): Promise<HandlerResult> {
  const requestedRecentCount = normalizeRealDownloadBatchSize(body?.recentCount);
  const downloadDirectory = resolveRepoPath(context.envValues.DOWNLOAD_DIR || '');
  const executedAt = new Date().toISOString();
  const newAuth = await verifyNewAuthSessionForRuntimeDownload({ envValues: context.envValues });

  if (newAuth.state !== 'authenticated') {
    throw new HttpError(409, 'auth_session_required', 'Real download requires an authenticated iCloudPD session. Please verify/login first.', {
      auth: newAuth,
      requestedRecentCount,
      downloadDirectory,
    });
  }

  const checks = getAuthReadinessChecks(context);
  const result = await testAuthLoginByDownloadingSingleFile({
    checks: checks as unknown as Parameters<typeof testAuthLoginByDownloadingSingleFile>[0]['checks'],
    envValues: {
      ...context.envValues,
      DOWNLOAD_RECENT: requestedRecentCount,
    },
    downloadDirectory,
    recentCount: requestedRecentCount,
  });

  const bridgedAuth = reconcileRuntimeDownloadAuth({
    newAuth,
    singleFileResult: result,
    now: new Date(executedAt),
  });

  if (!bridgedAuth.accepted) {
    const statusCode = result.auth.status === 'provider_failed' ? 502 : 409;
    throw new HttpError(statusCode, 'real_download_failed', result.auth.error?.message || 'Real iCloudPD download did not complete with an authenticated session.', {
      auth: bridgedAuth.auth,
      testDownload: bridgedAuth.testDownload,
      newAuthBridge: {
        applied: bridgedAuth.bridgeApplied,
        reason: bridgedAuth.bridgeReason,
      },
      diagnostics: bridgedAuth.diagnostics,
      requestedRecentCount,
      downloadDirectory,
    });
  }

  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      messages: [`Real iCloudPD download requested ${requestedRecentCount} recent file(s).`],
      stage: 'stage1_real_icloudpd_download',
      download: {
        mode: 'icloudpd_real_download',
        requestedRecentCount,
        downloadDirectory,
        authStatus: bridgedAuth.auth.status,
        newAuthBridgeApplied: bridgedAuth.bridgeApplied,
      },
      newAuth,
      auth: bridgedAuth.auth,
      testDownload: bridgedAuth.testDownload,
      newAuthBridge: {
        applied: bridgedAuth.bridgeApplied,
        reason: bridgedAuth.bridgeReason,
      },
      diagnostics: bridgedAuth.diagnostics,
      schemaVersion: 1,
      executedAt,
    },
  };
}

// Normalizes the user-selected real-download batch size to a safe finite range.
function normalizeRealDownloadBatchSize(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.max(1, Math.min(50, Math.trunc(parsed)));
}

async function runtimeIndexRunHandler({ context }: Pick<HandlerArgs, 'context'>): Promise<HandlerResult> {
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

async function runtimeGpsRunHandler({ context }: Pick<HandlerArgs, 'context'>): Promise<HandlerResult> {
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

async function runtimeGeocodeRunHandler({ context }: Pick<HandlerArgs, 'context'>): Promise<HandlerResult> {
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

async function runtimeQueuePrepareHandler({ context }: Pick<HandlerArgs, 'context'>): Promise<HandlerResult> {
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

async function runtimePlaybackSelectCurrentHandler({ context }: Pick<HandlerArgs, 'context'>): Promise<HandlerResult> {
  const selection = await selectCurrentPlayableItem({
    context,
    databaseService: getDatabaseService(),
  });

  if (selection.outcome === 'no_ready_row') {
    throw new HttpError(409, 'no_ready_row', 'No READY slideshow rows exist for playback selection.', {
      database: selection.database,
      stage: selection.stage,
      playback: selection.playback,
    });
  }

  if (selection.outcome === 'no_playable_ready_row') {
    throw new HttpError(409, 'no_playable_ready_row', 'READY slideshow rows exist but none are currently playable.', {
      database: selection.database,
      stage: selection.stage,
      playback: selection.playback,
    });
  }

  return {
    statusCode: 200,
    payload: {
      status: selection.status,
      messages: selection.messages,
      stage: selection.stage,
      playback: selection.playback,
      database: selection.database,
      schemaVersion: selection.schemaVersion,
      executedAt: selection.executedAt,
    },
  };
}

// Streams the selected Windows playback media through the backend so the browser can render it safely.
async function runtimePlaybackMediaHandler({ response, url, context }: Pick<HandlerArgs, 'response' | 'url' | 'context'>): Promise<number> {
  const requestedPath = url.searchParams.get('path');
  if (!requestedPath) {
    throw new HttpError(400, 'missing_media_path', 'Playback media path is required.');
  }

  const mediaPath = path.resolve(requestedPath);
  const extension = path.extname(mediaPath).toLowerCase();
  if (!supportedMediaExtensions.has(extension)) {
    throw new HttpError(415, 'unsupported_media_type', 'Playback media type is not supported by this dashboard renderer.', {
      extension,
    });
  }

  const allowedRoots = buildPlaybackMediaAllowedRoots(context);
  if (!isPathWithinAnyRoot(mediaPath, allowedRoots)) {
    throw new HttpError(403, 'media_path_not_allowed', 'Playback media must be inside the configured download/runtime media directories.', {
      allowedRoots,
    });
  }

  let stats;
  try {
    stats = await fs.stat(mediaPath);
  } catch {
    throw new HttpError(404, 'media_file_missing', 'Playback media file does not exist.', {
      mediaPath,
    });
  }

  if (!stats.isFile()) {
    throw new HttpError(400, 'media_path_not_file', 'Playback media path must point to a regular file.', {
      mediaPath,
    });
  }

  const body = await fs.readFile(mediaPath);
  response.writeHead(200, {
    'Content-Type': resolvePlaybackMediaContentType(extension),
    'Content-Length': body.byteLength,
    'Cache-Control': 'no-store',
  });
  response.end(body);
  return 200;
}

// Builds the allow-list of directories whose media may be streamed to the dashboard.
function buildPlaybackMediaAllowedRoots(context: RequestContext): string[] {
  const roots = [generatedTestDataDirectory, path.join(repoRoot, 'runtime_data')];
  if (context.envValues.DOWNLOAD_DIR) {
    roots.push(resolveRepoPath(context.envValues.DOWNLOAD_DIR));
  }
  return roots.map((candidate) => path.resolve(candidate));
}

// Checks whether a selected media file stays inside one of the explicit media roots.
function isPathWithinAnyRoot(candidatePath: string, roots: string[]): boolean {
  return roots.some((root) => {
    const relative = path.relative(root, candidatePath);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  });
}

// Maps supported media extensions to browser-friendly content types.
function resolvePlaybackMediaContentType(extension: string): string {
  const contentTypes = new Map([
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.png', 'image/png'],
    ['.gif', 'image/gif'],
    ['.bmp', 'image/bmp'],
    ['.webp', 'image/webp'],
    ['.tif', 'image/tiff'],
    ['.tiff', 'image/tiff'],
    ['.heic', 'image/heic'],
    ['.heif', 'image/heif'],
    ['.mp4', 'video/mp4'],
    ['.mov', 'video/quicktime'],
    ['.m4v', 'video/x-m4v'],
    ['.avi', 'video/x-msvideo'],
    ['.mkv', 'video/x-matroska'],
    ['.webm', 'video/webm'],
    ['.wmv', 'video/x-ms-wmv'],
    ['.mpeg', 'video/mpeg'],
    ['.mpg', 'video/mpeg'],
  ]);
  return contentTypes.get(extension) ?? 'application/octet-stream';
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

const ORCHESTRATION_STAGE_PIPELINE: OrchestrationStageDefinition[] = [
  { key: 'download', handler: runtimeDownloadRunHandler },
  { key: 'index', handler: runtimeIndexRunHandler },
  { key: 'gps', handler: runtimeGpsRunHandler },
  { key: 'geocode', handler: runtimeGeocodeRunHandler },
  { key: 'queue_prepare', handler: runtimeQueuePrepareHandler },
  { key: 'playback_select', handler: runtimePlaybackSelectCurrentHandler },
];

async function getOrchestrationState(context: RequestContext, key: string): Promise<OrchestrationState | null> {
  try {
    return await getDatabaseService().getRuntimeState(context, key);
  } catch {
    // If the database is missing or the bridge fails, treat as no state.
    return null;
  }
}

async function setOrchestrationState(context: RequestContext, key: string, value: OrchestrationState): Promise<void> {
  await getDatabaseService().setRuntimeState(context, key, value);
}

async function runtimeOrchestrationRunHandler({ context }: Pick<HandlerArgs, 'context'>): Promise<HandlerResult> {
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
      const payload = isJsonObject(result?.payload) ? result.payload : {};
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
      const failureReason = error instanceof HttpError && error.code ? error.code : getErrorMessage(error);
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

async function runtimeOrchestrationCurrentHandler({ context }: Pick<HandlerArgs, 'context'>): Promise<HandlerResult> {
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

async function runtimeOrchestrationLastHandler({ context }: Pick<HandlerArgs, 'context'>): Promise<HandlerResult> {
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

/**
 * Returns a combined live runtime projection for the dashboard monitor (View D).
 *
 * This handler assembles a runtime projection envelope using the shared
 * `LiveRuntimeProjection` contract.  The projection includes the current run
 * state, worker health, playback state and screen state.  Each field is
 * accompanied by a source label indicating where its value originates (e.g.
 * `db`, `lock`, `heartbeat`, `log`, `computed`, `projection` or `unknown`).
 *
 * The handler never mutates runtime state; it reads from the existing
 * orchestration state and returns unknown or placeholder values for fields
 * without authoritative data yet.  The namespace is hardcoded to
 * `realRuntime` because this endpoint reflects the live runtime projection.
 */
async function runtimeLiveProjectionHandler({ context }: Pick<HandlerArgs, 'context'>): Promise<HandlerResult> {
  // Determine the high‑level run state from the current orchestration state.
  let runStateValue = 'idle';
  let runStateSource: keyof typeof RUNTIME_PROJECTION_SOURCES = 'unknown';
  try {
    const current = await getOrchestrationState(context, 'orchestration_current');
    const status = (current?.status ?? '').toLowerCase();
    if (status) {
      runStateSource = 'db';
      if (status === 'running') {
        runStateValue = 'running';
      } else if (status === 'failed') {
        runStateValue = 'error';
      } else if (status === 'succeeded') {
        runStateValue = 'completed';
      } else {
        runStateValue = status;
      }
    }
  } catch {
    runStateValue = 'unknown';
    runStateSource = 'unknown';
  }

  // Default worker health: unknown for each named worker.  Future slices
  // may populate these values from lock files, heartbeats or other sources.
  const workerHealth: Record<string, { value: { status: string }; source: keyof typeof RUNTIME_PROJECTION_SOURCES }> = {
    'regular-stage-worker': { value: { status: 'unknown' }, source: 'unknown' },
    'playback-worker': { value: { status: 'unknown' }, source: 'unknown' },
    'screen-on-off-worker': { value: { status: 'unknown' }, source: 'unknown' },
  };

  // Default playback projection: unknown values until backend contracts are defined.
  const playback = {
    queueSize: { value: null, source: 'unknown' as keyof typeof RUNTIME_PROJECTION_SOURCES },
    currentItemId: { value: null, source: 'unknown' as keyof typeof RUNTIME_PROJECTION_SOURCES },
    isPlaying: { value: null, source: 'unknown' as keyof typeof RUNTIME_PROJECTION_SOURCES },
  };

  // Default screen projection: unknown values until backend contracts are defined.
  const screen = {
    previewAvailable: { value: null, source: 'unknown' as keyof typeof RUNTIME_PROJECTION_SOURCES },
    fullscreenAvailable: { value: null, source: 'unknown' as keyof typeof RUNTIME_PROJECTION_SOURCES },
    lastRenderedAt: { value: null, source: 'unknown' as keyof typeof RUNTIME_PROJECTION_SOURCES },
  };

  const projection = {
    namespace: RUNTIME_NAMESPACES.realRuntime,
    runState: { value: runStateValue, source: runStateSource },
    workerHealth,
    playback,
    screen,
  };

  const envelope = {
    ok: true,
    namespace: RUNTIME_NAMESPACES.realRuntime,
    projection,
  };

  return { statusCode: 200, payload: envelope };
}

// Builds the public scheduler route envelope around the resolved scheduler task result.
async function buildSchedulerRouteResponse(
  context: RequestContext,
  operation: SchedulerRouteOperation,
  options: { requestedTarget?: SchedulerTarget | null; crontabText?: string | null } = {},
): Promise<HandlerResult> {
  const scheduler = await resolveSchedulerOperation(context, operation, options);
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

async function buildRequestContext(): Promise<RequestContext> {
  const envValues = await loadEnvValues();
  return {
    envValues,
    platform: process.platform,
    nodePath: process.execPath,
    username: process.env.USERNAME || process.env.USER || null,
  };
}

async function loadEnvValues(): Promise<EnvValues> {
  const envFilePath = resolveEnvFilePath();
  let raw;
  try {
    raw = await fs.readFile(envFilePath, 'utf8');
  } catch (error) {
    throw new HttpError(500, 'env_file_read_failed', 'Failed to read the configured env file.', {
      envFilePath,
      message: getErrorMessage(error),
    });
  }
  const values: EnvValues = {};
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

async function resolveInitialLogDirectory(): Promise<string> {
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

// Reads the startup-only verbose log gate from process env or the configured env file.
async function resolveInitialFullLogVerboseEnabled(): Promise<boolean> {
  if (typeof process.env.FULL_LOG_VERBOSE === 'string' && process.env.FULL_LOG_VERBOSE.trim()) {
    return process.env.FULL_LOG_VERBOSE.trim() === 'true';
  }

  let raw;
  try {
    raw = await fs.readFile(resolveEnvFilePath(), 'utf8');
  } catch {
    return false;
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
    if (key === 'FULL_LOG_VERBOSE') {
      return trimmed.slice(separatorIndex + 1).trim() === 'true';
    }
  }

  return false;
}

function resolveEnvFilePath(): string {
  const overridePath = process.env.INIT_ENV_FILE;
  if (!overridePath || overridePath.trim() === '') {
    return defaultEnvFilePath;
  }
  if (path.isAbsolute(overridePath)) {
    return overridePath;
  }
  return path.resolve(repoRoot, overridePath);
}

function getAuthReadinessChecks(context: RequestContext): EnvCheck[] {
  const authEnvKeys = new Set(['user', 'pw', 'ICLOUDPD_COOKIE_DIR']);
  return envSchema
    .filter((entry) => authEnvKeys.has(entry.key))
    .map((entry) => buildEnvCheck(entry, context.envValues));
}

function buildEnvCheck(entry: EnvSchemaEntry, envValues: EnvValues): EnvCheck {
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

function buildEnvCheckDetails(entry: EnvSchemaEntry, rawValue: string | undefined, nonEmpty: boolean): EnvCheckDetails {
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

function validateEnvValue(entry: EnvSchemaEntry, rawValue: string | undefined): EnvValidationResult {
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

let databaseService: DatabaseService | null = null;

function getDatabaseService(): DatabaseService {
  if (!databaseService) {
    databaseService = createDatabaseService({
      repoRoot,
      createHttpError: (statusCode, code, message, details) => new HttpError(statusCode, code, message, details),
    });
  }
  return databaseService;
}

function previewValue(entry: EnvSchemaEntry, rawValue: string): string {
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

async function buildDatabaseStatus(context: RequestContext): Promise<DatabaseStatusPayload> {
  return getDatabaseService().buildDatabaseStatus(context);
}

async function buildDatabaseViewerVerification(context: RequestContext): Promise<unknown> {
  return getDatabaseService().buildDatabaseViewerVerification(context);
}

function buildDatabaseViewerVerificationMessages(verification: Parameters<DatabaseService['buildDatabaseViewerVerificationMessages']>[0]): string[] {
  return getDatabaseService().buildDatabaseViewerVerificationMessages(verification);
}

function buildDatabaseViewerLoggingState(options: DatabaseViewerLoggingStateOptions = {}) {
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

function recordDatabaseViewerActivity(entry: DatabaseViewerActivityInput = {}): void {
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

function resolveRepoPath(relativeOrAbsolutePath: string): string {
  return getDatabaseService().resolveRepoPath(relativeOrAbsolutePath);
}

function getSchemaPath(): string {
  return getDatabaseService().getSchemaPath();
}

function getDatabaseArtifactPaths(databaseOrAbsolutePath: Parameters<DatabaseService['getDatabaseArtifactPaths']>[0]): string[] {
  return getDatabaseService().getDatabaseArtifactPaths(databaseOrAbsolutePath);
}

function getDatabaseViewerLoggingCoverage(): string {
  return getDatabaseService().getDatabaseViewerLoggingCoverage();
}

async function inspectDatabase(context: RequestContext): Promise<unknown> {
  return getDatabaseService().inspectDatabase(context);
}

async function deleteDatabaseArtifacts(context: RequestContext): Promise<unknown> {
  return getDatabaseService().deleteDatabaseArtifacts(context);
}

async function recreateEmptyDatabase(context: RequestContext): Promise<unknown> {
  return getDatabaseService().recreateEmptyDatabase(context);
}

async function listDatabaseViewerTables(context: RequestContext): Promise<unknown> {
  return getDatabaseService().listDatabaseViewerTables(context);
}

async function loadDatabaseViewerRows(context: RequestContext, body: JsonObject): Promise<unknown> {
  return getDatabaseService().loadDatabaseViewerRows(context, body);
}

async function readJsonBody(request: IncomingMessage): Promise<JsonObject> {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw) as JsonObject;
  } catch (error) {
    throw new HttpError(400, 'invalid_json', 'Request body must be valid JSON.', { raw });
  }
}

async function runPythonJson<T = unknown>(args: string[]): Promise<T> {
  return getDatabaseService().runPythonJson(args);
}

function runProcess(command: string, args: string[], options: { shell?: boolean } = {}): Promise<ProcessResult> {
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

async function collectSupportedMediaFiles(rootDirectory: string): Promise<string[]> {
  const files = [];
  await collectSupportedMediaFilesRecursive(rootDirectory, files);
  files.sort();
  return files;
}

async function collectRegularFiles(rootDirectory: string): Promise<string[]> {
  const files = [];
  await collectRegularFilesRecursive(rootDirectory, files);
  files.sort();
  return files;
}

async function collectSupportedMediaFilesRecursive(directoryPath: string, sink: string[]): Promise<void> {
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

async function collectRegularFilesRecursive(directoryPath: string, sink: string[]): Promise<void> {
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

async function copyMockDownloadFiles({ sourceFiles, sourceRoot, destinationRoot }: CopyMockDownloadFilesInput): Promise<CopyMockDownloadFilesResult> {
  const copiedRelativePaths = [];
  const failedCopies = [];

  for (const sourceFile of sourceFiles) {
    const relativePath = path.relative(sourceRoot, sourceFile);
    const destinationFile = path.join(destinationRoot, relativePath);
    try {
      await fs.mkdir(path.dirname(destinationFile), { recursive: true });
      await fs.copyFile(sourceFile, destinationFile);
      copiedRelativePaths.push(relativePath);
    } catch (error: unknown) {
      failedCopies.push({
        relativePath,
        message: getErrorMessage(error),
      });
    }
  }

  return {
    copiedCount: copiedRelativePaths.length,
    copiedRelativePaths,
    failedCopies,
  };
}

function ensureConfirmed(body: JsonObject, expectedAction: string): void {
  if (!body || body.confirm !== true || body.action !== expectedAction) {
    throw new HttpError(400, 'missing_confirmation', `The ${expectedAction} action requires an explicit confirmation payload.`, {
      expected: { confirm: true, action: expectedAction },
    });
  }
}

function normalizeRequestedSchedulerTarget(value: unknown): SchedulerTarget | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  return isSchedulerTarget(normalized) ? normalized : null;
}

function getRequestedSchedulerTarget(url: URL, body: JsonObject): SchedulerTarget | null {
  return normalizeRequestedSchedulerTarget(url.searchParams.get('target')) ?? normalizeRequestedSchedulerTarget(body?.target);
}

function defaultSchedulerTargetForContext(context: RequestContext): SchedulerTarget {
  return context.platform === 'linux' ? SCHEDULER_TARGETS.raspberryRealCrontab : SCHEDULER_TARGETS.windowsCronEmulator;
}

function runtimePlatformForSchedulerTarget(target: SchedulerTarget): string {
  return target === SCHEDULER_TARGETS.raspberryRealCrontab ? 'linux' : 'windows';
}

// Maps emulator-specific routes back to existing scheduler capability operations.
function schedulerCapabilityOperationForRoute(operation: SchedulerRouteOperation): SchedulerOperation {
  if (operation === schedulerEmulatorOperations.check || operation === schedulerEmulatorOperations.stop) {
    return SCHEDULER_OPERATION_SUPPORT.status;
  }
  if (operation === schedulerEmulatorOperations.run || operation === schedulerEmulatorOperations.installCrontab) {
    return SCHEDULER_OPERATION_SUPPORT.install;
  }
  if (operation === schedulerEmulatorOperations.activeCrontab) {
    return SCHEDULER_OPERATION_SUPPORT.print;
  }
  return isSchedulerOperation(operation) ? operation : SCHEDULER_OPERATION_SUPPORT.status;
}

// Checks whether a route operation is one of the shared scheduler capability operations.
function isSchedulerOperation(operation: SchedulerRouteOperation): operation is SchedulerOperation {
  return Object.values(SCHEDULER_OPERATION_SUPPORT).includes(operation as SchedulerOperation);
}

async function readSchedulerTargetSelection(context: RequestContext): Promise<SchedulerTargetSelection> {
  try {
    const raw = await fs.readFile(schedulerTargetSelectionFilePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (isJsonObject(parsed) && isSchedulerTarget(parsed.selectedTarget)) {
      return {
        selectedTarget: parsed.selectedTarget,
        source: 'file',
        targetFilePath: schedulerTargetSelectionFilePath,
        selectedAt: typeof parsed.selectedAt === 'string' ? parsed.selectedAt : undefined,
      };
    }
  } catch {
    // Missing or invalid selection files fall back to the platform default.
  }

  return {
    selectedTarget: defaultSchedulerTargetForContext(context),
    source: 'default',
    targetFilePath: schedulerTargetSelectionFilePath,
  };
}

async function writeSchedulerTargetSelection(context: RequestContext, selectedTarget: SchedulerTarget): Promise<SchedulerTargetSelection> {
  const selection = {
    selectedTarget,
    selectedAt: new Date().toISOString(),
    platformAtSelection: context.platform,
    schemaVersion: schedulerSchemaVersion,
  };
  await fs.mkdir(path.dirname(schedulerTargetSelectionFilePath), { recursive: true });
  await fs.writeFile(schedulerTargetSelectionFilePath, `${JSON.stringify(selection, null, 2)}\n`, 'utf8');
  return {
    selectedTarget,
    source: 'request',
    targetFilePath: schedulerTargetSelectionFilePath,
    selectedAt: selection.selectedAt,
  };
}

function buildSchedulerTargetPayload(context: RequestContext, selection: SchedulerTargetSelection, message: string): JsonObject {
  return {
    status: 'ok',
    messages: [message],
    selectedTarget: selection.selectedTarget,
    selection,
    platform: context.platform,
    targets: {
      [SCHEDULER_TARGETS.windowsCronEmulator]: {
        label: 'WINDOWS (crontab emulator)',
        active: selection.selectedTarget === SCHEDULER_TARGETS.windowsCronEmulator,
        capability: createSchedulerCapability({ runtimePlatform: 'windows' }),
      },
      [SCHEDULER_TARGETS.raspberryRealCrontab]: {
        label: 'RASPBERRY (real crontab)',
        active: selection.selectedTarget === SCHEDULER_TARGETS.raspberryRealCrontab,
        capability: createSchedulerCapability({ runtimePlatform: 'linux' }),
      },
    },
    schemaVersion: schedulerSchemaVersion,
  };
}

// Resolves scheduler actions against the selected platform target while preserving inactive-target deferral.
async function resolveSchedulerOperation(
  context: RequestContext,
  operation: SchedulerRouteOperation,
  options: { requestedTarget?: SchedulerTarget | null; crontabText?: string | null } = {},
) {
  const selection = await readSchedulerTargetSelection(context);
  const requestedTarget = options.requestedTarget ?? selection.selectedTarget;
  const capability = createSchedulerCapability({ runtimePlatform: runtimePlatformForSchedulerTarget(requestedTarget) });
  const capabilityOperation = schedulerCapabilityOperationForRoute(operation);
  const operationSupportLevel = getOperationSupportLevel(capability, capabilityOperation);
  const definition = buildSchedulerDefinition(context, capability, selection);

  if (requestedTarget !== selection.selectedTarget) {
    return buildDeferredSchedulerPayload({
      context,
      capability,
      definition,
      selection,
      operation,
      operationSupportLevel: SCHEDULER_SUPPORT_LEVELS.deferred,
      reason: `${requestedTarget} is inactive because ${selection.selectedTarget} is the selected scheduler target.`,
    });
  }

  if (!isOperationExecutable(capability, capabilityOperation)) {
    return buildDeferredSchedulerPayload({
      context,
      capability,
      definition,
      selection,
      operation,
      operationSupportLevel,
    });
  }

  if (selection.selectedTarget === SCHEDULER_TARGETS.windowsCronEmulator) {
    return resolveWindowsCronEmulatorOperation({
      context,
      capability,
      definition,
      selection,
      operation,
      operationSupportLevel,
      crontabText: options.crontabText ?? null,
    });
  }

  if (selection.selectedTarget === SCHEDULER_TARGETS.raspberryRealCrontab) {
    return resolveRaspberryCrontabOperation({
      context,
      capability,
      definition,
      selection,
      operation,
      operationSupportLevel,
    });
  }

  return buildDeferredSchedulerPayload({
    context,
    capability,
    definition,
    selection,
    operation,
    operationSupportLevel: SCHEDULER_SUPPORT_LEVELS.unsupported,
    reason: `No scheduler implementation exists for selected target ${selection.selectedTarget}.`,
  });
}

function buildSchedulerDefinition(
  context: RequestContext,
  capability: SchedulerCapability,
  selection: SchedulerTargetSelection,
): SchedulerDefinition {
  const logDirectory = resolveRepoPath(context.envValues.LOG_DIR || DEFAULT_LOG_DIR);
  return {
    routeLabel: capability.routeCompatibility,
    taskName: selection.selectedTarget === SCHEDULER_TARGETS.windowsCronEmulator ? 'CronEmulator' : '1_PF user crontab block',
    selectedTarget: selection.selectedTarget,
    platformTarget: capability.schedulerTarget,
    schedulerMode: capability.schedulerMode,
    nodePath: context.nodePath,
    nodeArguments: selection.selectedTarget === SCHEDULER_TARGETS.windowsCronEmulator ? [] : schedulerNodeArguments,
    scriptPath: selection.selectedTarget === SCHEDULER_TARGETS.windowsCronEmulator ? path.join(cronEmulatorRoot, 'src', 'cronemulator', 'app.py') : null,
    repoRoot,
    logDirectory,
    runtimeDirectory: schedulerRuntimeDirectory,
    statusFilePath: schedulerTargetSelectionFilePath,
    username: context.username,
    cadence: schedulerTickSeconds,
    notes: capability.notes,
  };
}

// Executes Windows CronEmulator actions through the external emulator process and crontab file.
async function resolveWindowsCronEmulatorOperation({
  context,
  capability,
  definition,
  selection,
  operation,
  operationSupportLevel,
  crontabText,
}: SchedulerOperationInput) {
  if (context.platform !== 'win32') {
    return buildDeferredSchedulerPayload({
      context,
      capability,
      definition,
      selection,
      operation,
      operationSupportLevel: SCHEDULER_SUPPORT_LEVELS.deferred,
      reason: 'Windows CronEmulator runner is only executable from a Windows backend host.',
    });
  }

  const toolAvailable = await fileExists(path.join(cronEmulatorSourcePath, 'cronemulator', 'app.py'));
  if (!toolAvailable) {
    return buildSchedulerPayload({
      context,
      definition,
      capability,
      selection,
      operation,
      operationSupportLevel,
      task: buildCronEmulatorTask({ operation, installed: false, running: false }),
      host: {
        observed: false,
        state: 'missing-tool',
        message: 'tools/CronEmulator is not available in this checkout.',
      },
      includeExportedXml: false,
      overrideStatus: 'error',
      prependMessages: ['Windows scheduler target is selected, but tools/CronEmulator is missing.'],
    });
  }

  await fs.mkdir(cronEmulatorRuntimeDirectory, { recursive: true });

  if (operation === schedulerEmulatorOperations.installCrontab) {
    const installedText = normalizeCronEmulatorCrontabText(crontabText);
    await fs.mkdir(path.dirname(cronEmulatorDefaultCrontabPath), { recursive: true });
    await fs.writeFile(cronEmulatorDefaultCrontabPath, installedText, 'utf8');
    await postCronEmulator('/api/reload').catch(() => null);
  }

  if (operation === SCHEDULER_OPERATION_SUPPORT.install || operation === schedulerEmulatorOperations.run) {
    startCronEmulatorProcess();
    await waitForCronEmulatorState();
    await postCronEmulator('/api/scheduler/start').catch(() => null);
  }

  if (operation === schedulerEmulatorOperations.stop) {
    await postCronEmulator('/api/scheduler/stop').catch(() => null);
    await stopOwnedCronEmulatorProcess();
  }

  const emulatorState = await fetchCronEmulatorState();
  const running = Boolean(emulatorState && isJsonObject(emulatorState) && emulatorState.scheduler_running === true);
  const stateObserved = emulatorState !== null;
  const rawCrontab = await readTextIfExists(cronEmulatorDefaultCrontabPath);
  const messages = [
    buildCronEmulatorOperationMessage(operation),
    operation === schedulerEmulatorOperations.installCrontab
      ? 'CronEmulator crontab file was written from the submitted textarea content.'
      : null,
    operation === SCHEDULER_OPERATION_SUPPORT.install || operation === schedulerEmulatorOperations.run
      ? 'Windows CronEmulator process launch was requested and scheduler start was attempted.'
      : null,
    operation === schedulerEmulatorOperations.stop
      ? 'Windows CronEmulator scheduler stop was requested and the backend-owned process was stopped when present.'
      : null,
    stateObserved
      ? `CronEmulator API responded; scheduler is ${running ? 'running' : 'stopped'}.`
      : 'CronEmulator API did not respond on 127.0.0.1:8765.',
  ].filter(Boolean);

  return buildSchedulerPayload({
    context,
    definition,
    capability,
    selection,
    operation,
    operationSupportLevel,
    task: buildCronEmulatorTask({
      operation,
      installed: true,
      running,
      stopped: operation === schedulerEmulatorOperations.stop && !running,
      crontabInstalled: operation === schedulerEmulatorOperations.installCrontab,
      rawCrontab: shouldIncludeCronEmulatorCrontab(operation) ? rawCrontab : undefined,
      apiState: shouldIncludeCronEmulatorApiState(operation) ? emulatorState : undefined,
    }),
    host: {
      observed: stateObserved,
      state: stateObserved ? (running ? 'running' : 'stopped') : 'not-observed',
      statusFilePath: cronEmulatorStateUrl,
      message: stateObserved ? 'CronEmulator local API responded.' : 'CronEmulator local API is not reachable.',
      payload: emulatorState ?? undefined,
    },
    includeExportedXml: false,
    overrideStatus: resolveCronEmulatorPayloadStatus(operation, { running, stateObserved }),
    prependMessages: messages,
  });
}

async function resolveRaspberryCrontabOperation({
  context,
  capability,
  definition,
  selection,
  operation,
  operationSupportLevel,
}: SchedulerOperationInput) {
  if (context.platform !== 'linux') {
    return buildDeferredSchedulerPayload({
      context,
      capability,
      definition,
      selection,
      operation,
      operationSupportLevel: SCHEDULER_SUPPORT_LEVELS.deferred,
      reason: 'Real Raspberry crontab operations are only executable from a Linux/Raspberry backend host.',
    });
  }

  const current = await readUserCrontab();
  const managedBlock = buildRaspberryCrontabBlock();
  const installed = current.includes(raspberryCrontabStartMarker) && current.includes(raspberryCrontabEndMarker);

  if (operation === SCHEDULER_OPERATION_SUPPORT.install) {
    const nextCrontab = upsertManagedCrontabBlock(current, managedBlock);
    await installUserCrontab(nextCrontab);
  }

  const latest = operation === SCHEDULER_OPERATION_SUPPORT.install ? await readUserCrontab() : current;
  const latestInstalled = latest.includes(raspberryCrontabStartMarker) && latest.includes(raspberryCrontabEndMarker);

  return buildSchedulerPayload({
    context,
    definition,
    capability,
    selection,
    operation,
    operationSupportLevel,
    task: {
      installed: latestInstalled,
      supported: true,
      operation,
      supportLevel: operationSupportLevel,
      markers: {
        start: raspberryCrontabStartMarker,
        end: raspberryCrontabEndMarker,
      },
      managedBlock: operation === SCHEDULER_OPERATION_SUPPORT.print ? managedBlock : undefined,
      currentCrontab: operation === SCHEDULER_OPERATION_SUPPORT.print ? latest : undefined,
      previouslyInstalled: installed,
    },
    host: {
      observed: latestInstalled,
      state: latestInstalled ? 'installed' : 'not-installed',
      message: latestInstalled
        ? 'Project-owned crontab block is present in the current user crontab.'
        : 'Project-owned crontab block is not present in the current user crontab.',
    },
    includeExportedXml: false,
    overrideStatus: latestInstalled ? 'ok' : 'warning',
    prependMessages: [
      operation === SCHEDULER_OPERATION_SUPPORT.install
        ? 'Real Raspberry crontab project block was installed or refreshed.'
        : 'Real Raspberry crontab state was inspected.',
      'Only the project-owned crontab block is managed; unrelated user crontab entries are preserved.',
    ],
  });
}


// Builds actual Windows CronEmulator run evidence from its in-memory state API.
async function buildWindowsCronRunLog() {
  const emulatorState = await fetchCronEmulatorState();
  const state = isJsonObject(emulatorState) ? emulatorState : null;
  const logs = Array.isArray(state?.logs) ? state.logs : [];
  const entries = logs
    .map((entry) => buildCronEmulatorRunLogEntry(entry))
    .filter((entry): entry is JsonObject => entry !== null)
    .slice(0, 80);

  return {
    source: 'windows-cron-emulator-api-state',
    observed: state !== null,
    running: state?.scheduler_running === true,
    message: state
      ? `Read ${entries.length} actual CronEmulator row execution log entr${entries.length === 1 ? 'y' : 'ies'}.`
      : 'CronEmulator API is not reachable, so actual row execution logs cannot be read yet.',
    entries,
    generatedAt: new Date().toISOString(),
  };
}

// Converts one CronEmulator API log record into the dashboard terminal row schema.
function buildCronEmulatorRunLogEntry(value: unknown): JsonObject | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const timestamp = typeof value.timestamp === 'string' ? value.timestamp : new Date().toISOString();
  const jobId = typeof value.job_id === 'string' ? value.job_id : 'unknown-job';
  const jobName = typeof value.job_name === 'string' ? value.job_name : jobId;
  const status = typeof value.status === 'string' ? value.status : 'unknown';
  const returnCode = typeof value.return_code === 'number' ? value.return_code : null;
  const rawCronRow = typeof value.raw_cron_row === 'string' ? value.raw_cron_row : '';
  const command = typeof value.command === 'string' ? value.command : '';
  const stdoutSummary = typeof value.stdout_summary === 'string' ? value.stdout_summary : '';
  const stderrSummary = typeof value.stderr_summary === 'string' ? value.stderr_summary : '';
  const ok = status === 'success' && (returnCode === 0 || returnCode === null);

  return {
    id: `cron-run:${jobId}:${timestamp}:${returnCode ?? 'none'}:${status}`,
    at: formatLocalTime(timestamp),
    atIso: timestamp,
    type: ok ? 'cron-run-success' : 'cron-run-failed',
    operation: 'Cron row executed',
    method: 'CRON',
    endpoint: jobName,
    message: buildCronRunLogMessage({ jobName, status, returnCode, stdoutSummary, stderrSummary }),
    status: returnCode,
    jobId,
    jobName,
    rawCronRow,
    command,
    stdoutSummary,
    stderrSummary,
    actualCronRowCall: true,
    source: 'CronEmulator',
  };
}

// Builds actual Raspberry cron worker evidence from project JSONL logs.
async function buildRaspberryCronRunLog(context: RequestContext) {
  const logDirectory = resolveRepoPath(context.envValues.LOG_DIR || DEFAULT_LOG_DIR);
  const fullLogPath = path.join(logDirectory, 'full_log.log');
  const lines = await readRecentLines(fullLogPath, 1200);
  const entries = lines
    .map((line) => parseJsonLine(line))
    .filter((entry): entry is JsonObject => entry !== null)
    .map((entry) => buildRaspberryRunLogEntry(entry))
    .filter((entry): entry is JsonObject => entry !== null)
    .slice(0, 80);

  return {
    source: 'project-full-log-scheduler-worker-entries',
    observed: entries.length > 0,
    running: null,
    message: entries.length
      ? `Read ${entries.length} Raspberry cron worker invocation entr${entries.length === 1 ? 'y' : 'ies'} from full_log.log.`
      : 'No Raspberry cron worker invocation entries were found in full_log.log yet.',
    logFilePath: fullLogPath,
    entries,
    generatedAt: new Date().toISOString(),
  };
}

// Converts one project logger entry into the dashboard terminal row schema when it is cron-related.
function buildRaspberryRunLogEntry(entry: JsonObject): JsonObject | null {
  const message = typeof entry.message === 'string' ? entry.message : '';
  if (!['Scheduler worker invoked by cron/crontab.', 'Scheduler worker invocation failed.', 'playback_worker completed.'].includes(message)) {
    return null;
  }
  const details: JsonObject = isJsonObject(entry.details) ? entry.details : {};
  const worker = typeof details.worker === 'string' ? details.worker : 'scheduler-worker';
  const atIso = typeof entry.at === 'string' ? entry.at : new Date().toISOString();
  const failed = message.includes('failed') || entry.level === 'error' || details.status === 'failed';

  return {
    id: `raspberry-cron:${worker}:${atIso}:${message}`,
    at: formatLocalTime(atIso),
    atIso,
    type: failed ? 'cron-run-failed' : 'cron-run-success',
    operation: 'Raspberry cron worker observed',
    method: 'CRON',
    endpoint: worker,
    message: failed ? `${worker} cron row failed or reached an unsupported worker.` : `${worker} cron row was invoked by crontab.`,
    status: failed ? 1 : 0,
    jobName: worker,
    rawCronRow: null,
    command: typeof details.command === 'string' ? details.command : '',
    actualCronRowCall: true,
    source: 'Raspberry crontab',
  };
}

// Formats cron run evidence timestamps into compact local terminal time.
function formatLocalTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Builds a compact human-readable result message for one cron row execution.
function buildCronRunLogMessage({
  jobName,
  status,
  returnCode,
  stdoutSummary,
  stderrSummary,
}: {
  jobName: string;
  status: string;
  returnCode: number | null;
  stdoutSummary: string;
  stderrSummary: string;
}): string {
  const result = returnCode === null ? status : `${status} rc=${returnCode}`;
  const summary = stderrSummary || stdoutSummary;
  return summary ? `${jobName} executed: ${result}; ${summary}` : `${jobName} executed: ${result}.`;
}

// Reads the tail of a UTF-8 text file without throwing when the file is missing.
async function readRecentLines(filePath: string, maxLines: number): Promise<string[]> {
  const text = await readTextIfExists(filePath);
  if (!text) {
    return [];
  }
  return text.split(/\r?\n/).filter(Boolean).slice(-maxLines).reverse();
}

// Parses one JSONL line and returns null when it is malformed.
function parseJsonLine(line: string): JsonObject | null {
  try {
    const parsed = JSON.parse(line);
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Builds the task payload describing the Windows CronEmulator runner.
function buildCronEmulatorTask({
  operation,
  installed,
  running,
  stopped,
  crontabInstalled,
  rawCrontab,
  apiState,
}: {
  operation: SchedulerRouteOperation;
  installed: boolean;
  running: boolean;
  stopped?: boolean;
  crontabInstalled?: boolean;
  rawCrontab?: string;
  apiState?: unknown;
}): SchedulerTaskResult {
  return {
    installed,
    supported: true,
    operation,
    supportLevel: installed ? SCHEDULER_SUPPORT_LEVELS.supported : SCHEDULER_SUPPORT_LEVELS.unsupported,
    running,
    stopped,
    crontabInstalled,
    apiUrl: `http://${cronEmulatorHost}:${cronEmulatorPort}`,
    crontabPath: cronEmulatorDefaultCrontabPath,
    logFilePath: cronEmulatorLogFilePath,
    rawCrontab,
    apiState,
  };
}

// Builds the top-line message for one CronEmulator operation.
function buildCronEmulatorOperationMessage(operation: SchedulerRouteOperation): string {
  if (operation === schedulerEmulatorOperations.check || operation === SCHEDULER_OPERATION_SUPPORT.status) {
    return 'Windows CronEmulator scheduler status was checked through its local dashboard API when available.';
  }
  if (operation === schedulerEmulatorOperations.activeCrontab || operation === SCHEDULER_OPERATION_SUPPORT.print) {
    return 'Windows CronEmulator active crontab was read from its local API or crontab file.';
  }
  if (operation === schedulerEmulatorOperations.installCrontab) {
    return 'Windows CronEmulator crontab installation was requested.';
  }
  if (operation === schedulerEmulatorOperations.stop) {
    return 'Windows CronEmulator stop was requested.';
  }
  return 'Windows CronEmulator operation was requested.';
}

// Decides whether to include raw crontab text in a scheduler payload.
function shouldIncludeCronEmulatorCrontab(operation: SchedulerRouteOperation): boolean {
  return operation === SCHEDULER_OPERATION_SUPPORT.print
    || operation === schedulerEmulatorOperations.activeCrontab
    || operation === schedulerEmulatorOperations.installCrontab;
}

// Decides whether to include the CronEmulator API state snapshot.
function shouldIncludeCronEmulatorApiState(operation: SchedulerRouteOperation): boolean {
  return operation === SCHEDULER_OPERATION_SUPPORT.status
    || operation === SCHEDULER_OPERATION_SUPPORT.print
    || operation === schedulerEmulatorOperations.check
    || operation === schedulerEmulatorOperations.run
    || operation === schedulerEmulatorOperations.stop
    || operation === schedulerEmulatorOperations.activeCrontab;
}

// Maps CronEmulator operation state to the shared init payload status.
function resolveCronEmulatorPayloadStatus(
  operation: SchedulerRouteOperation,
  { running, stateObserved }: { running: boolean; stateObserved: boolean },
): string {
  if (operation === schedulerEmulatorOperations.run) {
    return running ? 'ok' : 'warning';
  }
  if (operation === schedulerEmulatorOperations.stop) {
    return running ? 'warning' : 'ok';
  }
  if (operation === schedulerEmulatorOperations.installCrontab || operation === schedulerEmulatorOperations.activeCrontab) {
    return 'ok';
  }
  return stateObserved && running ? 'ok' : 'warning';
}

// Normalizes posted crontab text before writing it to the emulator file.
function normalizeCronEmulatorCrontabText(value: string | null | undefined): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'invalid_crontab_text', 'Install crontab requires non-empty crontabText.', {
      expected: { crontabText: 'five cron fields plus command, one row per job' },
    });
  }

  return `${value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd()}\n`;
}

// Waits briefly for a newly spawned CronEmulator process to expose its API.
async function waitForCronEmulatorState(timeoutMs = 2600): Promise<unknown | null> {
  const deadline = Date.now() + timeoutMs;
  let state = await fetchCronEmulatorState();
  while (state === null && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    state = await fetchCronEmulatorState();
  }
  return state;
}

// Stops the backend-owned CronEmulator process without touching external owners.
async function stopOwnedCronEmulatorProcess(): Promise<void> {
  if (!cronEmulatorProcess || cronEmulatorProcess.exitCode !== null || cronEmulatorProcess.killed) {
    return;
  }

  const processToStop = cronEmulatorProcess;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      if (!processToStop.killed) {
        processToStop.kill();
      }
      resolve();
    }, 1200);
    processToStop.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    processToStop.kill();
  });
}

// Starts the repo-local CronEmulator Python process if this backend does not own one.
function startCronEmulatorProcess(): void {
  if (cronEmulatorProcess && cronEmulatorProcess.exitCode === null && !cronEmulatorProcess.killed) {
    return;
  }

  cronEmulatorProcess = spawn(
    'python',
    ['-m', 'cronemulator.app', cronEmulatorDefaultCrontabPath, '--log-file', cronEmulatorLogFilePath],
    {
      cwd: cronEmulatorRoot,
      env: {
        ...process.env,
        PYTHONPATH: cronEmulatorSourcePath,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  cronEmulatorProcess.stdout.on('data', (chunk) => {
    void logger.info('CronEmulator stdout.', { output: String(chunk).trim() });
  });
  cronEmulatorProcess.stderr.on('data', (chunk) => {
    void logger.error('CronEmulator stderr.', { output: String(chunk).trim() });
  });
  cronEmulatorProcess.on('exit', (code, signal) => {
    void logger.info('CronEmulator process exited.', { code, signal });
    cronEmulatorProcess = null;
  });
}

async function fetchCronEmulatorState(): Promise<unknown | null> {
  try {
    const response = await fetchWithTimeout(cronEmulatorStateUrl, { method: 'GET' }, 1200);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

async function postCronEmulator(pathname: string): Promise<unknown | null> {
  const response = await fetchWithTimeout(`http://${cronEmulatorHost}:${cronEmulatorPort}${pathname}`, { method: 'POST' }, 1200);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

function buildRaspberryCrontabBlock(): string {
  // Builds only the project-owned Raspberry crontab block with shared playback command text.
  return [
    raspberryCrontabStartMarker,
    RASPBERRY_REGULAR_STAGE_WORKER_CRON_ROW,
    RASPBERRY_PLAYBACK_WORKER_CRON_ROW,
    RASPBERRY_SCREEN_ON_OFF_WORKER_CRON_ROW,
    raspberryCrontabEndMarker,
  ].join('\n');
}

async function readUserCrontab(): Promise<string> {
  const result = await runProcess('crontab', ['-l']);
  if (result.code === 0) {
    return result.stdout;
  }
  if (/no crontab/i.test(result.stderr)) {
    return '';
  }
  throw new HttpError(500, 'crontab_read_failed', 'Failed to read the current user crontab.', {
    stderr: result.stderr.trim() || null,
  });
}

async function installUserCrontab(content: string): Promise<void> {
  await fs.mkdir(schedulerRuntimeDirectory, { recursive: true });
  const tempPath = path.join(schedulerRuntimeDirectory, 'raspberry-crontab.install.tmp');
  await fs.writeFile(tempPath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
  const result = await runProcess('crontab', [tempPath]);
  await fs.rm(tempPath, { force: true }).catch(() => {});
  if (result.code !== 0) {
    throw new HttpError(500, 'crontab_install_failed', 'Failed to install the project-owned crontab block.', {
      stderr: result.stderr.trim() || null,
    });
  }
}

function upsertManagedCrontabBlock(current: string, managedBlock: string): string {
  const blockWithNewline = `${managedBlock}\n`;
  const startIndex = current.indexOf(raspberryCrontabStartMarker);
  const endIndex = current.indexOf(raspberryCrontabEndMarker);
  if (startIndex >= 0 && endIndex > startIndex) {
    const endWithMarker = endIndex + raspberryCrontabEndMarker.length;
    return `${current.slice(0, startIndex).trimEnd()}\n${blockWithNewline}${current.slice(endWithMarker).trimStart()}`.trim() + '\n';
  }
  return `${current.trimEnd()}\n\n${blockWithNewline}`.trimStart();
}

function buildDeferredSchedulerPayload({
  context,
  capability,
  definition,
  selection,
  operation,
  operationSupportLevel,
  reason,
}: DeferredSchedulerPayloadInput) {
  const profileLabel = capability.profileLabel || 'current platform';
  const operationLabel = operation.toUpperCase();
  const messages = [
    `${operationLabel} is ${operationSupportLevel} for ${profileLabel} in this repository.`,
    reason || 'No scheduler installation or runtime service wiring was performed by this request.',
  ];

  if (!reason && (operation === SCHEDULER_OPERATION_SUPPORT.status || operation === SCHEDULER_OPERATION_SUPPORT.print)) {
    messages[1] = 'This response is informational and reports platform capability state only.';
  }

  return buildSchedulerPayload({
    context,
    definition,
    capability,
    selection,
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
  selection,
  operation,
  operationSupportLevel,
  task,
  host,
  includeExportedXml,
  overrideStatus,
  prependMessages = [],
}: BuildSchedulerPayloadInput) {
  const installed = Boolean(task?.installed);
  const hostRunning = host?.state === 'running';
  const status = overrideStatus || (!installed ? 'warning' : hostRunning ? 'ok' : 'warning');
  const messages = [...prependMessages];

  if (operationSupportLevel === SCHEDULER_SUPPORT_LEVELS.supported) {
    if (!installed) {
      messages.push(`Scheduler target ${selection.selectedTarget} is not installed or not reachable.`);
    } else {
      messages.push(`Scheduler target ${selection.selectedTarget} is available.`);
    }

    if (hostRunning) {
      messages.push('The selected scheduler runner is reporting an active running state.');
    } else if (host?.observed) {
      messages.push(`The selected scheduler runner is observable but not running (${host.state}).`);
    } else {
      messages.push('No selected scheduler runner status has been observed yet.');
    }
  }

  messages.push('Scheduler runner wiring is separate from unfinished pipeline/playback/screen/recovery business services.');

  const payload = {
    status,
    messages,
    routeCompatibility: definition.routeLabel,
    platform: context.platform,
    platformProfile: capability.profileId,
    platformProfileLabel: capability.profileLabel,
    selectedTarget: selection.selectedTarget,
    targetSelection: selection,
    schedulerTarget: definition.platformTarget,
    schedulerMode: definition.schedulerMode,
    supportLevel: capability.supportLevel,
    operation,
    operationSupportLevel,
    taskName: definition.taskName,
    cadence: definition.cadence,
    command: buildSchedulerCommandPayload(definition),
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

function buildSchedulerCommandPayload(definition: SchedulerDefinition): JsonObject | null {
  if (definition.selectedTarget === SCHEDULER_TARGETS.windowsCronEmulator) {
    return {
      executable: 'python',
      arguments: ['-m', 'cronemulator.app', cronEmulatorDefaultCrontabPath, '--log-file', cronEmulatorLogFilePath],
      workingDirectory: cronEmulatorRoot,
      environment: {
        PYTHONPATH: cronEmulatorSourcePath,
      },
    };
  }

  if (definition.selectedTarget === SCHEDULER_TARGETS.raspberryRealCrontab) {
    return {
      executable: 'crontab',
      arguments: ['-l'],
      workingDirectory: definition.repoRoot,
      managedBlockMarkers: {
        start: raspberryCrontabStartMarker,
        end: raspberryCrontabEndMarker,
      },
    };
  }

  return null;
}

// Sends a JSON response and returns the emitted metadata for verbose logging.
function sendJson(response: ServerResponse, statusCode: number, payload: unknown): SentJsonResponse {
  const body = JSON.stringify(payload, null, 2);
  const bodyBytes = Buffer.byteLength(body);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': bodyBytes,
  });
  response.end(body);
  return {
    statusCode,
    headers: normalizeResponseHeaders(response.getHeaders()),
    body,
    bodyBytes,
    payload,
  };
}

// Logs completed HTTP requests with timing and optional dashboard correlation id.
function logRequest({ request, requestId = readDashboardRequestId(request), url = null, routeKey, statusCode, startedAt }: { request: IncomingMessage; requestId?: string | null; url?: URL | null; routeKey: string; statusCode: number; startedAt: number }) {
  const entry = {
    requestId,
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

// Records the sanitized verbose request-start event for handled API routes.
function logVerboseRequestStarted({ request, requestId, url, routeKey, body, startedAt }: { request: IncomingMessage; requestId: string; url: URL | null; routeKey: string; body: JsonObject | null; startedAt: number }) {
  if (!isVerboseApiRequest(url)) {
    return Promise.resolve();
  }
  return logger.verbose({
    at: new Date(startedAt).toISOString(),
    event: 'request_started',
    requestId,
    request: buildVerboseRequestDetails({ request, url, routeKey, body }),
  });
}

// Records the sanitized verbose request-completion event for handled API routes.
function logVerboseRequestCompleted({ request, requestId, url, routeKey, body, statusCode, startedAt, sentResponse }: { request: IncomingMessage; requestId: string; url: URL | null; routeKey: string; body: JsonObject | null; statusCode: number; startedAt: number; sentResponse: SentJsonResponse }) {
  if (!isVerboseApiRequest(url)) {
    return Promise.resolve();
  }
  return logger.verbose({
    at: new Date().toISOString(),
    event: 'request_completed',
    requestId,
    statusCode,
    durationMs: Date.now() - startedAt,
    request: buildVerboseRequestDetails({ request, url, routeKey, body }),
    response: buildVerboseResponseDetails(sentResponse),
  });
}

// Records the sanitized verbose failure event without changing the response flow.
function logVerboseRequestFailed({ request, requestId, url, routeKey, body, statusCode, startedAt, sentResponse, code = null, details = undefined, error = undefined }: { request: IncomingMessage; requestId: string; url: URL | null; routeKey: string; body: JsonObject | null; statusCode: number; startedAt: number; sentResponse: SentJsonResponse; code?: string | null; details?: unknown; error?: unknown }) {
  if (!isVerboseApiRequest(url)) {
    return Promise.resolve();
  }
  return logger.verbose({
    at: new Date().toISOString(),
    event: 'request_failed',
    requestId,
    statusCode,
    durationMs: Date.now() - startedAt,
    request: buildVerboseRequestDetails({ request, url, routeKey, body }),
    response: buildVerboseResponseDetails(sentResponse),
    error: limitVerbosePayload(sanitizeVerboseValue({
      code,
      details,
      message: error instanceof Error ? error.message : error,
      name: error instanceof Error ? error.name : null,
    })),
  });
}

// Builds the request portion shared by verbose started/completed records.
function buildVerboseRequestDetails({ request, url, routeKey, body }: { request: IncomingMessage; url: URL | null; routeKey: string; body: JsonObject | null }) {
  return {
    method: request.method || 'GET',
    path: url?.pathname || request.url || null,
    routeKey,
    query: limitVerbosePayload(sanitizeVerboseValue(url ? Object.fromEntries(url.searchParams.entries()) : {})),
    headers: limitVerbosePayload(sanitizeVerboseValue(request.headers)),
    body: body === null ? null : limitVerbosePayload(sanitizeVerboseValue(body)),
  };
}

// Builds the response portion used by verbose completed/failed records.
function buildVerboseResponseDetails(sentResponse: SentJsonResponse) {
  return {
    statusCode: sentResponse.statusCode,
    headers: limitVerbosePayload(sanitizeVerboseValue(sentResponse.headers)),
    bodyBytes: sentResponse.bodyBytes,
    body: limitVerbosePayload(sanitizeVerboseValue(sentResponse.payload)),
  };
}

// Keeps verbose logging scoped to backend API requests.
function isVerboseApiRequest(url: URL | null): boolean {
  return Boolean(url?.pathname.startsWith('/api/'));
}

// Converts Node response headers into string data suitable for JSON logs.
function normalizeResponseHeaders(headers: OutgoingHttpHeaders): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : value === undefined ? '' : String(value)]),
  );
}

// Redacts sensitive keys recursively before verbose data reaches disk.
function sanitizeVerboseValue(value: unknown, parentKey = '', seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (isVerboseSensitiveKey(parentKey)) {
    return REDACTED_VALUE;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeVerboseValue(entry, parentKey, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[circular]';
    }
    seen.add(value);
    const sanitized = Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [
        key,
        isVerboseSensitiveKey(key) ? REDACTED_VALUE : sanitizeVerboseValue(childValue, key, seen),
      ]),
    );
    seen.delete(value);
    return sanitized;
  }

  return value;
}

// Identifies verbose-log fields that must never be written as raw values.
function isVerboseSensitiveKey(key: string): boolean {
  return isSensitiveKey(key)
    || /^code$/i.test(key)
    || /^raw$/i.test(key)
    || /api[_-]?key/i.test(key)
    || /credential/i.test(key)
    || /2fa/i.test(key);
}

// Replaces oversized verbose payloads with a bounded preview and length marker.
function limitVerbosePayload(value: unknown): unknown {
  const serialized = JSON.stringify(value);
  if (serialized.length <= verboseBodyCharacterLimit) {
    return value;
  }
  return {
    truncated: true,
    originalLength: serialized.length,
    limit: verboseBodyCharacterLimit,
    preview: serialized.slice(0, verboseBodyCharacterLimit),
  };
}

// Mirrors sanitized auth/login request arrival details into logindebug.log.
function logLoginDebugRequestReceived({ request, url, routeKey, body, startedAt }: { request: IncomingMessage; url: URL; routeKey: string; body: JsonObject; startedAt: number }) {
  if (!isLoginDebugRoute(url)) {
    return Promise.resolve();
  }
  return logger.loginDebug('HTTP auth request received.', {
    ...buildLoginDebugBaseEntry({ request, url, routeKey, startedAt }),
    headers: sanitizeAuthValue(request.headers),
    body: sanitizeLoginDebugBody(body),
  });
}

// Mirrors sanitized auth/login response details into logindebug.log.
function logLoginDebugRequestCompleted({ request, url, routeKey, statusCode, startedAt, payload }: { request: IncomingMessage; url: URL; routeKey: string; statusCode: number; startedAt: number; payload: unknown }) {
  if (!isLoginDebugRoute(url)) {
    return Promise.resolve();
  }
  return logger.loginDebug('HTTP auth request completed.', {
    ...buildLoginDebugBaseEntry({ request, url, routeKey, startedAt }),
    statusCode,
    payload: sanitizeAuthValue(payload),
  });
}

// Mirrors sanitized auth/login failures into logindebug.log before the error response is sent.
function logLoginDebugRequestFailed({ request, url, routeKey, statusCode, startedAt, code, details, error }: { request: IncomingMessage; url: URL | null; routeKey: string; statusCode: number; startedAt: number; code: string; details: unknown; error: unknown }) {
  if (!isLoginDebugRoute(url, routeKey)) {
    return Promise.resolve();
  }
  return logger.loginDebug('HTTP auth request failed.', {
    ...buildLoginDebugBaseEntry({ request, url, routeKey, startedAt }),
    statusCode,
    code,
    details: sanitizeAuthValue(details),
    error: sanitizeAuthValue(error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error),
  });
}

// Builds the common auth/login debug fields used by request and response entries.
function buildLoginDebugBaseEntry({ request, url, routeKey, startedAt }: { request: IncomingMessage; url: URL | null; routeKey: string; startedAt: number }) {
  const pathName = url?.pathname ?? extractPathFromRouteKey(routeKey);
  return {
    surface: pathName.startsWith('/api/auth/new/') ? '1A-STASH-OFF NEW AUTH' : 'login/auth',
    requestId: readDashboardRequestId(request),
    method: request.method || 'GET',
    path: pathName,
    routeKey,
    query: url ? Object.fromEntries(url.searchParams.entries()) : {},
    durationMs: Date.now() - startedAt,
  };
}

// Checks whether a route belongs to the auth/login surfaces that need mirrored logging.
function isLoginDebugRoute(url: URL | null, routeKey = ''): boolean {
  const pathName = url?.pathname ?? extractPathFromRouteKey(routeKey);
  return pathName === '/api/auth' || pathName.startsWith('/api/auth/');
}

// Extracts a pathname-like value from a route key when URL parsing failed.
function extractPathFromRouteKey(routeKey: string): string {
  const separatorIndex = routeKey.indexOf(' ');
  return separatorIndex === -1 ? routeKey : routeKey.slice(separatorIndex + 1);
}

// Redacts request body fields that may contain submitted login or 2FA secrets.
function sanitizeLoginDebugBody(body: JsonObject): unknown {
  const sanitized = sanitizeAuthValue(body);
  if (!sanitized || typeof sanitized !== 'object' || Array.isArray(sanitized)) {
    return sanitized;
  }
  return Object.fromEntries(
    Object.entries(sanitized).map(([key, value]) => [key, key === 'code' ? REDACTED_VALUE : value]),
  );
}

// Reads the dashboard correlation id from request headers when the frontend sent one.
function readDashboardRequestId(request: IncomingMessage): string | null {
  const header = request.headers[dashboardRequestIdHeader.toLowerCase()];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return /^[A-Za-z0-9._:-]{1,80}$/.test(trimmed) ? trimmed : null;
}

function reportLoggerWriteError(error: unknown): void {
  console.warn('[logger] Failed to write project log.', getErrorMessage(error) || error);
}

function errorPayload(code: string, message: string, details: unknown = undefined): ErrorPayload {
  return {
    status: 'error',
    error: code,
    message,
    details,
    schemaVersion: 1,
  };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

class HttpError extends Error {
  statusCode: number;
  code: string;
  details: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
