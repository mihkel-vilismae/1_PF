import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

type JsonObject = Record<string, unknown>;

interface DatabaseServiceOptions {
  repoRoot: string;
  createHttpError: CreateHttpErrorFn;
}

interface CreateHttpErrorFn {
  (statusCode: number, code: string, message: string, details?: unknown): Error;
}

interface EnvValues {
  DB_PATH?: string;
  DOWNLOAD_DIR?: string;
  [key: string]: string | undefined;
}

interface DatabaseActionContext {
  envValues: EnvValues;
  runtimeMode?: 'real' | 'test';
}

interface DatabaseStatus {
  kind: 'sqlite';
  configuredPath: string;
  absolutePath: string;
  exists: boolean;
  sizeBytes: number;
  parentDirectory: string;
  parentDirectoryExists: boolean;
  inspectRuntime: 'python sqlite3 bridge';
  runtimeMode?: 'real' | 'test';
}

interface DatabaseArtifactSource {
  absolutePath?: string;
}

interface DatabaseRequiredTablesAuthority {
  sourcePath: string;
  sourceLabel: string;
  note: string;
}

interface DatabaseRequiredTables extends DatabaseRequiredTablesAuthority {
  expected: string[];
  present: string[];
  missing: string[];
}

interface SqliteObjectInspectionEntry {
  name: string;
  kind: string;
  columnCount?: number;
}

interface SqliteInspection {
  tables: SqliteObjectInspectionEntry[];
  [key: string]: unknown;
}

interface DatabaseInspectionResult {
  database: DatabaseStatus;
  inspection: SqliteInspection;
}

interface DatabaseViewerVerification {
  verificationPassed: boolean;
  database: DatabaseStatus;
  requiredTables: DatabaseRequiredTables;
  availableObjects: Array<{
    name: string;
    kind: string;
    columnCount?: number;
  }>;
}

interface DatabaseRowsRequestBody {
  tableName?: unknown;
  page?: unknown;
  pageSize?: unknown;
}

interface DatabaseDeleteResult {
  database: DatabaseStatus;
  removedPaths: string[];
}

interface DatabaseRecreateResult {
  database: DatabaseStatus;
  created: unknown;
  schemaPath: string;
}

interface DatabaseRowsResult {
  database: DatabaseStatus;
  table: unknown;
}

interface Stage2IndexRegisterResult {
  database: DatabaseStatus;
  downloadDirectory: string;
  schemaPath: string;
  indexedAt: string;
  indexing: unknown;
}

interface RuntimeStageResultBase {
  database: DatabaseStatus;
  executedAt: string;
}

interface Stage3GpsResult extends RuntimeStageResultBase {
  gps: unknown;
}

interface Stage4GeocodeResult extends RuntimeStageResultBase {
  geocode: unknown;
}

interface Stage5QueueResult extends RuntimeStageResultBase {
  queue: unknown;
}

interface Stage6PlaybackResult extends RuntimeStageResultBase {
  playback: unknown;
}

interface RunProcessOptions {
  shell?: boolean;
}

interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

interface PythonBridgeFailure {
  code?: unknown;
  details?: unknown;
}

export interface DatabaseService {
  buildDatabaseStatus(context: DatabaseActionContext): Promise<DatabaseStatus>;
  buildDatabaseViewerVerification(context: DatabaseActionContext): Promise<DatabaseViewerVerification>;
  buildDatabaseViewerVerificationMessages(verification: DatabaseViewerVerification): string[];
  deleteDatabaseArtifacts(context: DatabaseActionContext): Promise<DatabaseDeleteResult>;
  fileExists(targetPath: string): Promise<boolean>;
  getDatabaseArtifactPaths(databaseOrAbsolutePath: string | DatabaseArtifactSource): string[];
  getDatabaseViewerLoggingCoverage(): string;
  getSchemaPath(): string;
  getSqliteScriptPath(): string;
  inspectDatabase(context: DatabaseActionContext): Promise<DatabaseInspectionResult>;
  listDatabaseViewerTables(context: DatabaseActionContext): Promise<DatabaseInspectionResult>;
  loadDatabaseViewerRows(context: DatabaseActionContext, body: DatabaseRowsRequestBody): Promise<DatabaseRowsResult>;
  recreateEmptyDatabase(context: DatabaseActionContext): Promise<DatabaseRecreateResult>;
  resolveRepoPath(relativeOrAbsolutePath: string): string;
  runPythonJson<T = unknown>(args: string[]): Promise<T>;
  runStage2IndexRegister(context: DatabaseActionContext): Promise<Stage2IndexRegisterResult>;
  runStage3ProcessGpsQueue(context: DatabaseActionContext): Promise<Stage3GpsResult>;
  runStage4ProcessGeocodeQueue(context: DatabaseActionContext): Promise<Stage4GeocodeResult>;
  runStage5PrepareQueue(context: DatabaseActionContext): Promise<Stage5QueueResult>;
  runStage6SelectCurrent(context: DatabaseActionContext): Promise<Stage6PlaybackResult>;
  getRuntimeState<T = unknown>(context: DatabaseActionContext, key: string): Promise<T | null>;
  setRuntimeState(context: DatabaseActionContext, key: string, value: unknown): Promise<void>;
}

const databaseViewerRequiredTablesAuthority: DatabaseRequiredTablesAuthority = Object.freeze({
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

function isPythonBridgeFailure(error: unknown): error is PythonBridgeFailure {
  return typeof error === 'object' && error !== null;
}

export function createDatabaseService({ repoRoot, createHttpError }: DatabaseServiceOptions): DatabaseService {
  if (!repoRoot) {
    throw new Error('repoRoot is required to create the database service.');
  }
  if (typeof createHttpError !== 'function') {
    throw new Error('createHttpError is required to create the database service.');
  }

  const serverRoot = path.join(repoRoot, 'server');
  const sqliteScriptPath = path.join(serverRoot, 'scripts', 'sqlite_admin.py');
  const schemaPath = path.join(repoRoot, 'database', 'schema.sql');

  function resolveRepoPath(relativeOrAbsolutePath: string): string {
    if (path.isAbsolute(relativeOrAbsolutePath)) {
      return relativeOrAbsolutePath;
    }
    return path.resolve(repoRoot, relativeOrAbsolutePath);
  }

  function getSqliteScriptPath(): string {
    return sqliteScriptPath;
  }

  function getSchemaPath(): string {
    return schemaPath;
  }

  function getDatabaseViewerLoggingCoverage(): string {
    return databaseViewerLoggingCoverage;
  }

  function getDatabaseArtifactPaths(databaseOrAbsolutePath: string | DatabaseArtifactSource): string[] {
    const absolutePath = typeof databaseOrAbsolutePath === 'string'
      ? databaseOrAbsolutePath
      : databaseOrAbsolutePath?.absolutePath;

    if (!absolutePath) {
      throw createHttpError(500, 'missing_database_artifact_path', 'Database artifact path is required.');
    }

    return [absolutePath, `${absolutePath}-wal`, `${absolutePath}-shm`];
  }

  async function fileExists(targetPath: string): Promise<boolean> {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  async function buildDatabaseStatus(context: DatabaseActionContext): Promise<DatabaseStatus> {
    const dbPath = context.envValues.DB_PATH;
    if (!dbPath) {
      throw createHttpError(500, 'missing_db_path', 'DB_PATH is required before database actions can run.');
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
      runtimeMode: context.runtimeMode,
    };
  }

  async function inspectDatabase(context: DatabaseActionContext): Promise<DatabaseInspectionResult> {
    const database = await buildDatabaseStatus(context);
    if (!database.exists) {
      throw createHttpError(404, 'database_missing', 'Cannot inspect the database because the DB file does not exist.', {
        database,
      });
    }

    const inspection = await runPythonJson<SqliteInspection>(['inspect', database.absolutePath]);
    return { database, inspection };
  }

  async function deleteDatabaseArtifacts(context: DatabaseActionContext): Promise<DatabaseDeleteResult> {
    const database = await buildDatabaseStatus(context);
    const removedPaths: string[] = [];
    const candidatePaths = getDatabaseArtifactPaths(database);

    for (const candidate of candidatePaths) {
      if (await fileExists(candidate)) {
        await fs.rm(candidate, { force: true });
        removedPaths.push(candidate);
      }
    }

    return { database, removedPaths };
  }

  async function recreateEmptyDatabase(context: DatabaseActionContext): Promise<DatabaseRecreateResult> {
    const database = await buildDatabaseStatus(context);
    const candidatePaths = getDatabaseArtifactPaths(database);

    for (const candidate of candidatePaths) {
      if (await fileExists(candidate)) {
        await fs.rm(candidate, { force: true });
      }
    }

    const created = await runPythonJson(['recreate', database.absolutePath, schemaPath]);
    return { database, created, schemaPath };
  }

  async function buildDatabaseViewerVerification(context: DatabaseActionContext): Promise<DatabaseViewerVerification> {
    const database = await buildDatabaseStatus(context);
    const requiredTables: DatabaseRequiredTables = {
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

    const inspection = await runPythonJson<SqliteInspection>(['inspect', database.absolutePath]);
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

  function buildDatabaseViewerVerificationMessages(verification: DatabaseViewerVerification): string[] {
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

  async function listDatabaseViewerTables(context: DatabaseActionContext): Promise<DatabaseInspectionResult> {
    const database = await buildDatabaseStatus(context);
    if (!database.exists) {
      throw createHttpError(404, 'database_missing', 'Cannot list tables because the DB file does not exist.', {
        database,
      });
    }

    const inspection = await runPythonJson<SqliteInspection>(['inspect', database.absolutePath]);
    return { database, inspection };
  }

  async function loadDatabaseViewerRows(context: DatabaseActionContext, body: DatabaseRowsRequestBody): Promise<DatabaseRowsResult> {
    const tableName = String(body?.tableName ?? '').trim();
    if (!tableName) {
      throw createHttpError(400, 'missing_table_name', 'tableName is required when loading database rows.');
    }

    const page = normalizeDatabaseViewerPage(body?.page);
    const pageSize = normalizeDatabaseViewerPageSize(body?.pageSize);
    const database = await buildDatabaseStatus(context);
    if (!database.exists) {
      throw createHttpError(404, 'database_missing', 'Cannot load rows because the DB file does not exist.', {
        database,
      });
    }

    const table = await runPythonJson(['rows', database.absolutePath, tableName, String(page), String(pageSize)]);
    return { database, table };
  }

  function normalizeDatabaseViewerPage(value: unknown): number {
    const page = Number(value ?? 0);
    if (!Number.isInteger(page) || page < 0) {
      throw createHttpError(400, 'invalid_page', 'page must be a zero-based integer.',
        { page: value });
    }
    return page;
  }

  function normalizeDatabaseViewerPageSize(value: unknown): number {
    if (value === undefined) {
      return 50;
    }
    const pageSize = Number(value);
    if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > 100) {
      throw createHttpError(400, 'invalid_page_size', 'pageSize must be an integer between 1 and 100.', {
        pageSize: value,
      });
    }
    return pageSize;
  }


  async function runStage2IndexRegister(context: DatabaseActionContext): Promise<Stage2IndexRegisterResult> {
    const database = await buildDatabaseStatus(context);
    if (!database.exists) {
      throw createHttpError(404, 'database_missing', 'Cannot run indexing because the DB file does not exist.', {
        database,
      });
    }

    const downloadDirectory = resolveRepoPath(context.envValues.DOWNLOAD_DIR || '');
    const indexedAt = new Date().toISOString();

    try {
      const indexing = await runPythonJson([
        'stage2_index_register',
        database.absolutePath,
        downloadDirectory,
        indexedAt,
        schemaPath,
      ]);
      return { database, downloadDirectory, schemaPath, indexedAt, indexing };
    } catch (error) {
      if (isPythonBridgeFailure(error) && error.code === 'python_bridge_failed') {
        throw createHttpError(500, 'index_schema_bootstrap_failed', 'Indexing failed before Stage 2 could finish. Check schema bootstrap and database setup.', {
          database,
          downloadDirectory,
          schemaPath,
          pythonBridge: error.details,
        });
      }
      throw error;
    }
  }

  async function runStage3ProcessGpsQueue(context: DatabaseActionContext): Promise<Stage3GpsResult> {
    const database = await buildDatabaseStatus(context);
    if (!database.exists) {
      throw createHttpError(404, 'database_missing', 'Cannot run GPS parsing because the DB file does not exist.', {
        database,
      });
    }

    const executedAt = new Date().toISOString();
    const gps = await runPythonJson(['stage3_process_gps_queue', database.absolutePath, executedAt, schemaPath]);
    return { database, executedAt, gps };
  }

  async function runStage4ProcessGeocodeQueue(context: DatabaseActionContext): Promise<Stage4GeocodeResult> {
    const database = await buildDatabaseStatus(context);
    if (!database.exists) {
      throw createHttpError(404, 'database_missing', 'Cannot run geocoding because the DB file does not exist.', {
        database,
      });
    }

    const executedAt = new Date().toISOString();
    const geocode = await runPythonJson(['stage4_process_geocode_queue', database.absolutePath, executedAt, schemaPath]);
    return { database, executedAt, geocode };
  }

  async function runStage5PrepareQueue(context: DatabaseActionContext): Promise<Stage5QueueResult> {
    const database = await buildDatabaseStatus(context);
    if (!database.exists) {
      throw createHttpError(404, 'database_missing', 'Cannot prepare slideshow queue because the DB file does not exist.', {
        database,
      });
    }

    const executedAt = new Date().toISOString();
    const queue = await runPythonJson(['stage5_prepare_queue', database.absolutePath, executedAt, schemaPath]);
    return { database, executedAt, queue };
  }

  async function runStage6SelectCurrent(context: DatabaseActionContext): Promise<Stage6PlaybackResult> {
    const database = await buildDatabaseStatus(context);
    if (!database.exists) {
      throw createHttpError(404, 'database_missing', 'Cannot select current media because the DB file does not exist.', {
        database,
      });
    }

    const executedAt = new Date().toISOString();
    const playback = await runPythonJson(['stage6_select_current', database.absolutePath, executedAt, repoRoot]);
    return { database, executedAt, playback };
  }

  async function getRuntimeState<T = unknown>(context: DatabaseActionContext, key: string): Promise<T | null> {
    const dbPath = context.envValues && context.envValues.DB_PATH;
    if (!dbPath) {
      return null;
    }

    const absolutePath = resolveRepoPath(dbPath);
    const result = await runPythonJson<JsonObject>(['runtime_state_get', absolutePath, key]);
    const raw = result?.stateValue;
    return raw ? JSON.parse(String(raw)) as T : null;
  }

  async function setRuntimeState(context: DatabaseActionContext, key: string, value: unknown): Promise<void> {
    const dbPath = context.envValues && context.envValues.DB_PATH;
    if (!dbPath) {
      return;
    }

    const absolutePath = resolveRepoPath(dbPath);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await runPythonJson(['runtime_state_set', absolutePath, key, serialized, 'json', 'orchestration']);
  }

  async function runPythonJson<T = unknown>(args: string[]): Promise<T> {
    const { stdout, stderr, code } = await runProcess('python', [sqliteScriptPath, ...args]);
    if (code !== 0) {
      throw createHttpError(500, 'python_bridge_failed', 'Python bridge command failed.', {
        stderr: stderr.trim(),
        stdout: stdout.trim(),
      });
    }

    try {
      return JSON.parse(stdout.trim()) as T;
    } catch {
      throw createHttpError(500, 'python_bridge_invalid_json', 'Python bridge returned invalid JSON.', {
        stdout: stdout.trim(),
      });
    }
  }

  function runProcess(command: string, args: string[], options: RunProcessOptions = {}): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: options.shell === true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on('error', (error: Error) => reject(error));
      child.on('close', (code) => resolve({ code, stdout, stderr }));
    });
  }

  return {
    buildDatabaseStatus,
    buildDatabaseViewerVerification,
    buildDatabaseViewerVerificationMessages,
    deleteDatabaseArtifacts,
    fileExists,
    getDatabaseArtifactPaths,
    getDatabaseViewerLoggingCoverage,
    getSchemaPath,
    getSqliteScriptPath,
    inspectDatabase,
    listDatabaseViewerTables,
    loadDatabaseViewerRows,
    recreateEmptyDatabase,
    resolveRepoPath,
    runPythonJson,
    runStage2IndexRegister,
    runStage3ProcessGpsQueue,
    runStage4ProcessGeocodeQueue,
    runStage5PrepareQueue,
    runStage6SelectCurrent,
    getRuntimeState,
    setRuntimeState,
  };
}
