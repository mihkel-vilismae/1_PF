import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { evaluateRegularWorkerConsumesDownloadManifest } from '../tools/regular-worker-consumes-download-manifest-lib.mjs';

function fixtureDir() { return mkdtempSync(join(tmpdir(), 'pf-worker-manifest-')); }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); return path; }

test('worker manifest consumption is blocked without manifest evidence', () => { assert.equal(evaluateRegularWorkerConsumesDownloadManifest({}, { cwd: process.cwd() }).proofStatus, 'BLOCKED'); });

test('worker manifest consumption resolves selected media from safe manifest when opted in', () => {
  const dir = fixtureDir();
  const manifestPath = writeJson(dir, 'manifest.json', buildSampleDownloadManifest());
  const result = evaluateRegularWorkerConsumesDownloadManifest({
    PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: manifestPath,
    PF_PROOF_ENABLE_WORKER_MANIFEST_CONSUME: 'true',
  }, { cwd: dir });
  assert.equal(result.proofStatus, 'PASSED');
  assert.equal(result.resolved_input.status, 'PASSED');
  assert.equal(result.resolved_input.input.items_seen, 2);
  assert.equal(result.resolved_input.input.items_eligible, 2);
  assert.equal(result.resolved_input.selected_media.media_type, 'image');
});
