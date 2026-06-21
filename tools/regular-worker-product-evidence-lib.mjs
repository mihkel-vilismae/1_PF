import { createHash } from 'node:crypto';
import { validateDownloadManifestSafeSchema } from './download-manifest-safe-schema-lib.mjs';
import { hasSecretLikeText } from './real-icloud-proof-evidence-utils.mjs';

export const REGULAR_WORKER_PRODUCT_EVIDENCE_SCHEMA_VERSION = 2;

export const REGULAR_WORKER_PRODUCT_CORE_FLAGS = Object.freeze([
  'media_source_observed',
  'download_or_import_completed',
  'index_completed',
  'queue_prepared',
  'worker_status_product_work_claimed',
]);

export const REGULAR_WORKER_PRODUCT_ENRICHMENT_FLAGS = Object.freeze([
  'gps_extraction_completed',
  'geocode_completed',
]);

export const REGULAR_WORKER_PRODUCT_ALL_FLAGS = Object.freeze([
  ...REGULAR_WORKER_PRODUCT_CORE_FLAGS.slice(0, 3),
  ...REGULAR_WORKER_PRODUCT_ENRICHMENT_FLAGS,
  'queue_prepared',
  'worker_status_product_work_claimed',
]);

export const REGULAR_WORKER_PRODUCT_ACCEPTED_SOURCE_KINDS = Object.freeze([
  'real_download_manifest',
  'readiness_approved_manifest',
]);

export const REGULAR_WORKER_PRODUCT_DISPLAYABLE_EXTENSIONS = Object.freeze(new Set([
  '.jpg', '.jpeg', '.png', '.heic', '.webp', '.mp4', '.mov', '.m4v', '.avi', '.mkv',
]));

function safeHash(value) {
  return `sha256:${createHash('sha256').update(String(value ?? '')).digest('hex')}`;
}

function bool(value) {
  return value === true;
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function normalizeExtension(value) {
  const ext = String(value ?? '').trim().toLowerCase();
  return ext.startsWith('.') ? ext : ext ? `.${ext}` : '';
}

export function buildRegularWorkerProductEvidenceTemplateV2({ now = new Date().toISOString() } = {}) {
  return {
    evidence_schema_version: REGULAR_WORKER_PRODUCT_EVIDENCE_SCHEMA_VERSION,
    evidence_kind: 'regular_worker_product_pipeline',
    source_kind: 'unset',
    staged_write_mode: true,
    production_mutation_claimed: false,
    media_source_observed: false,
    download_or_import_completed: false,
    index_completed: false,
    gps_extraction_completed: false,
    geocode_completed: false,
    queue_prepared: false,
    worker_status_product_work_claimed: false,
    worker: {
      mode: 'regular',
      entrypoint: 'regular_stage_worker',
      run_id: null,
    },
    input: {
      source_kind: 'unset',
      manifest_id: null,
      manifest_schema_version: null,
      items_seen: 0,
      items_eligible: 0,
      private_paths_redacted: true,
    },
    selected_media: {
      media_id: null,
      media_type: null,
      source_provenance: 'unset',
      selection_reason: null,
    },
    product_record: {
      created: false,
      record_id: null,
      has_media_asset: false,
      has_display_asset: false,
      gps_status: 'blocked',
      geocode_status: 'blocked',
      overlay_status: 'blocked',
    },
    output: {
      display_queue_written: false,
      next_display_item_ready: false,
      output_artifact_id: null,
    },
    redaction: {
      private_paths_redacted: true,
      secrets_redacted: true,
      raw_media_included: false,
      raw_provider_output_included: false,
    },
    readiness: {
      evidence_level: 'L0',
      pipeline_core_complete: false,
      pipeline_enriched_complete: false,
      regular_worker_product_pipeline_satisfied: false,
      v1_gate_satisfied: false,
    },
    observed_at: now,
    operator_note: 'Set pass fields to true only after regular_stage_worker consumes real/readiness-approved input and prepares product output.',
    required_proof_boundary: 'Template or fixture evidence alone is not product proof; a passing proof needs regular worker mode plus accepted input->product->output evidence.',
  };
}

export function getRegularWorkerEvidenceSourceKind(evidence = {}) {
  return firstString(evidence.input?.source_kind, evidence.source_kind) ?? 'unset';
}

export function deriveRegularWorkerProductEvidenceFlags(evidence = {}) {
  const sourceKind = getRegularWorkerEvidenceSourceKind(evidence);
  const input = evidence.input ?? {};
  const productRecord = evidence.product_record ?? {};
  const output = evidence.output ?? {};
  const selectedMedia = evidence.selected_media ?? {};
  return {
    media_source_observed: bool(evidence.media_source_observed) || REGULAR_WORKER_PRODUCT_ACCEPTED_SOURCE_KINDS.includes(sourceKind),
    download_or_import_completed: bool(evidence.download_or_import_completed) || Number(input.items_seen ?? 0) > 0,
    index_completed: bool(evidence.index_completed) || Boolean(selectedMedia.media_id || selectedMedia.file_sha256 || productRecord.record_id),
    gps_extraction_completed: bool(evidence.gps_extraction_completed) || ['present', 'ok', 'completed'].includes(String(productRecord.gps_status ?? '').toLowerCase()),
    geocode_completed: bool(evidence.geocode_completed) || ['present', 'ok', 'completed'].includes(String(productRecord.geocode_status ?? '').toLowerCase()),
    queue_prepared: bool(evidence.queue_prepared) || bool(output.display_queue_written) || bool(output.next_display_item_ready),
    worker_status_product_work_claimed: bool(evidence.worker_status_product_work_claimed) || bool(evidence.worker?.product_work_claimed),
  };
}

export function normalizeRegularWorkerProductEvidence(evidence = {}) {
  const flags = deriveRegularWorkerProductEvidenceFlags(evidence);
  const sourceKind = getRegularWorkerEvidenceSourceKind(evidence);
  return {
    ...evidence,
    source_kind: sourceKind,
    ...flags,
    readiness: {
      ...(evidence.readiness ?? {}),
      pipeline_core_complete: REGULAR_WORKER_PRODUCT_CORE_FLAGS.every((flag) => flags[flag] === true),
      pipeline_enriched_complete: REGULAR_WORKER_PRODUCT_ALL_FLAGS.every((flag) => flags[flag] === true),
    },
  };
}

export function evaluateRegularWorkerStructuredEvidence(evidence = {}) {
  const normalized = normalizeRegularWorkerProductEvidence(evidence);
  const sourceKind = getRegularWorkerEvidenceSourceKind(normalized);
  const productRecord = normalized.product_record ?? {};
  const output = normalized.output ?? {};
  const input = normalized.input ?? {};
  const redaction = normalized.redaction ?? {};
  const missingCoreFlags = REGULAR_WORKER_PRODUCT_CORE_FLAGS.filter((flag) => normalized[flag] !== true);
  const missingEnrichmentFlags = REGULAR_WORKER_PRODUCT_ENRICHMENT_FLAGS.filter((flag) => normalized[flag] !== true);
  const failedReasons = [];

  if (!REGULAR_WORKER_PRODUCT_ACCEPTED_SOURCE_KINDS.includes(sourceKind)) failedReasons.push(`source_kind must be one of: ${REGULAR_WORKER_PRODUCT_ACCEPTED_SOURCE_KINDS.join(', ')}`);
  if (Number(input.items_seen ?? 0) <= 0) failedReasons.push('input.items_seen must be greater than zero');
  if (Number(input.items_eligible ?? 0) <= 0) failedReasons.push('input.items_eligible must be greater than zero');
  if (!normalized.selected_media?.media_id && !normalized.selected_media?.file_sha256) failedReasons.push('selected_media.media_id or file_sha256 is required');
  if (productRecord.created !== true) failedReasons.push('product_record.created must be true');
  if (productRecord.has_media_asset !== true) failedReasons.push('product_record.has_media_asset must be true');
  if (output.display_queue_written !== true) failedReasons.push('output.display_queue_written must be true');
  if (output.next_display_item_ready !== true) failedReasons.push('output.next_display_item_ready must be true');
  if (redaction.private_paths_redacted !== true || redaction.secrets_redacted !== true) failedReasons.push('redaction.private_paths_redacted and redaction.secrets_redacted must both be true');
  if (redaction.raw_media_included === true || redaction.raw_provider_output_included === true) failedReasons.push('raw media/provider output must not be included');
  if (hasSecretLikeText(normalized)) failedReasons.push('evidence contains secret-like text');

  return {
    complete: missingCoreFlags.length === 0 && failedReasons.length === 0,
    enrichedComplete: missingCoreFlags.length === 0 && missingEnrichmentFlags.length === 0 && failedReasons.length === 0,
    sourceKind,
    missingCoreFlags,
    missingEnrichmentFlags,
    failedReasons,
    normalized,
    stageResults: REGULAR_WORKER_PRODUCT_ALL_FLAGS.map((flag) => ({ flag, passed: normalized[flag] === true })),
  };
}

export function resolveWorkerInputFromDownloadManifest(manifest, { sourceKind = 'real_download_manifest', selectionReason = 'first_eligible' } = {}) {
  const validation = validateDownloadManifestSafeSchema(manifest);
  const errors = [...validation.errors];
  const candidates = [];
  const batches = Array.isArray(manifest?.batches) ? manifest.batches : [];
  for (const [batchIndex, batch] of batches.entries()) {
    for (const [itemIndex, item] of (Array.isArray(batch?.items) ? batch.items : []).entries()) {
      const extension = normalizeExtension(item?.extension);
      const eligible = REGULAR_WORKER_PRODUCT_DISPLAYABLE_EXTENSIONS.has(extension) && Number(item?.size_bytes ?? 0) > 0;
      candidates.push({
        batch_id: batch?.batch_id ?? `batch_${batchIndex}`,
        item_index: itemIndex,
        media_id: item?.file_sha256 ?? item?.safe_source_id_hash ?? safeHash(`${batchIndex}:${itemIndex}`),
        safe_source_id_hash: item?.safe_source_id_hash ?? null,
        file_sha256: item?.file_sha256 ?? null,
        safe_filename: item?.safe_filename ?? null,
        extension,
        media_type: ['.mp4', '.mov', '.m4v', '.avi', '.mkv'].includes(extension) ? 'video' : 'image',
        size_bytes: item?.size_bytes ?? null,
        downloaded_at: item?.downloaded_at ?? null,
        eligible,
      });
    }
  }
  if (validation.status !== 'PASSED') errors.push('manifest schema validation failed');
  if (!REGULAR_WORKER_PRODUCT_ACCEPTED_SOURCE_KINDS.includes(sourceKind)) errors.push(`sourceKind must be one of: ${REGULAR_WORKER_PRODUCT_ACCEPTED_SOURCE_KINDS.join(', ')}`);
  const eligibleCandidates = candidates.filter((candidate) => candidate.eligible);
  if (!eligibleCandidates.length) errors.push('manifest has no display-eligible media items');
  const selected = eligibleCandidates[0] ?? null;
  const manifestId = safeHash(JSON.stringify({ schema_version: manifest?.schema_version, filter_signature: manifest?.filter_signature, batches: batches.map((batch) => ({ batch_id: batch?.batch_id, downloaded_count: batch?.downloaded_count })) }));
  return {
    status: errors.length === 0 ? 'PASSED' : 'FAILED',
    errors: [...new Set(errors)],
    input: {
      source_kind: sourceKind,
      manifest_id: manifestId,
      manifest_schema_version: manifest?.schema_version ?? null,
      filter_signature: manifest?.filter_signature ?? null,
      items_seen: candidates.length,
      items_eligible: eligibleCandidates.length,
      private_paths_redacted: true,
    },
    candidates,
    selected_media: selected ? {
      media_id: selected.media_id,
      file_sha256: selected.file_sha256,
      safe_source_id_hash: selected.safe_source_id_hash,
      media_type: selected.media_type,
      source_provenance: sourceKind === 'real_download_manifest' ? 'real_download' : 'readiness_approved',
      selection_reason: selectionReason,
      safe_filename: selected.safe_filename,
      extension: selected.extension,
      size_bytes: selected.size_bytes,
      downloaded_at: selected.downloaded_at,
    } : null,
  };
}

export function buildRegularWorkerProductEvidenceFromResolvedInput({ resolvedInput, workerRunId = null, productWorkClaimed = false, now = new Date().toISOString() } = {}) {
  const selected = resolvedInput?.selected_media ?? null;
  const sourceKind = resolvedInput?.input?.source_kind ?? 'unset';
  const recordSeed = selected?.media_id ?? selected?.file_sha256 ?? JSON.stringify(resolvedInput?.input ?? {});
  const recordId = safeHash(`regular-worker-product:${recordSeed}`);
  const outputId = safeHash(`regular-worker-output:${recordSeed}`);
  const evidence = buildRegularWorkerProductEvidenceTemplateV2({ now });
  return normalizeRegularWorkerProductEvidence({
    ...evidence,
    source_kind: sourceKind,
    media_source_observed: resolvedInput?.status === 'PASSED',
    download_or_import_completed: resolvedInput?.status === 'PASSED',
    index_completed: Boolean(selected),
    gps_extraction_completed: false,
    geocode_completed: false,
    queue_prepared: Boolean(selected),
    worker_status_product_work_claimed: Boolean(productWorkClaimed),
    worker: {
      mode: 'regular',
      entrypoint: 'regular_stage_worker',
      run_id: workerRunId ?? safeHash(`regular-worker-run:${recordSeed}:${now}`),
      product_work_claimed: Boolean(productWorkClaimed),
    },
    input: resolvedInput?.input ?? evidence.input,
    selected_media: selected ?? evidence.selected_media,
    product_record: {
      created: Boolean(selected && productWorkClaimed),
      record_id: selected && productWorkClaimed ? recordId : null,
      has_media_asset: Boolean(selected && productWorkClaimed),
      has_display_asset: Boolean(selected && productWorkClaimed),
      gps_status: 'blocked',
      geocode_status: 'blocked',
      overlay_status: selected && productWorkClaimed ? 'partial' : 'blocked',
    },
    output: {
      display_queue_written: Boolean(selected && productWorkClaimed),
      next_display_item_ready: Boolean(selected && productWorkClaimed),
      output_artifact_id: selected && productWorkClaimed ? outputId : null,
    },
    redaction: {
      private_paths_redacted: true,
      secrets_redacted: true,
      raw_media_included: false,
      raw_provider_output_included: false,
    },
    readiness: {
      evidence_level: sourceKind === 'real_download_manifest' ? 'L3' : 'L2',
      pipeline_core_complete: Boolean(selected && productWorkClaimed),
      pipeline_enriched_complete: false,
      regular_worker_product_pipeline_satisfied: Boolean(selected && productWorkClaimed),
      v1_gate_satisfied: Boolean(selected && productWorkClaimed),
    },
    observed_at: now,
    required_proof_boundary: 'Evidence is derived from a safe download/readiness manifest and an explicit regular worker product-work claim; it does not prove geocode or device overlay visibility.',
  });
}
