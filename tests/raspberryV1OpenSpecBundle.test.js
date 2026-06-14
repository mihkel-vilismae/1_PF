import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const specs = [
  'docs/20_architecture_and_specs/openspec/raspberry_icloudpd_discovery_preflight_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_icloud_first_regular_worker_pipeline_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_gps_geocode_provider_chain_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_address_overlay_device_proof_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_dashboard_status_view_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_screen_worker_non_blocking_openspec.md',
];

test('v1 OpenSpec bundle exists and preserves proof-honesty non-claims', async () => {
  for (const file of specs) {
    const text = await readFile(file, 'utf8');
    assert.match(text, /Status: active/);
    assert.match(text, /Non-claims/);
  }
});

test('v1 OpenSpec bundle records clarified question-matrix decisions', async () => {
  const gps = await readFile(specs[2], 'utf8');
  assert.match(gps, /OpenStreetMap\/Nominatim/);
  assert.match(gps, /unknown/);
  const regular = await readFile(specs[1], 'utf8');
  assert.match(regular, /iCloud download is the first priority/);
  assert.match(regular, /source discovery/);
});
