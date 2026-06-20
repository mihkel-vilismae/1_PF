import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { evaluateRealProviderArtifactRedaction } from '../tools/real-provider-artifact-redaction-lib.mjs';
test('redaction audit blocks unsafe artifact text and passes safe manifest', () => { const dir = fixtureDir(); const safe = writeJson(dir, 'safe.json', buildSampleDownloadManifest()); assert.equal(evaluateRealProviderArtifactRedaction({ PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: safe }, { cwd: dir }).proofStatus, 'PASSED'); const unsafe = buildSampleDownloadManifest({ account: 'mihkel@example.com' }); const p = writeJson(dir, 'unsafe.json', unsafe); assert.equal(evaluateRealProviderArtifactRedaction({ PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: p }, { cwd: dir }).proofStatus, 'BLOCKED'); });
