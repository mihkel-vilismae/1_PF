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

test('requestJson emits outbound + inbound transit records (success)', async () => {
  /** @type {TransitRecord[]} */
  const records = [];
  const unsubscribe = subscribeTransit((record) => records.push(record));

  const restoreFetch = installFetchStub(async () => ({
    status: 200,
    ok: true,
    statusText: 'OK',
    url: 'http://localhost/api/test',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ status: 'ok' }),
    text: async () => '',
  }));

  const payload = await requestJson('/api/test', {
    method: 'POST',
    body: { hello: 'world' },
    operation: 'Test operation',
  });

  assert.deepEqual(payload, { status: 'ok' });
  assert.equal(records.length, 2);

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

  await assert.rejects(
    () => requestJson('/api/fail', { method: 'GET', operation: 'Fail operation' }),
    (error) => error instanceof ApiRequestError && error.status === 500,
  );

  assert.equal(records.length, 2);
  assert.equal(records[0].direction, 'outbound');
  assert.equal(records[1].direction, 'inbound');
  assert.equal(records[1].ok, false);
  assert.equal(records[1].status, 500);
  assert.equal(records[1].error, 'boom');

  restoreFetch();
  unsubscribe();
});

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
  assert.equal(records[0].direction, 'outbound');
  assert.equal(records[1].direction, 'inbound');
  assert.equal(records[1].ok, false);
  assert.equal(records[1].status, null);
  assert.match(records[1].error, /network down/i);

  restoreFetch();
  unsubscribe();
});

