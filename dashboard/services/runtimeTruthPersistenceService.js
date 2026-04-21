import { requestJson } from './apiClient.js';

export const RUNTIME_TRUTH_ENDPOINTS = Object.freeze({
  load: { method: 'GET', path: '/api/runtime-truth' },
  save: { method: 'POST', path: '/api/runtime-truth' },
});

export async function loadPersistedRuntimeTruth() {
  const payload = await requestJson(RUNTIME_TRUTH_ENDPOINTS.load.path, {
    method: RUNTIME_TRUTH_ENDPOINTS.load.method,
    operation: 'Load runtime truth',
  });
  return payload?.truth ?? null;
}

export async function savePersistedRuntimeTruth(truth) {
  const payload = await requestJson(RUNTIME_TRUTH_ENDPOINTS.save.path, {
    method: RUNTIME_TRUTH_ENDPOINTS.save.method,
    body: { truth },
    operation: 'Persist runtime truth',
  });
  return payload?.truth ?? null;
}
