import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { buildTwoBatchManifest } from '../tools/download-manifest-overlap-check-lib.mjs';
import { evaluateRealIcloudNoLoopProducer } from '../tools/real-icloud-no-loop-producer-lib.mjs';
test('no-loop producer passes with non-overlapping batch manifests', () => { const dir = fixtureDir(); const b1 = buildSampleDownloadManifest(); const b2 = buildTwoBatchManifest(); b2.filter_signature = b1.filter_signature; b2.batches[1].filter_signature = b1.filter_signature; const p1 = writeJson(dir, 'b1.json', b1); const p2 = writeJson(dir, 'b2.json', b2); assert.equal(evaluateRealIcloudNoLoopProducer({ PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: p1, PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE: p2 }, { cwd: dir }).proofStatus, 'PASSED'); });
