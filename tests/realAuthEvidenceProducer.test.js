import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
function fixtureDir() { const dir = join(tmpdir(), `pf-evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`); mkdirSync(dir, { recursive: true }); return dir; }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); return path; }
import { buildSampleAuthSessionUsableEvidence } from '../tools/auth-session-usable-evidence-lib.mjs';
import { evaluateRealAuthEvidenceProducer } from '../tools/real-auth-evidence-producer-lib.mjs';
test('auth evidence producer blocks without evidence and passes with redacted evidence', () => {
  assert.equal(evaluateRealAuthEvidenceProducer({}, { cwd: process.cwd() }).proofStatus, 'BLOCKED');
  const dir = fixtureDir();
  const path = writeJson(dir, 'auth.json', buildSampleAuthSessionUsableEvidence());
  assert.equal(evaluateRealAuthEvidenceProducer({ PF_AUTH_SESSION_USABLE_EVIDENCE_FILE: path }, { cwd: dir }).proofStatus, 'PASSED');
});
