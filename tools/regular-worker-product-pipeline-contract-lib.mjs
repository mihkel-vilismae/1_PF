/** Contract helpers for the regular_stage_worker product pipeline evidence. */
import {
  REGULAR_WORKER_PRODUCT_ACCEPTED_SOURCE_KINDS,
  REGULAR_WORKER_PRODUCT_ALL_FLAGS,
  REGULAR_WORKER_PRODUCT_CORE_FLAGS,
  REGULAR_WORKER_PRODUCT_ENRICHMENT_FLAGS,
  deriveRegularWorkerProductEvidenceFlags,
  evaluateRegularWorkerStructuredEvidence,
} from './regular-worker-product-evidence-lib.mjs';

export const REGULAR_WORKER_PRODUCT_PIPELINE_STAGES = Object.freeze([
  'source_discovery',
  'download_or_import',
  'index',
  'gps_extraction',
  'geocode',
  'queue_prepare',
]);

export const REGULAR_WORKER_PRODUCT_EVIDENCE_FLAGS = Object.freeze({
  source_discovery: 'media_source_observed',
  download_or_import: 'download_or_import_completed',
  index: 'index_completed',
  gps_extraction: 'gps_extraction_completed',
  geocode: 'geocode_completed',
  queue_prepare: 'queue_prepared',
});

export function buildRegularWorkerProductPipelineContract({ sourcePriority = 'icloud_first', writesPolicy = 'staged_until_confirmed', missingGpsPolicy = 'mark_unknown_and_playable' } = {}) {
  return {
    worker: 'regular_stage_worker',
    sourcePriority,
    writesPolicy,
    missingGpsPolicy,
    acceptedSourceKinds: REGULAR_WORKER_PRODUCT_ACCEPTED_SOURCE_KINDS,
    coreEvidenceFlags: REGULAR_WORKER_PRODUCT_CORE_FLAGS,
    enrichmentEvidenceFlags: REGULAR_WORKER_PRODUCT_ENRICHMENT_FLAGS,
    stages: REGULAR_WORKER_PRODUCT_PIPELINE_STAGES.map((stage, index) => ({ stage, order: index + 1, evidenceFlag: REGULAR_WORKER_PRODUCT_EVIDENCE_FLAGS[stage] })),
    finalEvidenceFlag: 'worker_status_product_work_claimed',
    nonClaims: ['contract is not a runtime product proof', 'contract does not prove iCloud access', 'contract does not prove real GPS/geocode provider output', 'contract does not mutate database rows'],
  };
}

export function evaluateRegularWorkerProductEvidenceAgainstContract(evidence = {}) {
  const flags = deriveRegularWorkerProductEvidenceFlags(evidence);
  const missingFlags = REGULAR_WORKER_PRODUCT_ALL_FLAGS.filter((flag) => flags[flag] !== true);
  const missingCoreFlags = REGULAR_WORKER_PRODUCT_CORE_FLAGS.filter((flag) => flags[flag] !== true);
  const missingEnrichmentFlags = REGULAR_WORKER_PRODUCT_ENRICHMENT_FLAGS.filter((flag) => flags[flag] !== true);
  const structured = evaluateRegularWorkerStructuredEvidence(evidence);
  return {
    complete: missingFlags.length === 0,
    coreComplete: missingCoreFlags.length === 0,
    structuredComplete: structured.complete,
    enrichedComplete: structured.enrichedComplete,
    missingFlags,
    missingCoreFlags,
    missingEnrichmentFlags,
    structuredFailedReasons: structured.failedReasons,
    stageResults: REGULAR_WORKER_PRODUCT_PIPELINE_STAGES.map((stage) => ({ stage, flag: REGULAR_WORKER_PRODUCT_EVIDENCE_FLAGS[stage], passed: flags[REGULAR_WORKER_PRODUCT_EVIDENCE_FLAGS[stage]] === true })),
  };
}
