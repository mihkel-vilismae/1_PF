import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-batch-e-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { buildSampleEvidenceZipManifest, evaluateRealIcloudEvidenceZipContract } from '../tools/real-icloud-evidence-zip-contract-lib.mjs';
test('evidence ZIP contract blocks without manifest and passes with safe manifest', () => {
  assert.equal(evaluateRealIcloudEvidenceZipContract({}, { cwd: process.cwd() }).proofStatus, 'BLOCKED');
  const dir = fixtureDir(); const path = writeJson(dir, 'zip_manifest.json', buildSampleEvidenceZipManifest());
  assert.equal(evaluateRealIcloudEvidenceZipContract({ PF_REAL_ICLOUD_EVIDENCE_ZIP_MANIFEST_FILE: path }, { cwd: dir }).proofStatus, 'PASSED');
});
