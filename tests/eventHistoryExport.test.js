import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildEventHistoryExportPayload,
  copyEventHistoryExportToClipboard,
  formatEventHistoryExport,
} from '../dashboard/services/eventHistoryExport.ts';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Event history shell renders copy all log action beside Clear action', () => {
  const app = read('dashboard/app.ts');
  assert.match(app, /<h2>Event history<\/h2>/);
  assert.match(app, /data-action="copy-history"/);
  assert.match(app, /copy all log/);
  assert.ok(app.indexOf('data-action="copy-history"') < app.indexOf('data-action="clear-history"'));
});

test('event history export preserves all structured entries and detail data', () => {
  const entries = [
    {
      id: 'event-1',
      at: '11:51:09 PM',
      atTallinn: '05.05.2026, 23:51:09',
      atIso: '2026-05-05T20:51:09.865Z',
      source: 'NEW AUTH',
      type: 'success',
      message: 'Authentication session files were found.',
      details: {
        request: {
          method: 'GET',
          path: '/api/auth/new/status',
          headers: { accept: 'application/json' },
          body: null,
        },
        response: {
          status: 200,
          statusText: 'OK',
          ok: true,
          url: 'http://127.0.0.1:5173/api/auth/new/status',
          headers: { 'content-type': 'application/json' },
          body: { state: 'authenticated' },
        },
      },
    },
    {
      id: 'event-2',
      at: '11:51:06 PM',
      source: 'NEW AUTH',
      type: 'success',
      message: 'iCloudPD was found and can be executed.',
    },
  ];

  const payload = buildEventHistoryExportPayload(entries, '2026-05-05T21:00:00.000Z');

  assert.equal(payload.exportedAt, '2026-05-05T21:00:00.000Z');
  assert.equal(payload.source, 'Event history');
  assert.equal(payload.count, 2);
  assert.deepEqual(payload.logs, entries);
  assert.equal(payload.logs[0].details.response.body.state, 'authenticated');
  assert.equal(Object.hasOwn(payload.logs[1], 'details'), false);
});

test('event history export formats valid readable JSON', () => {
  const json = formatEventHistoryExport([{ id: 'event-1', source: 'BOOT', message: 'Ready.' }], '2026-05-05T21:00:00.000Z');
  const parsed = JSON.parse(json);

  assert.match(json, /\n  "exportedAt":/);
  assert.equal(parsed.count, 1);
  assert.equal(parsed.logs[0].message, 'Ready.');
});

test('event history clipboard export writes JSON text', async () => {
  let copied = '';
  const clipboard = {
    async writeText(text) {
      copied = text;
    },
  };

  await copyEventHistoryExportToClipboard([{ id: 'event-1', source: 'USER', message: 'History cleared.' }], clipboard);

  const parsed = JSON.parse(copied);
  assert.equal(parsed.source, 'Event history');
  assert.equal(parsed.count, 1);
  assert.equal(parsed.logs[0].source, 'USER');
});

test('event history clipboard export reports missing clipboard API', async () => {
  await assert.rejects(
    copyEventHistoryExportToClipboard([{ id: 'event-1' }], undefined),
    /Clipboard API is not available/,
  );
});
