import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildInitLogDetails,
  buildRequestHeaders,
  formatInitError,
  mapPayloadStatusToUiStatus,
  normalizeActionResult,
  summarizeInitPayload,
  summarizeRuntimePayload,
} from '../dashboard/services/runtimeTruth/runtimeTruthActionUtils.ts';
import {
  getTruthSignature,
  normalizeTruthSnapshot,
} from '../dashboard/services/runtimeTruth/runtimeTruthPersistence.ts';

test('runtimeTruth action helpers preserve request metadata and status text', () => {
  assert.deepEqual(buildRequestHeaders(), {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
  });
  assert.deepEqual(buildRequestHeaders({ hello: 'world' }), {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    'Content-Type': 'application/json',
  });

  assert.deepEqual(normalizeActionResult('ok'), { payload: 'ok', meta: null });
  assert.deepEqual(normalizeActionResult({ payload: { ok: true }, meta: { response: {} } }), {
    payload: { ok: true },
    meta: { response: {} },
  });

  const details = buildInitLogDetails({
    operation: 'Verify .env',
    endpoint: { method: 'POST', path: '/api/init/verify-env' },
    requestBody: { dryRun: true },
    apiMeta: {
      request: { method: 'POST', path: '/api/init/verify-env', headers: {}, body: { dryRun: true } },
      response: { status: 200, statusText: 'OK', ok: true, url: 'http://localhost/api/init/verify-env', headers: {}, body: { status: 'success' } },
    },
    responsePayload: { status: 'success' },
    outcome: 'success',
  });

  assert.equal(details.operation, 'Verify .env');
  assert.equal(details.endpoint, 'POST /api/init/verify-env');
  assert.equal(details.outcome, 'success');
  assert.equal(details.response.body.status, 'success');
  assert.match(details.timeline.iso, /^20\d\d-/);

  assert.equal(summarizeInitPayload('Install scheduler', null), 'Install scheduler completed with an empty response body.');
  assert.equal(
    summarizeInitPayload('Install scheduler', { scheduler: { platformProfileLabel: 'Windows', operationSupportLevel: 'supported' } }),
    'Install scheduler completed for Windows with scheduler support level supported.',
  );
  assert.equal(summarizeInitPayload('Run B2', { message: 'done' }), 'Run B2 completed: done');
  assert.equal(summarizeInitPayload('Run B2', { status: 'ok' }), 'Run B2 completed with status ok.');
  assert.equal(mapPayloadStatusToUiStatus('error'), 'error');
  assert.equal(mapPayloadStatusToUiStatus('warning'), 'info');
  assert.equal(mapPayloadStatusToUiStatus('ok'), 'success');
  assert.equal(formatInitError('Run B2', { status: 500, message: 'Boom' }), 'Run B2 failed with HTTP 500: Boom');
  assert.equal(summarizeRuntimePayload('Queue prepare', { queue: { insertedCount: 2 } }), 'Queue prepare completed with 2 newly queued item(s).');
});

test('runtimeTruth persistence normalizes snapshots to the shared seed path', () => {
  const normalized = normalizeTruthSnapshot({
    sourceOfTruth: 'wrong/path.json',
    nested: { answer: 42 },
  });

  assert.equal(normalized.sourceOfTruth, 'conf/runtime-truth.json');
  assert.deepEqual(normalized.nested, { answer: 42 });

  const signatureA = getTruthSignature({ sourceOfTruth: 'custom.json', nested: { answer: 42 } });
  const signatureB = getTruthSignature({ sourceOfTruth: 'another.json', nested: { answer: 42 } });
  assert.equal(signatureA, signatureB);
});
