/** OpenSpec v1 audit proof for active Raspberry v1 specification docs. */
import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';

export const OPEN_SPEC_V1_REQUIRED_DOCS = Object.freeze([
  'docs/20_architecture_and_specs/openspec/raspberry_v1_release_gate_matrix_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_v1_question_matrix_decisions_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_v1_openspec_traceability_matrix.md',
  'docs/20_architecture_and_specs/openspec/raspberry_icloudpd_discovery_preflight_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_icloud_first_regular_worker_pipeline_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_gps_geocode_provider_chain_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_address_overlay_device_proof_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_dashboard_status_view_openspec.md',
  'docs/20_architecture_and_specs/openspec/raspberry_screen_worker_non_blocking_openspec.md',
]);

export const OPEN_SPEC_REQUIRED_PATTERNS = Object.freeze([
  { key: 'status', pattern: /Status:/i },
  { key: 'purpose_or_goal', pattern: /## (Purpose|Goal)/i },
  { key: 'non_claims', pattern: /## Non-claims|## Non-Claims/i },
]);

export function inspectOpenSpecDoc({ repoRoot = process.cwd(), relativePath }) {
  const fullPath = `${repoRoot}/${relativePath}`;
  if (!existsSync(fullPath)) return { relativePath, exists: false, missingPatterns: OPEN_SPEC_REQUIRED_PATTERNS.map((entry) => entry.key), lines: 0 };
  const text = readFileSync(fullPath, 'utf8');
  return {
    relativePath,
    exists: true,
    missingPatterns: OPEN_SPEC_REQUIRED_PATTERNS.filter((entry) => !entry.pattern.test(text)).map((entry) => entry.key),
    lines: text.split(/\r?\n/).length,
  };
}

export function inspectOpenSpecBundle({ repoRoot = process.cwd(), docs = OPEN_SPEC_V1_REQUIRED_DOCS } = {}) {
  return { docs: docs.map((relativePath) => inspectOpenSpecDoc({ repoRoot, relativePath })) };
}

export function evaluateOpenSpecAudit(inspection) {
  const missingDocs = inspection.docs.filter((doc) => !doc.exists).map((doc) => doc.relativePath);
  const docsMissingPatterns = inspection.docs.filter((doc) => doc.exists && doc.missingPatterns.length).map((doc) => ({ relativePath: doc.relativePath, missingPatterns: doc.missingPatterns }));
  const blockReasons = [];
  if (missingDocs.length) blockReasons.push(`missing OpenSpec docs: ${missingDocs.join(', ')}`);
  if (docsMissingPatterns.length) blockReasons.push(`OpenSpec docs missing required sections: ${docsMissingPatterns.map((doc) => `${doc.relativePath}(${doc.missingPatterns.join('+')})`).join(', ')}`);
  return { proofStatus: blockReasons.length ? 'BLOCKED' : 'PASSED', blockReasons, missingDocs, docsMissingPatterns };
}

export function buildOpenSpecV1AuditProof({ metadata, repoRoot = process.cwd() } = {}) {
  const inspection = inspectOpenSpecBundle({ repoRoot });
  const evaluation = evaluateOpenSpecAudit(inspection);
  return createProofEnvelope({
    proofKind: 'openspec_v1_audit',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: 'openspec_v1_static_audit',
    evidence: sanitizeEvidence({ environment: getProofEnvironment(), inspection, evaluation, pass_criteria: 'PASSED when all critical Raspberry v1 OpenSpec docs exist and include status, purpose/goal, and non-claims sections.', non_claims: ['does not prove runtime behavior', 'does not prove implementation completeness', 'does not replace manual architectural review'] }),
    knownLimitations: ['Static OpenSpec audit only checks required documentation structure and known contracts.'],
  });
}
