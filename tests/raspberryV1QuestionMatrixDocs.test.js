import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const DECISIONS_DOC = 'docs/20_architecture_and_specs/openspec/raspberry_v1_question_matrix_decisions_openspec.md';
const PLAN_DOC = 'docs/40_backlog_and_tasks/raspberry_v1_plan_from_question_matrix.md';

test('question matrix decisions document records confirmed and unresolved IDs', async () => {
  const doc = await readFile(DECISIONS_DOC, 'utf8');
  for (const id of ['I1', 'I2', 'I3', 'G1', 'G2', 'G3', 'R1', 'R2', 'R3', 'A1', 'A2', 'A3', 'D1', 'D2', 'S1', 'S2', 'DOC1', 'DOC2']) {
    assert.match(doc, new RegExp(`\\| ${id} \\|`), `${id} should be represented in the matrix decisions doc`);
  }
  assert.match(doc, /I1[\s\S]*C[\s\S]*not sure/i);
  assert.match(doc, /I3[\s\S]*A[\s\S]*Manual\/operator Apple login and 2FA are acceptable/);
  assert.match(doc, /G3[\s\S]*C[\s\S]*unknown/i);
  assert.match(doc, /R1[\s\S]*B[\s\S]*iCloud download/);
  assert.match(doc, /Unanswered/);
});

test('question matrix plan keeps target-pack ordering repair as the next evidence-driven slice', async () => {
  const plan = await readFile(PLAN_DOC, 'utf8');
  assert.match(plan, /v0\.8\.68 \| Target-pack ordering repair/);
  assert.match(plan, /iCloudPD preflight\/discovery/);
  assert.match(plan, /Nominatim\/OpenStreetMap/);
  assert.match(plan, /Open questions still needing user answers/);
});
