/** Final Raspberry v1 docs reconciliation proof helper. */
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { buildDocsReconciliationAuditProof } from './docs-reconciliation-audit-lib.mjs';
import { buildOpenSpecV1AuditProof } from './openspec-v1-audit-lib.mjs';
import { buildV1ReadinessLiveDataRequirements } from './raspberry-v1-readiness-lib.mjs';

export function buildRaspberryV1DocsReconciliationProof({ metadata, repoRoot = process.cwd() }) {
  const docsAudit = buildDocsReconciliationAuditProof({ metadata, repoRoot });
  const openspecAudit = buildOpenSpecV1AuditProof({ metadata, repoRoot });
  const requirements = buildV1ReadinessLiveDataRequirements();
  const checks = [
    { name: 'critical_docs_reconciliation_audit_passed', passed: docsAudit.proof_status === 'PASSED' },
    { name: 'openspec_v1_audit_passed', passed: openspecAudit.proof_status === 'PASSED' },
    { name: 'readiness_requirements_cover_v1_gates', passed: requirements.required_gate_count === 11 && requirements.required_proof_kinds.includes('raspberry_v1_docs_reconciliation') },
    { name: 'live_data_policy_keeps_target_proof_separate', passed: /do not replace Raspberry target proof artifacts/.test(requirements.local_prepass_policy) },
  ];
  const passed = checks.every((check) => check.passed);
  return createProofEnvelope({
    proofKind: 'raspberry_v1_docs_reconciliation',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: passed ? 'PASSED' : 'BLOCKED',
    runtimeMode: 'raspberry_v1_docs_reconciliation_static_gate',
    evidence: sanitizeEvidence({ environment: getProofEnvironment(), checks, docs_audit_status: docsAudit.proof_status, openspec_audit_status: openspecAudit.proof_status, readiness_requirements: requirements, non_claims: ['does not prove real iCloud, geocode, product pipeline, display, or hardware behavior', 'does not replace live runtime_data/proofs artifacts for other v1 gates'] }),
    knownLimitations: passed ? ['Documentation/OpenSpec reconciliation passed; runtime/provider gates still require their own proof artifacts.'] : ['Inspect checks for blocked documentation/OpenSpec reconciliation items.'],
  });
}
