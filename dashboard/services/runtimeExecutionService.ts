import { requestJson, type ApiResponseWithMeta } from './apiClient.ts';

type RuntimeEndpoint = {
  method: string;
  path: string;
};

type RuntimeRequestBody = Record<string, unknown>;

export type RuntimeEndpointResponse<TPayload = unknown> = ApiResponseWithMeta<TPayload>;

export const RUNTIME_EXECUTION_ENDPOINTS = Object.freeze({
  downloadRun: { method: 'POST', path: '/api/runtime/download/run' },
  indexRun: { method: 'POST', path: '/api/runtime/index/run' },
  gpsRun: { method: 'POST', path: '/api/runtime/gps/run' },
  geocodeRun: { method: 'POST', path: '/api/runtime/geocode/run' },
  queuePrepare: { method: 'POST', path: '/api/runtime/queue/prepare' },
  playbackSelectCurrent: { method: 'POST', path: '/api/runtime/playback/select-current' },
});

export function runRuntimeDownload(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.downloadRun, body);
}

export function runRuntimeIndex(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.indexRun, body);
}

export function runRuntimeGps(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.gpsRun, body);
}

export function runRuntimeGeocode(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.geocodeRun, body);
}

export function runRuntimeQueuePrepare(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.queuePrepare, body);
}

export function runRuntimePlaybackSelectCurrent(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.playbackSelectCurrent, body);
}

function callRuntimeEndpoint(endpoint: RuntimeEndpoint, body: RuntimeRequestBody): Promise<RuntimeEndpointResponse> {
  return requestJson(endpoint.path, {
    method: endpoint.method,
    body,
    captureMeta: true,
    operation: `${endpoint.method} ${endpoint.path}`,
  });
}
