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

test('regular worker product OpenSpec requires staged-write boundaries before real implementation', () => {
  const doc = readFileSync('docs/20_architecture_and_specs/openspec/raspberry_icloud_first_regular_worker_pipeline_openspec.md', 'utf8');
  assert.match(doc, /Contract refinement — v0\.8\.162/);
  assert.match(doc, /staged writes are the default/);
  assert.match(doc, /production database\/media mutation requires an explicit implementation slice/);
  assert.match(doc, /geocode completion may be true only when real provider proof/);
});
