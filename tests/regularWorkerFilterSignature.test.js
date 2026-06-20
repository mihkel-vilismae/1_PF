import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { evaluateRealIcloudFilterConfig } from '../tools/real-icloud-filter-config-lib.mjs';
import { evaluateRegularWorkerFilterSignature } from '../tools/regular-worker-filter-signature-lib.mjs';
test('worker filter signature matches manifest signature', () => { const dir = fixtureDir(); const filterPath = writeJson(dir, 'filter.json', { media_type: 'photo', limit: 5 }); const sig = evaluateRealIcloudFilterConfig({ PF_REAL_ICLOUD_FILTER_FILE: filterPath }, { cwd: dir }).filter_signature; const manifest = buildSampleDownloadManifest({ filter_signature: sig }); manifest.batches[0].filter_signature = sig; const manifestPath = writeJson(dir, 'manifest.json', manifest); assert.equal(evaluateRegularWorkerFilterSignature({ PF_REAL_ICLOUD_FILTER_FILE: filterPath, PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: manifestPath }, { cwd: dir }).proofStatus, 'PASSED'); });
