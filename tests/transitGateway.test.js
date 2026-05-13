/*
 * Verifies the shared dashboard API gateway emits paired transit diagnostics.
 * Tests cover success, backend failure, and network failure request/response ids.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiRequestError, requestJson, subscribeTransit } from '../dashboard/services/apiClient.ts';

/**
 * @typedef {import('../dashboard/services/apiClient.ts').TransitRecord} TransitRecord
 */

/**
 * @typedef {Response | {
 *   status: number,
 *   ok: boolean,
 *   statusText: string,
 *   url: string,
 *   headers: Headers,
 *   json: () => Promise<unknown>,
 *   text: () => Promise<string>
 * }} FetchStubResponse
 */

/**
 * @typedef {(input: RequestInfo | URL, init?: RequestInit) => Promise<FetchStubResponse>} FetchStub
 */

/**
 * Replace global fetch for a single test and return a restore function.
 *
 * @param {FetchStub} impl
 * @returns {() => void}
 */
function installFetchStub(impl) {
  const previous = globalThis.fetch;
  globalThis.fetch = impl;
  return () => {
    globalThis.fetch = previous;
  };
}

// Verifies successful requests emit a visible id and matching metadata ids.
test('requestJson emits outbound + inbound transit records (success)', async () => {
  /** @type {TransitRecord[]} */
  const records = [];
  const fetchCalls = [];
  const unsubscribe = subscribeTransit((record) => records.push(record));

  const restoreFetch = installFetchStub(async (path, init) => {
    fetchCalls.push({ path, init });
    return {
      status: 200,
      ok: true,
      statusText: 'OK',
      url: 'http://localhost/api/test',
      headers: new Headers({ 'content-type': 'application/json', 'x-dashboard-request-id': String(records[0]?.id ?? '') }),
      json: async () => ({ status: 'ok' }),
      text: async () => '',
    };
  });

  const result = await requestJson('/api/test', {
    method: 'POST',
    body: { hello: 'world' },
    operation: 'Test operation',
    captureMeta: true,
  });

  assert.deepEqual(result.payload, { status: 'ok' });
  assert.equal(result.meta.request.requestId, result.meta.response.requestId);
  assert.equal(records.length, 2);
  assert.equal(fetchCalls.length, 1);

  assert.equal(records[0].id, records[1].id);
  assert.equal(records[0].id, result.meta.request.requestId);
  assert.equal(fetchCalls[0].init.headers['X-Dashboard-Request-Id'], String(records[0].id));
  assert.equal(result.meta.request.headers['X-Dashboard-Request-Id'], String(records[0].id));
  assert.equal(result.meta.response.headers['x-dashboard-request-id'], String(records[0].id));
  assert.equal(records[0].direction, 'outbound');
  assert.equal(records[0].method, 'POST');
  assert.equal(records[0].path, '/api/test');
  assert.equal(records[0].hasBody, true);
  assert.equal(records[0].operation, 'Test operation');

  assert.equal(records[1].direction, 'inbound');
  assert.equal(records[1].ok, true);
  assert.equal(records[1].status, 200);
  assert.equal(records[1].operation, 'Test operation');

  restoreFetch();
  unsubscribe();
});

// Verifies non-2xx responses keep the same id as their outbound request.
test('requestJson emits inbound failure transit record on non-2xx', async () => {
  /** @type {TransitRecord[]} */
  const records = [];
  const unsubscribe = subscribeTransit((record) => records.push(record));

  const restoreFetch = installFetchStub(async () => ({
    status: 500,
    ok: false,
    statusText: 'Internal Server Error',
    url: 'http://localhost/api/fail',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ message: 'boom' }),
    text: async () => '',
  }));

  let caughtError = null;
  try {
    await requestJson('/api/fail', { method: 'GET', operation: 'Fail operation' });
  } catch (error) {
    caughtError = error;
  }

  assert.ok(caughtError instanceof ApiRequestError);
  assert.equal(caughtError.status, 500);
  assert.equal(caughtError.meta.request.requestId, caughtError.meta.response.requestId);
  assert.equal(records.length, 2);
  assert.equal(records[0].id, records[1].id);
  assert.equal(records[0].id, caughtError.meta.request.requestId);
  assert.equal(records[0].direction, 'outbound');
  assert.equal(records[1].direction, 'inbound');
  assert.equal(records[1].ok, false);
  assert.equal(records[1].status, 500);
  assert.equal(records[1].error, 'boom');

  restoreFetch();
  unsubscribe();
});

// Verifies network failures still correlate the failed inbound record to the request.
test('requestJson emits inbound failure transit record on network error', async () => {
  /** @type {TransitRecord[]} */
  const records = [];
  const unsubscribe = subscribeTransit((record) => records.push(record));

  const restoreFetch = installFetchStub(async () => {
    throw new Error('network down');
  });

  await assert.rejects(
    () => requestJson('/api/network', { method: 'GET', operation: 'Network operation' }),
    (error) => error instanceof ApiRequestError && /Network request failed/.test(error.message),
  );

  assert.equal(records.length, 2);
  assert.equal(records[0].id, records[1].id);
  assert.equal(records[0].direction, 'outbound');
  assert.equal(records[1].direction, 'inbound');
  assert.equal(records[1].ok, false);
  assert.equal(records[1].status, null);
  assert.match(records[1].error, /network down/i);

  restoreFetch();
  unsubscribe();
});
