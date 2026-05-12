/*
 * Defines frontend service calls for backend runtime execution endpoints.
 * View action handlers import this module instead of issuing raw fetch calls.
 * Endpoint constants are tested so dashboard wiring stays aligned to the API.
 */
import { requestJson, type ApiRequestOptions, type ApiResponseWithMeta } from './apiClient.ts';

type RuntimeEndpoint = {
  method: string;
  path: string;
};

type RuntimeRequestBody = Record<string, unknown>;

export type RuntimeEndpointResponse<TPayload = unknown> = ApiResponseWithMeta<TPayload>;

export const RUNTIME_EXECUTION_ENDPOINTS = Object.freeze({
  downloadRun: { method: 'POST', path: '/api/runtime/download/run' },
  realDownloadRun: { method: 'POST', path: '/api/runtime/download/real-run' },
  indexRun: { method: 'POST', path: '/api/runtime/index/run' },
  gpsRun: { method: 'POST', path: '/api/runtime/gps/run' },
  geocodeRun: { method: 'POST', path: '/api/runtime/geocode/run' },
  queuePrepare: { method: 'POST', path: '/api/runtime/queue/prepare' },
  playbackSelectCurrent: { method: 'POST', path: '/api/runtime/playback/select-current' },
  orchestrationRun: { method: 'POST', path: '/api/runtime/orchestration/run' },
  orchestrationLast: { method: 'GET', path: '/api/runtime/orchestration/last' },
  screenSimulationState: { method: 'GET', path: '/api/runtime/screen-simulation/state' },
  screenSimulationConfigure: { method: 'POST', path: '/api/runtime/screen-simulation/configure' },
  pipelineIssuesDetect: { method: 'POST', path: '/api/runtime/pipeline/issues/detect' },
  pipelineStaleLocksClear: { method: 'POST', path: '/api/runtime/pipeline/stale-locks/clear' },
  // Returns a live projection of runtime state, including run state and worker health.  This
  // endpoint is a read‑only monitor surface used by View D and must not mutate backend state.
  projectionLive: { method: 'GET', path: '/api/runtime/projection/live' },
});

export function runRuntimeDownload(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.downloadRun, body);
}

// Calls the dedicated backend route for authenticated real iCloudPD downloads.
export function runRuntimeRealDownload(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.realDownloadRun, body);
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

export function runRuntimeOrchestration(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.orchestrationRun, body);
}

export function getRuntimeOrchestrationLast(): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.orchestrationLast);
}

export function getRuntimeScreenSimulationState(): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.screenSimulationState);
}

export function configureRuntimeScreenSimulation(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.screenSimulationConfigure, body);
}

// Calls the backend diagnostic endpoint for persisted pipeline issues.
export function detectRuntimePipelineIssues(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.pipelineIssuesDetect, body);
}

// Calls the backend endpoint that clears only stale persisted pipeline locks.
export function clearRuntimePipelineStaleLocks(body: RuntimeRequestBody = {}): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.pipelineStaleLocksClear, body);
}

// Reads the current live runtime projection from the backend.  The returned payload is a
// RuntimeProjectionEnvelope<LiveRuntimeProjection> describing the current namespace,
// high‑level run state, worker health, playback and screen status.  This call is read‑only
// and should be used by View D to display backend‑owned monitor data.
export function getRuntimeLiveProjection(): Promise<RuntimeEndpointResponse> {
  return callRuntimeEndpoint(RUNTIME_EXECUTION_ENDPOINTS.projectionLive);
}

// Applies the shared capture-meta request shape for runtime backend calls.
function callRuntimeEndpoint(endpoint: RuntimeEndpoint, body?: RuntimeRequestBody): Promise<RuntimeEndpointResponse> {
  const options: ApiRequestOptions & { captureMeta: true } = {
    method: endpoint.method,
    captureMeta: true,
    operation: `${endpoint.method} ${endpoint.path}`,
  };
  if (body !== undefined) {
    options.body = body;
  }
  return requestJson(endpoint.path, options);
}
