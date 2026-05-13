/*
 * Verifies Event history modal transport details remain visible and correlated.
 * Request/response ids are rendered as separate summary fields for debugging.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { renderModal } from '../dashboard/services/renderers.ts';

test('Event history modal renders request id fields under Request and Response', () => {
  const markup = renderModal({
    kind: 'history',
    title: 'Backend request completed',
    entry: {
      source: 'NEW AUTH',
      type: 'success',
      message: 'Status refreshed.',
      details: {
        request: {
          requestId: 5,
          method: 'GET',
          path: '/api/auth/new/status?mode=passive',
          headers: {
            Accept: 'application/json',
            'X-Dashboard-Request-Id': '5',
          },
          body: null,
        },
        response: {
          requestId: 5,
          status: 200,
          statusText: 'OK',
          ok: true,
          url: 'http://localhost:5173/api/auth/new/status?mode=passive',
          headers: {
            'content-type': 'application/json',
            'x-dashboard-request-id': '5',
          },
          body: { ok: true },
        },
      },
    },
  });

  assert.match(markup, /<p class="modal-panel__section-title">Request<\/p>[\s\S]*<dt>Request ID<\/dt><dd>5<\/dd>/);
  assert.match(markup, /<p class="modal-panel__section-title">Response<\/p>[\s\S]*<dt>Request ID<\/dt><dd>5<\/dd>/);
});

test('Event history modal falls back to request id from captured headers', () => {
  const markup = renderModal({
    kind: 'history',
    title: 'Backend request completed',
    entry: {
      source: 'INIT',
      type: 'success',
      message: 'Environment checked.',
      details: {
        request: {
          method: 'POST',
          path: '/api/init/verify-env',
          headers: { 'X-Dashboard-Request-Id': '8' },
          body: null,
        },
        response: {
          status: 200,
          statusText: 'OK',
          ok: true,
          url: 'http://localhost:5173/api/init/verify-env',
          headers: { 'x-dashboard-request-id': '8' },
          body: { status: 'ok' },
        },
      },
    },
  });

  assert.equal((markup.match(/<dt>Request ID<\/dt><dd>8<\/dd>/g) ?? []).length, 2);
});
