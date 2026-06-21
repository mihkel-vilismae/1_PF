import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-batch-e-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { evaluateRealIcloudEvidenceRunPackage } from '../tools/real-icloud-evidence-run-package-lib.mjs';
test('real evidence run package remains blocked without operator evidence', () => { const result = evaluateRealIcloudEvidenceRunPackage({}, { cwd: process.cwd() }); assert.equal(result.proofStatus, 'BLOCKED'); assert.equal(result.sections.auth, 'BLOCKED'); });
