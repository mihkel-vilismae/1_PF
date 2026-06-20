import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { evaluateRealIcloudControlledDownloadDir } from '../tools/real-icloud-controlled-download-dir-lib.mjs';
test('controlled download dir validates existing proof-owned folder', () => { const dir = fixtureDir(); assert.equal(evaluateRealIcloudControlledDownloadDir({ PF_REAL_ICLOUD_DOWNLOAD_DIR: dir }, { cwd: dir }).proofStatus, 'PASSED'); });
