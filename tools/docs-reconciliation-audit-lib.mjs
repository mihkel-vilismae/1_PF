/** Critical docs reconciliation audit for PF_login v1 planning. */
import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';

export const CRITICAL_V1_DOCS = Object.freeze([
  'docs/20_architecture_and_specs/openspec/raspberry_v1_release_gate_matrix_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_v1_question_matrix_decisions_openspec.md',
  'docs/40_backlog_and_tasks/raspberry_v1_plan_from_question_matrix.md',
  'docs/20_architecture_and_specs/openspec/raspberry_icloudpd_discovery_preflight_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_icloud_first_regular_worker_pipeline_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_gps_geocode_provider_chain_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_address_overlay_device_proof_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_dashboard_status_view_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_screen_worker_non_blocking_openspec.md',
]);

export const CRITICAL_FORBIDDEN_DOC_PHRASES = Object.freeze([
  'power-loss recovery is required for v1.0',
  '2FA is fully automated',
  'dashboard controls are required for v1.0',
  'placeholder geocode is a real provider proof',
]);

export function inspectCriticalDocs({ repoRoot = process.cwd() } = {}) {
  const docs = CRITICAL_V1_DOCS.map((relativePath) => {
    const path = `${repoRoot}/${relativePath}`;
    const exists = existsSync(path);
    const text = exists ? readFileSync(path, 'utf8') : '';
    return {
      relativePath,
      exists,
      containsStatus: /Status:/i.test(text),
      containsNonClaims: /Non-claims|Non-Claims|non_claims/i.test(text),
      forbiddenPhrases: CRITICAL_FORBIDDEN_DOC_PHRASES.filter((phrase) => text.includes(phrase)),
    };
  });
  return { docs };
}

export function evaluateDocsReconciliationAudit(inspect) {
  const missingDocs = inspect.docs.filter((doc) => !doc.exists).map((doc) => doc.relativePath);
  const missingStatus = inspect.docs.filter((doc) => doc.exists && !doc.containsStatus).map((doc) => doc.relativePath);
  const forbiddenPhraseHits = inspect.docs.flatMap((doc) => doc.forbiddenPhrases.map((phrase) => ({ relativePath: doc.relativePath, phrase })));
  const blockReasons = [];
  if (missingDocs.length) blockReasons.push(`missing critical docs: ${missingDocs.join(', ')}`);
  if (forbiddenPhraseHits.length) blockReasons.push(`forbidden/stale phrases found: ${forbiddenPhraseHits.map((hit) => `${hit.relativePath}:${hit.phrase}`).join(', ')}`);
  return { proofStatus: blockReasons.length ? 'BLOCKED' : 'PASSED', blockReasons, missingDocs, missingStatus, forbiddenPhraseHits };
}

export function buildDocsReconciliationAuditProof({ metadata, repoRoot = process.cwd() } = {}) {
  const inspect = inspectCriticalDocs({ repoRoot });
  const evaluation = evaluateDocsReconciliationAudit(inspect);
  return createProofEnvelope({
    proofKind: 'docs_reconciliation_audit',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: 'critical_docs_reconciliation_audit',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      inspect,
      evaluation,
      pass_criteria: 'PASSED when critical v1 planning/OpenSpec docs exist and no known contradictory critical phrases are present.',
      non_claims: ['does not prove full v1 docs reconciliation', 'does not prove runtime behavior', 'does not replace manual review'],
    }),
    knownLimitations: ['This is a critical-docs audit pre-pass, not the final v1 docs reconciliation gate.'],
  });
}
