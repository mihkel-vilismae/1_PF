import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { evaluateRealIcloudBatchProducer } from '../tools/real-icloud-batch-producer-lib.mjs';
test('batch1 producer validates first batch manifest evidence', () => { const dir = fixtureDir(); const path = writeJson(dir, 'batch1.json', buildSampleDownloadManifest()); assert.equal(evaluateRealIcloudBatchProducer({ PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: path }, { cwd: dir, manifestEnv: 'PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE', expectedIndex: 0, label: 'batch1' }).proofStatus, 'PASSED'); });
