/*
 * Frontend gateway for B11 V2 recovery endpoints.
 */
import { requestJson, type ApiRequestOptions, type ApiResponseWithMeta } from './apiClient.ts';
import type { V2RecoveryStateSaveReason, V2RecoveryStateSnapshot } from './v2RecoveryStateSchema.ts';

type RuntimeEndpoint = {
  method: string;
  path: string;
};

export const V2_RECOVERY_ENDPOINTS = Object.freeze({
  save: { method: 'POST', path: '/api/runtime/recovery/state/save' },
  load: { method: 'POST', path: '/api/runtime/recovery/state/load' },
  status: { method: 'GET', path: '/api/runtime/recovery/state' },
});

type RecoveryRequestBody = {
  reason?: V2RecoveryStateSaveReason;
  snapshot?: V2RecoveryStateSnapshot;
  source?: string;
};

export function saveV2RecoveryStateSnapshot(body: RecoveryRequestBody): Promise<ApiResponseWithMeta> {
  return callV2RecoveryEndpoint(V2_RECOVERY_ENDPOINTS.save, body);
}

export function loadV2RecoveryStateSnapshot(body: RecoveryRequestBody = {}): Promise<ApiResponseWithMeta> {
  return callV2RecoveryEndpoint(V2_RECOVERY_ENDPOINTS.load, body);
}

function callV2RecoveryEndpoint(endpoint: RuntimeEndpoint, body?: RecoveryRequestBody): Promise<ApiResponseWithMeta> {
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
