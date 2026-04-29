import { requestJson } from './apiClient.ts';

export type RuntimeTruthPersistenceEndpoint = {
  method: 'GET' | 'POST';
  path: string;
};

export type RuntimeTruthPersistencePayload<TTruth = unknown> = {
  truth?: TTruth | null;
};

export const RUNTIME_TRUTH_ENDPOINTS = Object.freeze({
  load: { method: 'GET', path: '/api/runtime-truth' },
  save: { method: 'POST', path: '/api/runtime-truth' },
} satisfies Record<'load' | 'save', RuntimeTruthPersistenceEndpoint>);

export async function loadPersistedRuntimeTruth<TTruth = unknown>(): Promise<TTruth | null> {
  const payload = await requestJson<RuntimeTruthPersistencePayload<TTruth>>(RUNTIME_TRUTH_ENDPOINTS.load.path, {
    method: RUNTIME_TRUTH_ENDPOINTS.load.method,
    operation: 'Load runtime truth',
  });
  return payload?.truth ?? null;
}

export async function savePersistedRuntimeTruth<TTruth = unknown>(truth: TTruth): Promise<TTruth | null> {
  const payload = await requestJson<RuntimeTruthPersistencePayload<TTruth>>(RUNTIME_TRUTH_ENDPOINTS.save.path, {
    method: RUNTIME_TRUTH_ENDPOINTS.save.method,
    body: { truth },
    operation: 'Persist runtime truth',
  });
  return payload?.truth ?? null;
}
