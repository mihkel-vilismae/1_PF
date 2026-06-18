import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assertViewAPlanKeepsModeBoundary, buildViewARefreshPlan } from '../dashboard/services/viewARefreshPlan.ts';

test('View A refresh plan defines safe base actions', () => {
  const plan = buildViewARefreshPlan(null);
  assert.deepEqual(plan.actions, ['verify-env', 'check-db', 'check-cron']);
  assert.equal(plan.safeRefreshOnly, true);
  assert.equal(plan.productionMutation, false);
  assert.equal(assertViewAPlanKeepsModeBoundary(plan), true);
});

test('View A app binding uses the explicit refresh plan', () => {
  const source = readFileSync('dashboard/app.ts', 'utf8');
  assert.match(source, /buildViewARefreshPlan/);
  assert.match(source, /View A preload\/refresh plan executed/);
  assert.match(source, /productionMutation: plan\.productionMutation/);
});

test('View A Test Mode excludes provider login/session refresh actions', () => {
  const plan = buildViewARefreshPlan('test');
  assert.deepEqual(plan.actions, ['verify-env', 'check-db', 'check-cron']);
  assert.equal(plan.productionMutation, false);
  assert.match(plan.nonClaim, /Test Mode refresh excludes NEW AUTH/);
  assert.equal(assertViewAPlanKeepsModeBoundary(plan), true);
});

test('View A Real Mode allows only provider session status refresh, not login proof', () => {
  const plan = buildViewARefreshPlan('real');
  assert.deepEqual(plan.actions, ['verify-env', 'check-db', 'check-cron', 'new-auth-check-login']);
  assert.equal(plan.productionMutation, false);
  assert.match(plan.nonClaim, /does not perform login or prove provider success/);
  assert.equal(assertViewAPlanKeepsModeBoundary(plan), true);
});
