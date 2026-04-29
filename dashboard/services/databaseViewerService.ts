import { requestJson, type ApiResponseWithMeta } from './apiClient.ts';

type DatabaseViewerEndpoint = {
  method: string;
  path: string;
  operation: string;
};

type DatabaseViewerRequestOptions = {
  body?: unknown;
};

export type DatabaseViewerResponse<TPayload = unknown> = ApiResponseWithMeta<TPayload>;

export type FetchDatabaseRowsInput = {
  tableName: string;
  page?: number;
  pageSize?: number;
};

export const DATABASE_VIEWER_ENDPOINTS = Object.freeze({
  verifyDatabase: { method: 'POST', path: '/api/database-viewer/verify', operation: 'Verify database' },
  connectDatabase: { method: 'POST', path: '/api/database-viewer/connect', operation: 'Connect database' },
  listTables: { method: 'GET', path: '/api/database-viewer/tables', operation: 'List database tables' },
  fetchRows: { method: 'POST', path: '/api/database-viewer/rows', operation: 'Load table rows' },
  startLogging: { method: 'POST', path: '/api/database-viewer/logging/start', operation: 'Start DB logging' },
  stopLogging: { method: 'POST', path: '/api/database-viewer/logging/stop', operation: 'Stop DB logging' },
});

export function verifyDatabase(): Promise<DatabaseViewerResponse> {
  return callDatabaseViewerEndpoint(DATABASE_VIEWER_ENDPOINTS.verifyDatabase);
}

export function connectDatabase(): Promise<DatabaseViewerResponse> {
  return callDatabaseViewerEndpoint(DATABASE_VIEWER_ENDPOINTS.connectDatabase);
}

export function listDatabaseTables(): Promise<DatabaseViewerResponse> {
  return callDatabaseViewerEndpoint(DATABASE_VIEWER_ENDPOINTS.listTables);
}

export function fetchDatabaseRows({ tableName, page = 0, pageSize = 50 }: FetchDatabaseRowsInput): Promise<DatabaseViewerResponse> {
  return callDatabaseViewerEndpoint(DATABASE_VIEWER_ENDPOINTS.fetchRows, {
    body: {
      tableName,
      page,
      pageSize,
    },
  });
}

export function startDatabaseLogging(): Promise<DatabaseViewerResponse> {
  return callDatabaseViewerEndpoint(DATABASE_VIEWER_ENDPOINTS.startLogging);
}

export function stopDatabaseLogging(): Promise<DatabaseViewerResponse> {
  return callDatabaseViewerEndpoint(DATABASE_VIEWER_ENDPOINTS.stopLogging);
}

function callDatabaseViewerEndpoint(
  endpoint: DatabaseViewerEndpoint,
  options: DatabaseViewerRequestOptions = {},
): Promise<DatabaseViewerResponse> {
  return requestJson(endpoint.path, {
    method: endpoint.method,
    captureMeta: true,
    operation: endpoint.operation,
    ...options,
  });
}
