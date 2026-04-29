import { requestJson, type ApiResponseWithMeta } from './apiClient.ts';
import {
  SCHEDULER_OPERATION_SUPPORT,
  type SchedulerOperation,
} from '../../shared/schedulerPlatformCapabilities.ts';

type InitEndpoint = {
  method: string;
  path: string;
};

type InitRequestOptions = {
  body?: unknown;
};

type ConfirmationPayload = Record<string, unknown>;

export type InitEndpointResponse<TPayload = unknown> = ApiResponseWithMeta<TPayload>;

export const SCHEDULER_INIT_ENDPOINTS: Readonly<Record<SchedulerOperation, InitEndpoint>> = Object.freeze({
  [SCHEDULER_OPERATION_SUPPORT.install]: { method: 'POST', path: '/api/init/cron/install' },
  [SCHEDULER_OPERATION_SUPPORT.status]: { method: 'GET', path: '/api/init/cron/status' },
  [SCHEDULER_OPERATION_SUPPORT.print]: { method: 'GET', path: '/api/init/cron/print' },
});

export const INIT_ENDPOINTS = {
  verifyEnv: { method: 'POST', path: '/api/init/verify-env' },
  checkDatabaseStatus: { method: 'GET', path: '/api/init/database/status' },
  inspectDatabase: { method: 'POST', path: '/api/init/database/inspect' },
  deleteDatabase: { method: 'POST', path: '/api/init/database/delete' },
  recreateEmptyDatabase: { method: 'POST', path: '/api/init/database/recreate-empty' },
  installCron: SCHEDULER_INIT_ENDPOINTS[SCHEDULER_OPERATION_SUPPORT.install],
  checkCronStatus: SCHEDULER_INIT_ENDPOINTS[SCHEDULER_OPERATION_SUPPORT.status],
  printCron: SCHEDULER_INIT_ENDPOINTS[SCHEDULER_OPERATION_SUPPORT.print],
} as const;

export function verifyEnv(): Promise<InitEndpointResponse> {
  return callInitEndpoint(INIT_ENDPOINTS.verifyEnv);
}

export function checkDatabaseStatus(): Promise<InitEndpointResponse> {
  return callInitEndpoint(INIT_ENDPOINTS.checkDatabaseStatus);
}

export function inspectDatabase(): Promise<InitEndpointResponse> {
  return callInitEndpoint(INIT_ENDPOINTS.inspectDatabase);
}

export function deleteDatabase(confirmation: ConfirmationPayload = {}): Promise<InitEndpointResponse> {
  return callInitEndpoint(INIT_ENDPOINTS.deleteDatabase, {
    body: {
      confirm: true,
      action: 'delete-db',
      ...confirmation,
    },
  });
}

export function recreateEmptyDatabase(confirmation: ConfirmationPayload = {}): Promise<InitEndpointResponse> {
  return callInitEndpoint(INIT_ENDPOINTS.recreateEmptyDatabase, {
    body: {
      confirm: true,
      action: 'recreate-db',
      ...confirmation,
    },
  });
}

export function installCron(): Promise<InitEndpointResponse> {
  return callSchedulerOperation(SCHEDULER_OPERATION_SUPPORT.install);
}

export function checkCronStatus(): Promise<InitEndpointResponse> {
  return callSchedulerOperation(SCHEDULER_OPERATION_SUPPORT.status);
}

export function printCron(): Promise<InitEndpointResponse> {
  return callSchedulerOperation(SCHEDULER_OPERATION_SUPPORT.print);
}

export function callSchedulerOperation(operation: SchedulerOperation): Promise<InitEndpointResponse> {
  const endpoint = SCHEDULER_INIT_ENDPOINTS[operation];
  if (!endpoint) {
    throw new Error(`Unsupported scheduler operation: ${operation}`);
  }
  return callInitEndpoint(endpoint);
}

function callInitEndpoint(endpoint: InitEndpoint, options: InitRequestOptions = {}): Promise<InitEndpointResponse> {
  return requestJson(endpoint.path, { method: endpoint.method, captureMeta: true, ...options });
}
