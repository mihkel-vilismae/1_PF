import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOpenSpecAudit, inspectOpenSpecBundle } from '../tools/openspec-v1-audit-lib.mjs';

test('OpenSpec v1 audit passes for current critical docs', () => {
  const inspection = inspectOpenSpecBundle({ repoRoot: process.cwd() });
  const evaluation = evaluateOpenSpecAudit(inspection);
  assert.equal(evaluation.proofStatus, 'PASSED');
  assert.deepEqual(evaluation.missingDocs, []);
});

test('OpenSpec v1 audit blocks when required docs or sections are missing', () => {
  const evaluation = evaluateOpenSpecAudit({ docs: [{ relativePath: 'missing.md', exists: false, missingPatterns: ['status'] }, { relativePath: 'bad.md', exists: true, missingPatterns: ['non_claims'] }] });
  assert.equal(evaluation.proofStatus, 'BLOCKED');
  assert.equal(evaluation.missingDocs.length, 1);
  assert.equal(evaluation.docsMissingPatterns.length, 1);
});
