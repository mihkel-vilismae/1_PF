import { requestJson } from './apiClient.ts';

export const RUNTIME_EXECUTION_ENDPOINTS = Object.freeze({
  downloadRun: { method: 'POST', path: '/api/runtime/download/run' },
  indexRun: { method: 'POST', path: '/api/runtime/index/run' },
  gpsRun: { method: 'POST', path: '/api/runtime/gps/run' },
  geocodeRun: { method: 'POST', path: '/api/runtime/geocode/run' },
  queuePrepare: { method: 'POST', path: '/api/runtime/queue/prepare' },
  playbackSelectCurrent: { method: 'POST', path: '/api/runtime/playback/select-current' },
});

export function runRuntimeDownload(body = {}) {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.downloadRun, body);
}

export function runRuntimeIndex(body = {}) {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.indexRun, body);
}

export function runRuntimeGps(body = {}) {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.gpsRun, body);
}

export function runRuntimeGeocode(body = {}) {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.geocodeRun, body);
}

export function runRuntimeQueuePrepare(body = {}) {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.queuePrepare, body);
}

export function runRuntimePlaybackSelectCurrent(body = {}) {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.playbackSelectCurrent, body);
}

function callRuntimeEndpoint(endpoint, body) {
  return requestJson(endpoint.path, {
    method: endpoint.method,
    body,
    captureMeta: true,
    operation: `${endpoint.method} ${endpoint.path}`,
  });
}
