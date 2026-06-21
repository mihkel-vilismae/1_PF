import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { REGULAR_STAGE_WORKER_PRODUCT_STAGES, buildRegularWorkerProductEvidenceTemplate } from '../tools/raspberry-regular-stage-worker-product-pipeline-lib.mjs';

test('regular worker product contract keeps the required stage list explicit', () => {
  assert.deepEqual(REGULAR_STAGE_WORKER_PRODUCT_STAGES, [
    'media_source_observed',
    'download_or_import_completed',
    'index_completed',
    'gps_extraction_completed',
    'geocode_completed',
    'queue_prepared',
    'worker_status_product_work_claimed',
  ]);
  const template = buildRegularWorkerProductEvidenceTemplate();
  for (const stage of REGULAR_STAGE_WORKER_PRODUCT_STAGES) assert.equal(template[stage], false);
});

test('regular worker product OpenSpec describes the current structured v2 evidence contract', () => {
  const doc = readFileSync('docs/20_architecture_and_specs/openspec/raspberry_icloud_first_regular_worker_pipeline_openspec.md', 'utf8');
  assert.match(doc, /Refined: v0\.10\.3 regular worker product evidence bridge/);
  assert.match(doc, /Evidence shape v2/);
  assert.ok(doc.includes(`real/readiness download manifest
→ regular worker input resolver
→ selected eligible media
→ product record evidence
→ display queue/output preparation
→ redacted proof artifact`));
  assert.match(doc, /evidence_schema_version/);
  assert.match(doc, /worker product gate may pass with L2\/L3 core evidence/);
  assert.match(doc, /real_gps_geocode/);
  assert.match(doc, /address_overlay_device_display/);
  assert.match(doc, /Product evidence cannot claim real geocode unless provider proof or cached real-provider data supports it/);
  assert.match(doc, /Product evidence cannot claim address overlay visibility/);
  assert.match(doc, /raw media bytes/);
});
