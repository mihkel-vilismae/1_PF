import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const doc = readFileSync('docs/10_runbooks/auth_checkpoint_operator_flow.md', 'utf8');

test('auth checkpoint operator flow documents all app-owned states', () => {
  for (const state of ['AUTH_REQUIRED', 'AUTH_READY_FOR_OPERATOR', 'AUTH_IN_PROGRESS', 'AUTH_SESSION_DETECTED', 'AUTH_SESSION_USABLE', 'AUTH_BLOCKED']) {
    assert.match(doc, new RegExp(state));
  }
});

test('auth checkpoint operator flow preserves secret boundary and non-claims', () => {
  for (const forbidden of ['passwords', 'two-factor codes', 'cookies', 'provider tokens', 'Apple ID raw values', 'raw `.env` values', 'raw session files']) {
    assert.match(doc, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(doc, /does not perform login/);
  assert.match(doc, /download media/);
  assert.match(doc, /Raspberry v1 readiness/);
});

test('auth checkpoint operator flow ties usable state to provider pass', () => {
  assert.match(doc, /Only `AUTH_SESSION_USABLE` with provider check status `passed`/);
  assert.match(doc, /npm run proof:auth-checkpoint-state/);
});
