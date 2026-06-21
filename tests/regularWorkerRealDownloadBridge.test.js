import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { buildTwoBatchManifest } from '../tools/download-manifest-overlap-check-lib.mjs';
import { evaluateRegularWorkerRealDownloadBridge } from '../tools/regular-worker-real-download-bridge-lib.mjs';

function fixtureDir() { return mkdtempSync(join(tmpdir(), 'pf-worker-bridge-')); }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); return path; }

test('regular worker bridge is blocked until opt-in and no-loop evidence exist', () => { assert.equal(evaluateRegularWorkerRealDownloadBridge({}, { cwd: process.cwd() }).proofStatus, 'BLOCKED'); });

test('regular worker bridge resolves worker input from non-overlapping real download manifests', () => {
  const dir = fixtureDir();
  const batch1 = buildSampleDownloadManifest();
  const batch2 = buildTwoBatchManifest();
  batch2.filter_signature = batch1.filter_signature;
  batch2.batches[1].filter_signature = batch1.filter_signature;
  const b1Path = writeJson(dir, 'b1.json', batch1);
  const b2Path = writeJson(dir, 'b2.json', batch2);
  const result = evaluateRegularWorkerRealDownloadBridge({
    PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: b1Path,
    PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE: b2Path,
    PF_PROOF_ENABLE_REAL_WORKER_BRIDGE: 'true',
  }, { cwd: dir });
  assert.equal(result.proofStatus, 'PASSED');
  assert.equal(result.upstream_no_loop_status, 'PASSED');
  assert.equal(result.resolved_input.input.source_kind, 'real_download_manifest');
  assert.equal(result.resolved_input.selected_media.source_provenance, 'real_download');
});
