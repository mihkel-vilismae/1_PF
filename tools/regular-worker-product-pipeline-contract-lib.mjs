/** Contract helpers for the regular_stage_worker product pipeline evidence. */
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
    stages: REGULAR_WORKER_PRODUCT_PIPELINE_STAGES.map((stage, index) => ({ stage, order: index + 1, evidenceFlag: REGULAR_WORKER_PRODUCT_EVIDENCE_FLAGS[stage] })),
    finalEvidenceFlag: 'worker_status_product_work_claimed',
    nonClaims: ['contract is not a runtime product proof', 'contract does not prove iCloud access', 'contract does not mutate database rows'],
  };
}

export function evaluateRegularWorkerProductEvidenceAgainstContract(evidence = {}) {
  const missingFlags = Object.values(REGULAR_WORKER_PRODUCT_EVIDENCE_FLAGS).filter((flag) => evidence[flag] !== true);
  if (evidence.worker_status_product_work_claimed !== true) missingFlags.push('worker_status_product_work_claimed');
  return {
    complete: missingFlags.length === 0,
    missingFlags,
    stageResults: REGULAR_WORKER_PRODUCT_PIPELINE_STAGES.map((stage) => ({ stage, flag: REGULAR_WORKER_PRODUCT_EVIDENCE_FLAGS[stage], passed: evidence[REGULAR_WORKER_PRODUCT_EVIDENCE_FLAGS[stage]] === true })),
  };
}
