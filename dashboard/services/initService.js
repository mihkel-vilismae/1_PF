import { requestJson } from './apiClient.js';

export const INIT_ENDPOINTS = {
  verifyEnv: { method: 'POST', path: '/api/init/verify-env' },
  checkDatabaseStatus: { method: 'GET', path: '/api/init/database/status' },
  inspectDatabase: { method: 'POST', path: '/api/init/database/inspect' },
  deleteDatabase: { method: 'POST', path: '/api/init/database/delete' },
  recreateEmptyDatabase: { method: 'POST', path: '/api/init/database/recreate-empty' },
  installCron: { method: 'POST', path: '/api/init/cron/install' },
  checkCronStatus: { method: 'GET', path: '/api/init/cron/status' },
  printCron: { method: 'GET', path: '/api/init/cron/print' },
};

export function verifyEnv() {
  return callInitEndpoint(INIT_ENDPOINTS.verifyEnv);
}

export function checkDatabaseStatus() {
  return callInitEndpoint(INIT_ENDPOINTS.checkDatabaseStatus);
}

export function inspectDatabase() {
  return callInitEndpoint(INIT_ENDPOINTS.inspectDatabase);
}

export function deleteDatabase(confirmation) {
  return callInitEndpoint(INIT_ENDPOINTS.deleteDatabase, {
    body: {
      confirm: true,
      action: 'delete-db',
      ...confirmation,
    },
  });
}

export function recreateEmptyDatabase(confirmation) {
  return callInitEndpoint(INIT_ENDPOINTS.recreateEmptyDatabase, {
    body: {
      confirm: true,
      action: 'recreate-db',
      ...confirmation,
    },
  });
}

export function installCron() {
  return callInitEndpoint(INIT_ENDPOINTS.installCron);
}

export function checkCronStatus() {
  return callInitEndpoint(INIT_ENDPOINTS.checkCronStatus);
}

export function printCron() {
  return callInitEndpoint(INIT_ENDPOINTS.printCron);
}

function callInitEndpoint(endpoint, options = {}) {
  return requestJson(endpoint.path, { method: endpoint.method, captureMeta: true, ...options });
}
