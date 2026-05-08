/*
 * Encodes View A init and scheduler backend endpoints for browser callers.
 * The service keeps request shapes centralized so runtime-truth actions stay thin.
 */
import { requestJson, type ApiResponseWithMeta } from './apiClient.ts';
import {
  SCHEDULER_OPERATION_SUPPORT,
  SCHEDULER_TARGETS,
  type SchedulerOperation,
  type SchedulerTarget,
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

export const SCHEDULER_TARGET_ENDPOINTS = {
  status: { method: 'GET', path: '/api/init/cron/target' },
  select: { method: 'POST', path: '/api/init/cron/target' },
} as const;

export const SCHEDULER_EMULATOR_ENDPOINTS = {
  check: { method: 'GET', path: '/api/init/cron/emulator/check' },
  run: { method: 'POST', path: '/api/init/cron/emulator/run' },
  stop: { method: 'POST', path: '/api/init/cron/emulator/stop' },
  installCrontab: { method: 'POST', path: '/api/init/cron/emulator/crontab' },
  activeCrontab: { method: 'GET', path: '/api/init/cron/emulator/crontab' },
} as const;

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

export function getCronTarget(): Promise<InitEndpointResponse> {
  return callInitEndpoint(SCHEDULER_TARGET_ENDPOINTS.status);
}

export function selectCronTarget(target: SchedulerTarget): Promise<InitEndpointResponse> {
  return callInitEndpoint(SCHEDULER_TARGET_ENDPOINTS.select, {
    body: { target },
  });
}

export function installCron(options: { target?: SchedulerTarget } = {}): Promise<InitEndpointResponse> {
  return callSchedulerOperation(SCHEDULER_OPERATION_SUPPORT.install, options);
}

export function checkCronStatus(options: { target?: SchedulerTarget } = {}): Promise<InitEndpointResponse> {
  return callSchedulerOperation(SCHEDULER_OPERATION_SUPPORT.status, options);
}

export function printCron(options: { target?: SchedulerTarget } = {}): Promise<InitEndpointResponse> {
  return callSchedulerOperation(SCHEDULER_OPERATION_SUPPORT.print, options);
}

// Checks whether the selected Windows CronEmulator target is reachable.
export function checkEmulatorScheduler(options: { target?: SchedulerTarget } = {}): Promise<InitEndpointResponse> {
  return callSchedulerEmulatorEndpoint(SCHEDULER_EMULATOR_ENDPOINTS.check, options);
}

// Starts CronEmulator and requests its scheduler loop to run.
export function runEmulator(options: { target?: SchedulerTarget } = {}): Promise<InitEndpointResponse> {
  return callSchedulerEmulatorEndpoint(SCHEDULER_EMULATOR_ENDPOINTS.run, options);
}

// Stops the CronEmulator scheduler loop and any backend-owned process.
export function stopEmulator(options: { target?: SchedulerTarget } = {}): Promise<InitEndpointResponse> {
  return callSchedulerEmulatorEndpoint(SCHEDULER_EMULATOR_ENDPOINTS.stop, options);
}

// Installs text into the active CronEmulator crontab file.
export function installEmulatorCrontab(options: { target?: SchedulerTarget; crontabText?: string } = {}): Promise<InitEndpointResponse> {
  return callSchedulerEmulatorEndpoint(SCHEDULER_EMULATOR_ENDPOINTS.installCrontab, options);
}

// Reads the active CronEmulator crontab text.
export function getActiveEmulatorCrontab(options: { target?: SchedulerTarget } = {}): Promise<InitEndpointResponse> {
  return callSchedulerEmulatorEndpoint(SCHEDULER_EMULATOR_ENDPOINTS.activeCrontab, options);
}

// Calls a scheduler emulator endpoint while preserving the selected target payload.
export function callSchedulerEmulatorEndpoint(
  endpoint: InitEndpoint,
  options: { target?: SchedulerTarget; crontabText?: string } = {},
): Promise<InitEndpointResponse> {
  const body: Record<string, unknown> = {};
  if (options.target && Object.values(SCHEDULER_TARGETS).includes(options.target)) {
    body.target = options.target;
  }
  if (typeof options.crontabText === 'string') {
    body.crontabText = options.crontabText;
  }
  return callInitEndpoint(endpoint, Object.keys(body).length ? { body } : undefined);
}

// Calls one of the legacy scheduler operation endpoints.
export function callSchedulerOperation(
  operation: SchedulerOperation,
  options: { target?: SchedulerTarget } = {},
): Promise<InitEndpointResponse> {
  const endpoint = SCHEDULER_INIT_ENDPOINTS[operation];
  if (!endpoint) {
    throw new Error(`Unsupported scheduler operation: ${operation}`);
  }
  if (options.target && Object.values(SCHEDULER_TARGETS).includes(options.target)) {
    return callInitEndpoint(endpoint, { body: { target: options.target } });
  }
  return callInitEndpoint(endpoint);
}

// Performs a JSON request against one View A init endpoint.
function callInitEndpoint(endpoint: InitEndpoint, options: InitRequestOptions = {}): Promise<InitEndpointResponse> {
  return requestJson(endpoint.path, { method: endpoint.method, captureMeta: true, ...options });
}
