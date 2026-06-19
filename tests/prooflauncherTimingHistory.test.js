import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimingHistorySummary, estimateProofDuration, buildTimingObservation } from '../tools/prooflauncher-timing-history-lib.mjs';

test('prooflauncher timing estimates prefer exact command history before category/platform/global averages', () => {
  const summary = buildTimingHistorySummary([
    { command: 'proof:a', category: 'docs', platform: 'win', duration_seconds: 10 },
    { command: 'proof:a', category: 'docs', platform: 'win', duration_seconds: 20 },
    { command: 'proof:b', category: 'provider', platform: 'raspberryos', duration_seconds: 50 },
  ]);
  assert.equal(estimateProofDuration({ commandName: 'proof:a', platform: 'win', historySummary: summary }).estimate_source, 'command_history');
  assert.equal(estimateProofDuration({ commandName: 'proof:docs-reconciliation-audit', platform: 'win', historySummary: summary }).estimate_source, 'category_history');
  assert.equal(estimateProofDuration({ commandName: 'proof:totally-unknown', platform: 'raspberryos', historySummary: summary }).estimate_source, 'platform_average');
});

test('prooflauncher timing observation records category and duration fields', () => {
  const observation = buildTimingObservation({ commandName: 'proof:real-icloudpd-readiness', status: 'PASS', exitCode: 0, startedAt: 't1', endedAt: 't2', durationSeconds: 12, platform: 'win' });
  assert.equal(observation.category, 'provider');
  assert.equal(observation.duration_seconds, 12);
});
