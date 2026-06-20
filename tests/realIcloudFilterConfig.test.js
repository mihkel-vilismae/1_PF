import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { evaluateRealIcloudFilterConfig } from '../tools/real-icloud-filter-config-lib.mjs';
test('filter config blocks without input and passes with safe filter file', () => {
  assert.equal(evaluateRealIcloudFilterConfig({}, { cwd: process.cwd() }).proofStatus, 'BLOCKED');
  const dir = fixtureDir(); const path = writeJson(dir, 'filter.json', { media_type: 'photo', limit: 5, order: 'newest_first' });
  const result = evaluateRealIcloudFilterConfig({ PF_REAL_ICLOUD_FILTER_FILE: path }, { cwd: dir });
  assert.equal(result.proofStatus, 'PASSED'); assert.match(result.filter_signature, /^sha256:/);
});
