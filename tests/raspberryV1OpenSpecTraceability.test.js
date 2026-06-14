import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const TRACEABILITY_DOC = 'docs/20_architecture_and_specs/openspec/raspberry_v1_openspec_traceability_matrix.md';
const requiredGates = [
  'raspberry_target_readiness',
  'install_runtime_preflight',
  'real_icloud_media_source',
  'real_gps_geocode',
  'regular_worker_product_pipeline',
  'playback_native_display',
  'address_overlay_device_display',
  'cron_app_running',
  'dashboard_status_view',
  'screen_worker_non_blocking',
  'docs_reconciled',
];

test('OpenSpec traceability matrix lists every required v1 gate', async () => {
  const doc = await readFile(TRACEABILITY_DOC, 'utf8');
  for (const gate of requiredGates) assert.ok(doc.includes('`' + gate + '`'), gate + ' should be present');
});

test('OpenSpec traceability matrix links gates to proof commands and non-claims', async () => {
  const doc = await readFile(TRACEABILITY_DOC, 'utf8');
  assert.match(doc, /npm run proof:raspberry-icloudpd-preflight/);
  assert.match(doc, /npm run proof:raspberry-app-running-target-pack/);
  assert.match(doc, /Non-claims/);
  assert.match(doc, /A scaffolded proof command is not a passed proof/);
});
