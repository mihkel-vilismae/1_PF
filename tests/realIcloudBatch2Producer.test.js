import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { buildTwoBatchManifest } from '../tools/download-manifest-overlap-check-lib.mjs';
import { evaluateRealIcloudBatchProducer } from '../tools/real-icloud-batch-producer-lib.mjs';
test('batch2 producer validates second batch manifest evidence', () => { const dir = fixtureDir(); const path = writeJson(dir, 'batch2.json', buildTwoBatchManifest()); assert.equal(evaluateRealIcloudBatchProducer({ PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE: path }, { cwd: dir, manifestEnv: 'PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE', expectedIndex: 1, label: 'batch2' }).proofStatus, 'PASSED'); });
