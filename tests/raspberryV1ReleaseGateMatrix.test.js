import test from 'node:test';
import assert from 'node:assert/strict';
import { RASPBERRY_V1_MATRIX_DECISIONS, RASPBERRY_V1_RELEASE_GATES, evaluateRaspberryV1Readiness } from '../tools/raspberry-v1-readiness-lib.mjs';

function decision(id) {
  return RASPBERRY_V1_MATRIX_DECISIONS.find((entry) => entry.id === id);
}

function gate(id) {
  return RASPBERRY_V1_RELEASE_GATES.find((entry) => entry.id === id);
}

test('answered matrix makes real iCloud and GPS/geocode v1.0 requirements', () => {
  assert.match(decision(2).decision, /real iCloud/i);
  assert.match(decision(3).decision, /real GPS\/geocode/i);
  assert.equal(gate('real_icloud_media_source').requiredForV1, true);
  assert.equal(gate('real_gps_geocode').requiredForV1, true);
});

test('answered matrix keeps reboot and physical power-loss out of v1.0 blockers', () => {
  assert.equal(gate('manual_reboot_recovery').requiredForV1, false);
  assert.equal(gate('physical_power_loss_recovery').requiredForV1, false);
});

test('answered matrix requires regular worker real product pipeline and dashboard status', () => {
  assert.equal(gate('regular_worker_product_pipeline').requiredForV1, true);
  assert.equal(gate('dashboard_status_view').requiredForV1, true);
  assert.match(decision(12).decision, /real download\/index\/GPS\/geocode\/queue/i);
});

test('readiness is blocked when required v1.0 gates have no proof artifacts', () => {
  const readiness = evaluateRaspberryV1Readiness({ latestByKind: {} });
  assert.equal(readiness.proofStatus, 'BLOCKED');
  assert.ok(readiness.blocking_gate_ids.includes('real_icloud_media_source'));
  assert.ok(readiness.blocking_gate_ids.includes('cron_app_running'));
  assert.ok(!readiness.blocking_gate_ids.includes('manual_reboot_recovery'));
  assert.ok(!readiness.blocking_gate_ids.includes('physical_power_loss_recovery'));
});
