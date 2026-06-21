import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { sanitizeEvidence } from './proof-utils.mjs';
import {
  blockReasons,
  isTruthy,
  readJsonFile,
  requirement,
  statusFromRequirements,
} from './real-icloud-proof-evidence-utils.mjs';
import {
  buildRegularWorkerProductEvidenceFromResolvedInput,
  evaluateRegularWorkerStructuredEvidence,
  resolveWorkerInputFromDownloadManifest,
} from './regular-worker-product-evidence-lib.mjs';
import {
  validateNormalizedGeocodeAddressArtifact,
} from './real-geocode-provider-adapter-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

export const REAL_GPS_GEOCODE_PRODUCT_BRIDGE_SCHEMA_VERSION = 1;
export const REAL_GPS_GEOCODE_PRODUCT_BRIDGE_ACCEPTED_GPS_SOURCE_LEVELS = Object.freeze([
  'real_media_exif',
  'readiness_approved_gps',
  'operator_confirmed_media_gps',
  'provider_coordinate_fixture',
]);
export const REAL_GPS_GEOCODE_PRODUCT_BRIDGE_ACCEPTED_SOURCE_KINDS = Object.freeze([
  'real_download_manifest',
  'readiness_approved_manifest',
]);

function toPortablePath(path) {
  return path.split(sep).join('/');
}

function repoRelative(path) {
  const rel = relative(repoRoot, path);
  return rel && !rel.startsWith('..') ? toPortablePath(rel) : path;
}

function safeHash(value) {
  return `sha256:${createHash('sha256').update(String(value ?? '')).digest('hex')}`;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundedCoordinate(value) {
  const number = finiteNumber(value);
  return number === null ? null : Number(number.toFixed(5));
}

function coordinateMatches(a, b, tolerance = 0.0002) {
  const aNumber = finiteNumber(a);
  const bNumber = finiteNumber(b);
  if (aNumber === null || bNumber === null) return false;
  return Math.abs(aNumber - bNumber) <= tolerance;
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function readMediaGpsFromItem(item = {}) {
  const gps = item.gps_evidence ?? item.gps ?? item.location ?? item.exif_gps ?? null;
  if (!gps || typeof gps !== 'object') return null;
  const latitude = finiteNumber(gps.latitude ?? gps.lat);
  const longitude = finiteNumber(gps.longitude ?? gps.lon ?? gps.lng);
  if (latitude === null || longitude === null) return null;
  return {
    latitude,
    longitude,
    source_level: firstString(gps.source_level, gps.sourceLevel, item.gps_source_level) ?? 'readiness_approved_gps',
    coordinate_precision: firstString(gps.coordinate_precision, gps.precision) ?? 'redacted_media_metadata',
    captured_from: firstString(gps.captured_from, gps.source) ?? 'manifest_item',
  };
}

function selectedMatchesItem(selected, item) {
  if (!selected || !item) return false;
  return Boolean(
    (selected.file_sha256 && selected.file_sha256 === item.file_sha256)
    || (selected.safe_source_id_hash && selected.safe_source_id_hash === item.safe_source_id_hash)
    || (selected.safe_filename && selected.safe_filename === item.safe_filename)
  );
}

function findManifestItemForSelectedMedia(manifest, selectedMedia) {
  const batches = Array.isArray(manifest?.batches) ? manifest.batches : [];
  for (const batch of batches) {
    for (const item of Array.isArray(batch?.items) ? batch.items : []) {
      if (selectedMatchesItem(selectedMedia, item)) return { batch, item };
    }
  }
  return { batch: null, item: null };
}

export function validateMediaGpsEvidence(evidence = {}) {
  const errors = [];
  if (evidence?.schema_version !== REAL_GPS_GEOCODE_PRODUCT_BRIDGE_SCHEMA_VERSION) errors.push('schema_version must be 1');
  if (!['real_gps_media_source', 'readiness_approved_media_gps'].includes(evidence?.evidence_kind)) errors.push('evidence_kind must be real_gps_media_source or readiness_approved_media_gps');
  const sourceKind = evidence?.source_kind ?? evidence?.input?.source_kind;
  if (!REAL_GPS_GEOCODE_PRODUCT_BRIDGE_ACCEPTED_SOURCE_KINDS.includes(sourceKind)) errors.push(`source_kind must be one of: ${REAL_GPS_GEOCODE_PRODUCT_BRIDGE_ACCEPTED_SOURCE_KINDS.join(', ')}`);
  const gps = evidence?.gps ?? evidence?.coordinate;
  if (!Number.isFinite(Number(gps?.latitude))) errors.push('gps.latitude must be finite');
  if (!Number.isFinite(Number(gps?.longitude))) errors.push('gps.longitude must be finite');
  const sourceLevel = gps?.source_level ?? evidence?.source_level;
  if (!REAL_GPS_GEOCODE_PRODUCT_BRIDGE_ACCEPTED_GPS_SOURCE_LEVELS.includes(sourceLevel)) errors.push(`gps.source_level must be one of: ${REAL_GPS_GEOCODE_PRODUCT_BRIDGE_ACCEPTED_GPS_SOURCE_LEVELS.join(', ')}`);
  if (evidence?.redaction?.private_paths_redacted !== true) errors.push('redaction.private_paths_redacted must be true');
  if (evidence?.redaction?.secrets_redacted !== true) errors.push('redaction.secrets_redacted must be true');
  if (evidence?.redaction?.raw_media_included !== false) errors.push('redaction.raw_media_included must be false');
  return { status: errors.length ? 'FAILED' : 'PASSED', errors };
}

export function resolveRealGpsSourceEvidence({ manifest = null, mediaEvidence = null, sourceKind = 'readiness_approved_manifest' } = {}) {
  const errors = [];
  if (mediaEvidence) {
    const validation = validateMediaGpsEvidence(mediaEvidence);
    if (validation.status !== 'PASSED') errors.push(...validation.errors);
    const gps = mediaEvidence.gps ?? mediaEvidence.coordinate ?? {};
    return {
      status: errors.length ? 'FAILED' : 'PASSED',
      errors: [...new Set(errors)],
      source_kind: mediaEvidence.source_kind ?? mediaEvidence.input?.source_kind ?? sourceKind,
      source_level: gps.source_level ?? mediaEvidence.source_level ?? null,
      gps: {
        latitude: finiteNumber(gps.latitude),
        longitude: finiteNumber(gps.longitude),
        source_level: gps.source_level ?? mediaEvidence.source_level ?? null,
        coordinate_precision: gps.coordinate_precision ?? 'redacted_media_metadata',
      },
      media: mediaEvidence.media ?? mediaEvidence.selected_media ?? null,
      redaction: mediaEvidence.redaction ?? null,
      source: 'media_evidence_file',
    };
  }

  if (!manifest) {
    return {
      status: 'FAILED',
      errors: ['No media GPS evidence file or download/readiness manifest was supplied.'],
      source_kind: sourceKind,
      source_level: null,
      gps: null,
      media: null,
      redaction: null,
      source: 'none',
    };
  }

  const resolvedInput = resolveWorkerInputFromDownloadManifest(manifest, { sourceKind });
  errors.push(...resolvedInput.errors);
  const selected = resolvedInput.selected_media;
  const { item } = findManifestItemForSelectedMedia(manifest, selected);
  const gps = readMediaGpsFromItem(item);
  if (!gps) errors.push('Selected manifest media item does not include accepted GPS evidence.');
  if (gps && !REAL_GPS_GEOCODE_PRODUCT_BRIDGE_ACCEPTED_GPS_SOURCE_LEVELS.includes(gps.source_level)) errors.push(`manifest GPS source_level must be one of: ${REAL_GPS_GEOCODE_PRODUCT_BRIDGE_ACCEPTED_GPS_SOURCE_LEVELS.join(', ')}`);
  return {
    status: errors.length ? 'FAILED' : 'PASSED',
    errors: [...new Set(errors)],
    source_kind: sourceKind,
    source_level: gps?.source_level ?? null,
    gps,
    media: selected,
    resolved_input: resolvedInput,
    redaction: {
      private_paths_redacted: true,
      secrets_redacted: true,
      raw_media_included: false,
    },
    source: 'download_or_readiness_manifest',
  };
}

export function validateAddressMatchesGps(addressArtifact, gpsEvidence) {
  const validation = validateNormalizedGeocodeAddressArtifact(addressArtifact);
  const errors = [...validation.errors];
  const coordinate = addressArtifact?.coordinate ?? {};
  if (!coordinateMatches(coordinate.latitude, gpsEvidence?.gps?.latitude)) errors.push('address coordinate latitude does not match GPS evidence within tolerance');
  if (!coordinateMatches(coordinate.longitude, gpsEvidence?.gps?.longitude)) errors.push('address coordinate longitude does not match GPS evidence within tolerance');
  if (addressArtifact?.safety?.raw_provider_payload_included !== false) errors.push('address artifact must not include raw provider payload');
  if (addressArtifact?.safety?.provider_secrets_included !== false) errors.push('address artifact must not include provider secrets');
  return { status: errors.length ? 'FAILED' : 'PASSED', errors };
}

export function buildRegularWorkerProductEvidenceWithGpsGeocode({ resolvedInput, gpsEvidence, addressArtifact, workerRunId = null, productWorkClaimed = false, now = new Date().toISOString() } = {}) {
  const baseEvidence = buildRegularWorkerProductEvidenceFromResolvedInput({
    resolvedInput,
    workerRunId,
    productWorkClaimed,
    now,
  });
  const gps = gpsEvidence?.gps ?? {};
  const address = addressArtifact?.address ?? {};
  const overlayReady = addressArtifact?.overlay_ready ?? {};
  return {
    ...baseEvidence,
    gps_extraction_completed: true,
    geocode_completed: true,
    product_record: {
      ...baseEvidence.product_record,
      gps_status: 'present',
      geocode_status: 'present',
      overlay_status: 'ready',
      normalized_address_id: safeHash(JSON.stringify({ provider_id: addressArtifact?.provider_id, coordinate: addressArtifact?.coordinate, display_name: address.display_name })),
      gps_source_level: gps.source_level ?? null,
      geocode_provider_id: addressArtifact?.provider_id ?? null,
      address_display_name: address.display_name ?? null,
      address_primary_line: overlayReady.primary_line ?? address.display_name ?? null,
      address_secondary_line: overlayReady.secondary_line ?? address.country ?? null,
    },
    geocode_bridge: {
      schema_version: REAL_GPS_GEOCODE_PRODUCT_BRIDGE_SCHEMA_VERSION,
      bridge_kind: 'real_gps_geocode_product_bridge',
      gps_source: {
        source_kind: gpsEvidence?.source_kind ?? baseEvidence.input?.source_kind,
        source_level: gps.source_level ?? null,
        latitude: roundedCoordinate(gps.latitude),
        longitude: roundedCoordinate(gps.longitude),
        coordinate_precision: gps.coordinate_precision ?? null,
      },
      address_artifact: {
        provider_id: addressArtifact?.provider_id ?? null,
        source_level: addressArtifact?.source_level ?? null,
        cache_key: addressArtifact?.cache?.cache_key ?? null,
        display_name: address.display_name ?? null,
        overlay_primary_line: overlayReady.primary_line ?? null,
      },
      non_claims: {
        real_icloud_download_claimed: false,
        address_overlay_visibility_claimed: false,
        raw_provider_payload_included: false,
      },
    },
    redaction: {
      ...baseEvidence.redaction,
      private_paths_redacted: true,
      secrets_redacted: true,
      raw_media_included: false,
      raw_provider_output_included: false,
    },
    readiness: {
      ...baseEvidence.readiness,
      evidence_level: gps.source_level === 'real_media_exif' ? 'L4' : 'L3',
      pipeline_core_complete: true,
      pipeline_enriched_complete: true,
      regular_worker_product_pipeline_satisfied: true,
      real_gps_geocode_bridge_satisfied: true,
      address_overlay_visibility_satisfied: false,
      v1_gate_satisfied: true,
    },
    required_proof_boundary: 'Evidence bridges accepted media GPS and normalized geocode address into product evidence; it does not prove real iCloud download or device overlay visibility.',
  };
}

export function evaluateRealGpsGeocodeProductBridge(env = process.env, opts = {}) {
  const manifestPath = env.PF_REAL_GPS_GEOCODE_MANIFEST_FILE
    ?? env.PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE
    ?? env.PF_WORKER_REAL_DOWNLOAD_BRIDGE_MANIFEST_FILE
    ?? env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE;
  const mediaEvidencePath = env.PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE;
  const addressEvidencePath = env.PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE
    ?? env.PF_NORMALIZED_REAL_GEOCODE_ADDRESS_FILE;
  const sourceKind = opts.sourceKind ?? env.PF_REAL_GPS_GEOCODE_SOURCE_KIND ?? env.PF_WORKER_INPUT_SOURCE_KIND ?? 'readiness_approved_manifest';
  const productWorkClaimed = isTruthy(env.PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED);
  const cwd = opts.cwd ?? process.cwd();
  const manifest = readJsonFile(manifestPath, { cwd });
  const mediaEvidence = readJsonFile(mediaEvidencePath, { cwd });
  const addressEvidence = readJsonFile(addressEvidencePath, { cwd });
  const gpsEvidence = resolveRealGpsSourceEvidence({
    manifest: mediaEvidence.value ? null : manifest.value,
    mediaEvidence: mediaEvidence.value,
    sourceKind,
  });
  const resolvedInput = gpsEvidence.resolved_input ?? (manifest.value ? resolveWorkerInputFromDownloadManifest(manifest.value, { sourceKind }) : null);
  const addressValidation = addressEvidence.value ? validateAddressMatchesGps(addressEvidence.value, gpsEvidence) : null;
  const productEvidence = resolvedInput && gpsEvidence.status === 'PASSED' && addressValidation?.status === 'PASSED'
    ? buildRegularWorkerProductEvidenceWithGpsGeocode({
      resolvedInput,
      gpsEvidence,
      addressArtifact: addressEvidence.value,
      workerRunId: env.PF_REGULAR_WORKER_PRODUCT_RUN_ID ?? env.PF_REAL_GPS_GEOCODE_PRODUCT_BRIDGE_RUN_ID ?? null,
      productWorkClaimed,
      now: opts.now ?? new Date().toISOString(),
    })
    : null;
  const structuredEvaluation = productEvidence ? evaluateRegularWorkerStructuredEvidence(productEvidence) : null;
  const requirements = [
    requirement('real_gps_geocode_product_bridge_opt_in', isTruthy(env.PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE), 'Set PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE=true.'),
    requirement('product_work_confirmed', productWorkClaimed, 'Set PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED=true only after regular_stage_worker product output was prepared or readiness-approved bridge evidence is intended.'),
    requirement('address_evidence_configured', Boolean(addressEvidencePath), 'Set PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE or PF_NORMALIZED_REAL_GEOCODE_ADDRESS_FILE.'),
    requirement('gps_source_configured', Boolean(mediaEvidencePath || manifestPath), 'Set PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE or a manifest path with GPS evidence.'),
  ];
  if (manifestPath) requirements.push(requirement('manifest_parsed', Boolean(manifest.value), manifest.reason));
  if (mediaEvidencePath) requirements.push(requirement('media_gps_evidence_parsed', Boolean(mediaEvidence.value), mediaEvidence.reason));
  if (addressEvidencePath) requirements.push(requirement('address_evidence_parsed', Boolean(addressEvidence.value), addressEvidence.reason));
  if (gpsEvidence) requirements.push(requirement('accepted_gps_source_resolved', gpsEvidence.status === 'PASSED', gpsEvidence.errors.join('; ') || 'Accepted GPS source resolved.'));
  if (addressValidation) requirements.push(requirement('normalized_address_matches_gps', addressValidation.status === 'PASSED', addressValidation.errors.join('; ') || 'Normalized address artifact matches accepted GPS evidence.'));
  if (structuredEvaluation) requirements.push(requirement('product_evidence_enriched_complete', structuredEvaluation.enrichedComplete, structuredEvaluation.failedReasons.join('; ') || structuredEvaluation.missingEnrichmentFlags.join(', ') || 'Product evidence is enriched-complete.'));
  return {
    proofStatus: statusFromRequirements(requirements),
    requirements,
    manifest_path: manifestPath ?? null,
    media_evidence_path: mediaEvidencePath ?? null,
    address_evidence_path: addressEvidencePath ?? null,
    source_kind: sourceKind,
    gps_evidence: gpsEvidence,
    address_validation: addressValidation,
    resolved_input: resolvedInput,
    product_pipeline_evidence: productEvidence,
    structured_evaluation: structuredEvaluation,
    block_reasons: blockReasons(requirements),
    non_claims: [
      'does not prove iCloud authentication or real download by itself',
      'does not prove address overlay device visibility',
      'does not include raw media or raw provider payload',
    ],
  };
}

export function getRealGpsGeocodeProductBridgeOutputPaths({ outputDirectory = join(repoRoot, 'runtime_data', 'operator_evidence', 'real_gps_geocode_product_bridge') } = {}) {
  return {
    outputDirectory,
    latestEvidencePath: join(outputDirectory, 'latest.json'),
    latestEnvPath: join(outputDirectory, 'latest.env'),
  };
}

export async function writeRealGpsGeocodeProductBridgeEvidence(evidence, { outputDirectory = join(repoRoot, 'runtime_data', 'operator_evidence', 'real_gps_geocode_product_bridge'), updateLatest = true } = {}) {
  const safeEvidence = sanitizeEvidence(evidence);
  const timestamp = String(safeEvidence.observed_at ?? new Date().toISOString()).replace(/[:.]/g, '-');
  const outputPath = join(outputDirectory, `real_gps_geocode_product_evidence_${timestamp}.json`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(safeEvidence, null, 2)}\n`, 'utf8');
  const paths = getRealGpsGeocodeProductBridgeOutputPaths({ outputDirectory });
  if (updateLatest) {
    await writeFile(paths.latestEvidencePath, `${JSON.stringify(safeEvidence, null, 2)}\n`, 'utf8');
    const envLines = [
      `PF_REAL_GPS_GEOCODE_PRODUCT_EVIDENCE_FILE=${repoRelative(paths.latestEvidencePath)}`,
      `PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE=${repoRelative(paths.latestEvidencePath)}`,
    ];
    await writeFile(paths.latestEnvPath, `${envLines.join('\n')}\n`, 'utf8');
  }
  return {
    outputPath,
    latestEvidencePath: paths.latestEvidencePath,
    latestEnvPath: paths.latestEnvPath,
    envLine: `PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE=${repoRelative(paths.latestEvidencePath)}`,
  };
}
