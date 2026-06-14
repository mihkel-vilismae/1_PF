/** Raspberry regular_stage_worker product-pipeline proof scaffold. */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

export const REGULAR_STAGE_WORKER_PRODUCT_STAGES = Object.freeze([
  'media_source_observed',
  'download_or_import_completed',
  'index_completed',
  'gps_extraction_completed',
  'geocode_completed',
  'queue_prepared',
  'worker_status_product_work_claimed',
]);

export function buildRegularWorkerProductEvidenceTemplate() {
  return {
    media_source_observed: false,
    download_or_import_completed: false,
    index_completed: false,
    gps_extraction_completed: false,
    geocode_completed: false,
    queue_prepared: false,
    worker_status_product_work_claimed: false,
    observed_at: new Date().toISOString(),
    operator_note: 'Set required fields to true only after regular_stage_worker performs real product pipeline work on the Raspberry.',
  };
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
  const missingStages = REGULAR_STAGE_WORKER_PRODUCT_STAGES.filter((stage) => data[stage] !== true);
  if (!loadedEvidence.load_error && missingStages.length) failedReasons.push(`regular_stage_worker product evidence missing true stages: ${missingStages.join(', ')}`);
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, failedReasons, missingStages };
  if (failedReasons.length) return { proofStatus: 'FAILED', blockReasons, failedReasons, missingStages };
  return { proofStatus: 'PASSED', blockReasons, failedReasons, missingStages: [] };
}

export async function buildRaspberryRegularStageWorkerProductPipelineProof({ metadata, env = process.env, evidence = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const loadedEvidence = await loadRegularWorkerProductEvidence({ env, evidence });
  const evaluation = evaluateRegularWorkerProductPipelineEvidence({ target, loadedEvidence });
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
      product_pipeline_evidence: loadedEvidence.data,
      required_stages: REGULAR_STAGE_WORKER_PRODUCT_STAGES,
      evaluation,
      pass_criteria: 'PASSED only on Raspberry with supplied evidence that regular_stage_worker performed media source, download/import, index, GPS extraction, geocode, and queue preparation product work.',
      non_claims: ['does not itself download iCloud media', 'does not itself geocode provider output', 'does not prove native playback or address overlay'],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED' ? ['Regular worker product-stage evidence is supplied for this run.'] : ['Provide PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE after a real regular_stage_worker product pipeline run.'],
  });
}
