import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDocsReconciliationAudit, inspectCriticalDocs } from '../tools/docs-reconciliation-audit-lib.mjs';

test('docs reconciliation audit passes for current critical docs', () => {
  const inspect = inspectCriticalDocs({ repoRoot: process.cwd() });
  const evaluation = evaluateDocsReconciliationAudit(inspect);
  assert.equal(evaluation.proofStatus, 'PASSED');
  assert.deepEqual(evaluation.missingDocs, []);
});

test('docs reconciliation audit blocks on missing critical docs or stale contradictions', () => {
  const evaluation = evaluateDocsReconciliationAudit({ docs: [{ relativePath: 'missing.md', exists: false, containsStatus: false, containsNonClaims: false, forbiddenPhrases: [] }, { relativePath: 'bad.md', exists: true, containsStatus: true, containsNonClaims: true, forbiddenPhrases: ['2FA is fully automated'] }] });
  assert.equal(evaluation.proofStatus, 'BLOCKED');
  assert.ok(evaluation.blockReasons.length >= 2);
});
