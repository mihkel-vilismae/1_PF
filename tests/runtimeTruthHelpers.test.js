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
import { createRuntimeTruthGuards } from '../dashboard/services/runtimeTruth/runtimeTruthGuards.ts';
import {
  getTruthSignature,
  normalizeTruthSnapshot,
} from '../dashboard/services/runtimeTruth/runtimeTruthPersistence.ts';
import { buildInitialTruthState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

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

test('runtimeTruth boot state clears stale persisted runtime locks', () => {
  const truth = buildInitialTruthState();

  assert.equal(truth.pipelineActiveKey, null);
  assert.equal(truth.playbackActive, false);
  assert.equal(truth.realRunActive, false);
  assert.equal(truth.stageLock, 'Pipeline lock available');
  assert.equal(truth.playbackLock, 'Playback worker lock available');
  assert.equal(truth.screenLock, 'Screen worker lock available');
});


test('runtimeTruth guards expose structured diagnostics for different-action pipeline lock blocks', () => {
  const state = {
    activeActions: {},
    truth: {
      pipelineActiveKey: 'B3.2',
      pipelineLockAcquiredAt: '2026-05-06T05:10:53.000Z',
      stageLock: 'Pipeline lock held by B3.2',
      playbackActive: false,
      playbackLock: 'Playback worker lock available',
      realRunActive: false,
    },
  };
  const logs = [];
  const history = [];
  const statuses = {};
  const guards = createRuntimeTruthGuards({
    getState: () => state,
    patchState: (updater) => updater(state),
    pushHistory: (source, status, message, details) => history.push({ source, status, message, details }),
    pushLog: (key, level, message, details) => logs.push({ key, level, message, details }),
    setStatus: (key, status) => { statuses[key] = status; },
  });

  guards.rejectPipelineWhileBusy('B3.1');

  assert.equal(statuses['B3.1'], 'error');
  assert.equal(history[0].message, 'B3.1 was blocked because B3.2 already holds the pipeline lock.');
  assert.equal(history[0].details.reason, 'pipeline_lock_held');
  assert.equal(history[0].details.requestedAction, 'B3.1');
  assert.equal(history[0].details.lockOwner, 'B3.2');
  assert.equal(history[0].details.lockAcquiredAt, '2026-05-06T05:10:53.000Z');
  assert.equal(typeof history[0].details.lockAgeSeconds, 'number');
  assert.equal(history[0].details.selfBlock, false);
  assert.deepEqual(logs[0].details, history[0].details);
});

test('runtimeTruth guards expose self-block pipeline lock diagnostics', () => {
  const state = {
    activeActions: {},
    truth: {
      pipelineActiveKey: 'B3.2',
      pipelineLockAcquiredAt: '2026-05-06T05:10:53.000Z',
      stageLock: 'Pipeline lock held by B3.2',
      playbackActive: false,
      playbackLock: 'Playback worker lock available',
      realRunActive: false,
    },
  };
  const history = [];
  const guards = createRuntimeTruthGuards({
    getState: () => state,
    patchState: (updater) => updater(state),
    pushHistory: (source, status, message, details) => history.push({ source, status, message, details }),
    pushLog: () => {},
    setStatus: () => {},
  });

  guards.rejectPipelineWhileBusy('B3.2');

  assert.equal(history[0].message, 'B3.2 is already running and cannot be started again.');
  assert.equal(history[0].details.reason, 'pipeline_lock_held');
  assert.equal(history[0].details.requestedAction, 'B3.2');
  assert.equal(history[0].details.lockOwner, 'B3.2');
  assert.equal(history[0].details.selfBlock, true);
});
