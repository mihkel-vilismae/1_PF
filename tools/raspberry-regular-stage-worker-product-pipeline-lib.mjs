/** Raspberry regular_stage_worker product-pipeline proof. */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';
import {
  REGULAR_WORKER_PRODUCT_ALL_FLAGS,
  REGULAR_WORKER_PRODUCT_CORE_FLAGS,
  REGULAR_WORKER_PRODUCT_ENRICHMENT_FLAGS,
  buildRegularWorkerProductEvidenceTemplateV2,
  evaluateRegularWorkerStructuredEvidence,
  normalizeRegularWorkerProductEvidence,
} from './regular-worker-product-evidence-lib.mjs';

export const REGULAR_STAGE_WORKER_PRODUCT_STAGES = REGULAR_WORKER_PRODUCT_ALL_FLAGS;
export const REGULAR_STAGE_WORKER_PRODUCT_CORE_STAGES = REGULAR_WORKER_PRODUCT_CORE_FLAGS;
export const REGULAR_STAGE_WORKER_PRODUCT_ENRICHMENT_STAGES = REGULAR_WORKER_PRODUCT_ENRICHMENT_FLAGS;

export function buildRegularWorkerProductEvidenceTemplate() {
  return buildRegularWorkerProductEvidenceTemplateV2();
}

export async function loadRegularWorkerProductEvidence({ env = process.env, evidence = null } = {}) {
  if (evidence) return { source: 'injected', data: evidence, load_error: null };
  const file = env.PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE;
  if (!file) return { source: 'none', data: null, load_error: 'PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE is not set' };
  try {
    return { source: file, data: JSON.parse(await readFile(file, 'utf8')), load_error: null };
  } catch (error) {
    return { source: file, data: null, load_error: error instanceof Error ? error.message : String(error) };
  }
}

export function evaluateRegularWorkerProductPipelineEvidence({ target, loadedEvidence }) {
  const blockReasons = [];
  const failedReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (loadedEvidence.load_error) blockReasons.push(loadedEvidence.load_error);
  const data = loadedEvidence.data ?? {};
  if (loadedEvidence.load_error) {
    return {
      proofStatus: 'BLOCKED',
      blockReasons,
      failedReasons,
      missingStages: REGULAR_STAGE_WORKER_PRODUCT_STAGES,
      missingCoreStages: REGULAR_STAGE_WORKER_PRODUCT_CORE_STAGES,
      missingEnrichmentStages: REGULAR_STAGE_WORKER_PRODUCT_ENRICHMENT_STAGES,
      structuredEvaluation: null,
    };
  }

  const structuredEvaluation = evaluateRegularWorkerStructuredEvidence(data);
  failedReasons.push(...structuredEvaluation.failedReasons);
  if (structuredEvaluation.missingCoreFlags.length) failedReasons.push(`regular_stage_worker core product evidence missing true stages: ${structuredEvaluation.missingCoreFlags.join(', ')}`);

  if (blockReasons.length) {
    return {
      proofStatus: 'BLOCKED',
      blockReasons,
      failedReasons,
      missingStages: structuredEvaluation.stageResults.filter((entry) => !entry.passed).map((entry) => entry.flag),
      missingCoreStages: structuredEvaluation.missingCoreFlags,
      missingEnrichmentStages: structuredEvaluation.missingEnrichmentFlags,
      structuredEvaluation,
    };
  }
  if (failedReasons.length) {
    return {
      proofStatus: 'FAILED',
      blockReasons,
      failedReasons,
      missingStages: structuredEvaluation.stageResults.filter((entry) => !entry.passed).map((entry) => entry.flag),
      missingCoreStages: structuredEvaluation.missingCoreFlags,
      missingEnrichmentStages: structuredEvaluation.missingEnrichmentFlags,
      structuredEvaluation,
    };
  }
  return {
    proofStatus: 'PASSED',
    blockReasons,
    failedReasons,
    missingStages: [],
    missingCoreStages: [],
    missingEnrichmentStages: structuredEvaluation.missingEnrichmentFlags,
    structuredEvaluation,
  };
}

export async function buildRaspberryRegularStageWorkerProductPipelineProof({ metadata, env = process.env, evidence = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const loadedEvidence = await loadRegularWorkerProductEvidence({ env, evidence });
  const evaluation = evaluateRegularWorkerProductPipelineEvidence({ target, loadedEvidence });
  const normalizedEvidence = loadedEvidence.data ? normalizeRegularWorkerProductEvidence(loadedEvidence.data) : null;
  return createProofEnvelope({
    proofKind: 'raspberry_regular_stage_worker_product_pipeline',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: 'raspberry_regular_stage_worker_product_pipeline',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      evidence_source: loadedEvidence.source,
      product_pipeline_evidence: normalizedEvidence,
      required_core_stages: REGULAR_STAGE_WORKER_PRODUCT_CORE_STAGES,
      enrichment_stages_tracked_separately: REGULAR_STAGE_WORKER_PRODUCT_ENRICHMENT_STAGES,
      all_tracked_stages: REGULAR_STAGE_WORKER_PRODUCT_STAGES,
      evaluation,
      pass_criteria: 'PASSED only on Raspberry with supplied structured evidence that regular_stage_worker used accepted input and prepared product/display output. GPS/geocode completion is tracked but remains owned by the real_gps_geocode gate.',
      non_claims: ['does not itself download iCloud media', 'does not itself prove real GPS/geocode provider output', 'does not prove native playback or address overlay visibility'],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED'
      ? ['Regular worker input-to-product-to-output evidence is supplied for this run. GPS/geocode and display overlay remain separate proof gates unless their latest proof artifacts pass.']
      : ['Provide PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE after a regular_stage_worker product pipeline run or generated readiness-approved bridge evidence.'],
  });
}
