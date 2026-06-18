import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRaspberryV1DocsReconciliationProof } from '../tools/raspberry-v1-docs-reconciliation-proof-lib.mjs';

test('raspberry v1 docs reconciliation proof combines docs and openspec audits', () => {
  const envelope = buildRaspberryV1DocsReconciliationProof({ metadata: { version: 'test', gitCommit: 'test' }, repoRoot: process.cwd() });
  assert.equal(envelope.proof_kind, 'raspberry_v1_docs_reconciliation');
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.docs_audit_status, 'PASSED');
  assert.equal(envelope.evidence.openspec_audit_status, 'PASSED');
  assert.ok(envelope.evidence.readiness_requirements.required_proof_kinds.includes('raspberry_v1_docs_reconciliation'));
});
