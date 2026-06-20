import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { evaluateDownloadPartialFileSafety } from '../tools/download-partial-file-safety-lib.mjs';
test('partial file safety rejects zero byte/temp names', () => { const dir = fixtureDir(); const safe = buildSampleDownloadManifest(); safe.batches[0].items[0].finalized = true; const safePath = writeJson(dir, 'safe.json', safe); assert.equal(evaluateDownloadPartialFileSafety({ PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: safePath }, { cwd: dir }).proofStatus, 'PASSED'); const bad = buildSampleDownloadManifest(); bad.batches[0].items[0].size_bytes = 0; bad.batches[0].items[0].safe_filename = 'IMG.tmp'; const badPath = writeJson(dir, 'bad.json', bad); assert.equal(evaluateDownloadPartialFileSafety({ PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: badPath }, { cwd: dir }).proofStatus, 'BLOCKED'); });
