/**
 * Builds safe GPS/geocode bridge templates and operator handoff variables.
 * Points to worker runtime status without generating product confirmation.
 * Keeps missing evidence BLOCKED while still exporting diagnostics.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { sanitizeEvidence } from './proof-utils.mjs';
import {
  blockReasons,
  isTruthy,
  readJsonFile,
  requirement,
  statusFromRequirements,
} from './real-icloud-proof-evidence-utils.mjs';
import {
  resolveRealGpsSourceEvidence,
  validateAddressMatchesGps,
  validateMediaGpsEvidence,
} from './real-gps-geocode-product-bridge-lib.mjs';
import { resolveWorkerInputFromDownloadManifest } from './regular-worker-product-evidence-lib.mjs';
import { validateNormalizedGeocodeAddressArtifact } from './real-geocode-provider-adapter-lib.mjs';
import { evaluateRegularWorkerRuntimeProductEvidence, resolveRegularWorkerRuntimeStatusPath } from './regular-worker-runtime-evidence-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

export const REAL_GPS_GEOCODE_PRODUCT_BRIDGE_EVIDENCE_PACK_VERSION = 1;

function toPortablePath(path) { return path.split(sep).join('/'); }
function repoRelative(path) {
  const rel = relative(repoRoot, path);
  return rel && !rel.startsWith('..') ? toPortablePath(rel) : path;
}
function finiteOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function firstExistingPath(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function buildMediaGpsEvidenceTemplate({ latitude = 59.437, longitude = 24.7536, sourceKind = 'readiness_approved_manifest', sourceLevel = 'readiness_approved_gps', now = new Date().toISOString() } = {}) {
  return {
    schema_version: 1,
    evidence_kind: sourceLevel === 'real_media_exif' ? 'real_gps_media_source' : 'readiness_approved_media_gps',
    source_kind: sourceKind,
    media: {
      media_id: 'REPLACE_WITH_SAFE_MEDIA_ID_OR_SHA256',
      media_type: 'image',
      source_provenance: sourceKind === 'real_download_manifest' ? 'real_download' : 'readiness_approved',
    },
    gps: {
      latitude: finiteOrDefault(latitude, 59.437),
      longitude: finiteOrDefault(longitude, 24.7536),
      source_level: sourceLevel,
      coordinate_precision: 'redacted_media_metadata',
    },
    redaction: {
      private_paths_redacted: true,
      secrets_redacted: true,
      raw_media_included: false,
    },
    observed_at: now,
    operator_note: 'Replace placeholder media id with safe id/hash. Do not include private paths or raw media.',
  };
}

export function buildNormalizedGeocodeAddressTemplate({ latitude = 59.437, longitude = 24.7536, providerId = 'nominatim_osm', addressText = 'REPLACE_WITH_HUMAN_READABLE_ADDRESS', now = new Date().toISOString() } = {}) {
  return {
    schema_version: 1,
    artifact_kind: 'normalized_real_geocode_address',
    provider_id: providerId,
    source_level: 'readiness_approved_gps',
    coordinate: {
      latitude: finiteOrDefault(latitude, 59.437),
      longitude: finiteOrDefault(longitude, 24.7536),
      language_code: 'en',
      precision: 'redacted_media_metadata',
    },
    cache: {
      cache_key: 'REPLACE_WITH_CACHE_KEY_OR_ACCEPTED_SAFE_ID',
      cache_first_verified: false,
      cache_inserted: false,
    },
    address: {
      display_name: addressText,
      country: null,
      country_code: null,
      city: null,
      county: null,
      state: null,
      postcode: null,
      road: null,
    },
    overlay_ready: {
      primary_line: addressText,
      secondary_line: providerId,
    },
    safety: {
      raw_provider_payload_included: false,
      provider_secrets_included: false,
      private_paths_included: false,
    },
    observed_at: now,
    operator_note: 'Replace display address/cache key with accepted normalized geocode output. Do not include raw provider payload or secrets.',
  };
}

/** Builds bridge environment lines without a manual product-work assertion. */
export function buildBridgeEnvLines({ mediaEvidencePath, manifestPath, addressEvidencePath, workerRuntimeStatusPath, sourceKind = 'readiness_approved_manifest' } = {}) {
  const lines = [
    'PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE=true',
    `PF_REAL_GPS_GEOCODE_SOURCE_KIND=${sourceKind}`,
  ];
  if (workerRuntimeStatusPath) lines.push(`PF_REGULAR_WORKER_RUNTIME_STATUS_FILE=${repoRelative(workerRuntimeStatusPath)}`);
  if (mediaEvidencePath) lines.push(`PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE=${repoRelative(mediaEvidencePath)}`);
  if (manifestPath) lines.push(`PF_REAL_GPS_GEOCODE_MANIFEST_FILE=${repoRelative(manifestPath)}`);
  if (addressEvidencePath) {
    lines.push(`PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE=${repoRelative(addressEvidencePath)}`);
    lines.push(`PF_NORMALIZED_REAL_GEOCODE_ADDRESS_FILE=${repoRelative(addressEvidencePath)}`);
  }
  return lines;
}

/** Validates pack inputs and worker runtime evidence before claiming readiness. */
export function evaluateRealGpsGeocodeProductBridgeEvidencePack(env = process.env, opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const sourceKind = opts.sourceKind ?? env.PF_REAL_GPS_GEOCODE_SOURCE_KIND ?? env.PF_WORKER_INPUT_SOURCE_KIND ?? 'readiness_approved_manifest';
  const manifestPath = firstExistingPath(env.PF_REAL_GPS_GEOCODE_MANIFEST_FILE, env.PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE, env.PF_WORKER_REAL_DOWNLOAD_BRIDGE_MANIFEST_FILE, env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE);
  const mediaEvidencePath = firstExistingPath(env.PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE);
  const addressEvidencePath = firstExistingPath(env.PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE, env.PF_NORMALIZED_REAL_GEOCODE_ADDRESS_FILE);
  const workerRuntimeStatusPath = resolveRegularWorkerRuntimeStatusPath(env, { cwd });
  const workerRuntimeEvidence = evaluateRegularWorkerRuntimeProductEvidence(env, { cwd });
  const manifest = readJsonFile(manifestPath, { cwd });
  const mediaEvidence = readJsonFile(mediaEvidencePath, { cwd });
  const addressEvidence = readJsonFile(addressEvidencePath, { cwd });
  const gpsEvidence = resolveRealGpsSourceEvidence({ manifest: mediaEvidence.value ? null : manifest.value, mediaEvidence: mediaEvidence.value, sourceKind });
  const resolvedInput = gpsEvidence.resolved_input ?? (manifest.value ? resolveWorkerInputFromDownloadManifest(manifest.value, { sourceKind }) : null);
  const mediaValidation = mediaEvidence.value ? validateMediaGpsEvidence(mediaEvidence.value) : null;
  const addressValidation = addressEvidence.value ? validateNormalizedGeocodeAddressArtifact(addressEvidence.value) : null;
  const addressGpsValidation = addressEvidence.value && gpsEvidence.status === 'PASSED' ? validateAddressMatchesGps(addressEvidence.value, gpsEvidence) : null;

  const missing = [];
  if (!manifestPath && !mediaEvidencePath) missing.push('PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE or PF_REAL_GPS_GEOCODE_MANIFEST_FILE');
  if (!addressEvidencePath) missing.push('PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE or PF_NORMALIZED_REAL_GEOCODE_ADDRESS_FILE');
  if (!isTruthy(env.PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE)) missing.push('PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE=true');
  if (!workerRuntimeEvidence.confirmed) missing.push('product-capable regular_stage_worker runtime evidence');

  const requirements = [
    requirement('bridge_evidence_pack_opt_in', isTruthy(env.PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE_EVIDENCE_PACK) || isTruthy(env.PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE), 'Set PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE_EVIDENCE_PACK=true or PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE=true.'),
    requirement('gps_source_path_configured', Boolean(manifestPath || mediaEvidencePath), 'Set PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE or PF_REAL_GPS_GEOCODE_MANIFEST_FILE.'),
    requirement('address_evidence_path_configured', Boolean(addressEvidencePath), 'Set PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE or PF_NORMALIZED_REAL_GEOCODE_ADDRESS_FILE.'),
    requirement('bridge_opt_in_ready_for_latest_env', true, 'latest.env will include PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE=true.'),
    requirement('worker_runtime_status_ready_for_latest_env', true, 'latest.env will point to PF_REGULAR_WORKER_RUNTIME_STATUS_FILE; product-work confirmation is derived from that runtime evidence.'),
    requirement('worker_runtime_product_work_confirmed', workerRuntimeEvidence.confirmed, workerRuntimeEvidence.reasons.join('; ') || 'regular_stage_worker runtime evidence confirms product work.'),
  ];
  if (manifestPath) requirements.push(requirement('manifest_parsed', Boolean(manifest.value), manifest.reason));
  if (mediaEvidencePath) requirements.push(requirement('media_gps_evidence_parsed', Boolean(mediaEvidence.value), mediaEvidence.reason));
  if (mediaValidation) requirements.push(requirement('media_gps_evidence_valid', mediaValidation.status === 'PASSED', mediaValidation.errors.join('; ') || 'Media GPS evidence is valid.'));
  if (addressEvidencePath) requirements.push(requirement('address_evidence_parsed', Boolean(addressEvidence.value), addressEvidence.reason));
  if (addressValidation) requirements.push(requirement('normalized_address_template_or_evidence_valid', addressValidation.status === 'PASSED', addressValidation.errors.join('; ') || 'Normalized address evidence has required safe shape.'));
  if (gpsEvidence) requirements.push(requirement('accepted_gps_source_resolved', gpsEvidence.status === 'PASSED', gpsEvidence.errors.join('; ') || 'Accepted GPS source resolved.'));
  if (addressGpsValidation) requirements.push(requirement('normalized_address_coordinate_matches_gps', addressGpsValidation.status === 'PASSED', addressGpsValidation.errors.join('; ') || 'Normalized address coordinate matches accepted GPS source.'));

  const proofStatus = statusFromRequirements(requirements);
  return {
    proofStatus,
    requirements,
    source_kind: sourceKind,
    configured_paths: {
      manifest_path: manifestPath ?? null,
      media_evidence_path: mediaEvidencePath ?? null,
      address_evidence_path: addressEvidencePath ?? null,
      worker_runtime_status_path: workerRuntimeStatusPath,
    },
    parsed: {
      manifest: Boolean(manifest.value),
      media_evidence: Boolean(mediaEvidence.value),
      address_evidence: Boolean(addressEvidence.value),
    },
    gps_evidence: gpsEvidence,
    resolved_input: resolvedInput,
    media_validation: mediaValidation,
    address_validation: addressValidation,
    address_gps_validation: addressGpsValidation,
    worker_runtime_evidence: workerRuntimeEvidence,
    missing_for_bridge: missing,
    block_reasons: blockReasons(requirements),
    next_steps: buildEvidencePackNextSteps({ missing, mediaEvidencePath, manifestPath, addressEvidencePath }),
    non_claims: [
      'does not prove iCloud authentication',
      'does not prove real iCloud download unless a separate proof supplies that evidence',
      'does not prove native playback',
      'does not prove address overlay device visibility',
    ],
  };
}

export function buildEvidencePackNextSteps({ missing = [], mediaEvidencePath = null, manifestPath = null, addressEvidencePath = null } = {}) {
  const steps = [];
  if (missing.length) steps.push(`Fill or provide missing bridge inputs: ${missing.join(', ')}.`);
  if (!mediaEvidencePath && !manifestPath) steps.push('Edit media_gps_evidence_template.json or provide a redacted manifest with gps_evidence on the selected media item.');
  if (!addressEvidencePath) steps.push('Edit normalized_geocode_address_template.json or provide a normalized_real_geocode_address artifact from provider/cache proof.');
  steps.push('Review latest.env, then source/dot-source it before running proof:real-gps-geocode-product-bridge.');
  steps.push('Do not add private paths, raw media, raw provider payload, credentials, cookies, or tokens to these files.');
  return steps;
}

export function getRealGpsGeocodeEvidencePackOutputPaths({ outputDirectory = join(repoRoot, 'runtime_data', 'operator_evidence', 'real_gps_geocode_product_bridge_evidence_pack') } = {}) {
  return {
    outputDirectory,
    mediaGpsTemplatePath: join(outputDirectory, 'media_gps_evidence_template.json'),
    normalizedAddressTemplatePath: join(outputDirectory, 'normalized_geocode_address_template.json'),
    latestEnvPath: join(outputDirectory, 'latest.env'),
    latestReportPath: join(outputDirectory, 'latest_report.json'),
    nextStepsPath: join(outputDirectory, 'NEXT_STEPS.txt'),
  };
}

/** Writes sanitized templates, runtime-status handoff, report, and next steps. */
export async function writeRealGpsGeocodeEvidencePack(result, { outputDirectory = join(repoRoot, 'runtime_data', 'operator_evidence', 'real_gps_geocode_product_bridge_evidence_pack'), now = new Date().toISOString() } = {}) {
  const paths = getRealGpsGeocodeEvidencePackOutputPaths({ outputDirectory });
  await mkdir(paths.outputDirectory, { recursive: true });
  const latitude = result?.gps_evidence?.gps?.latitude ?? 59.437;
  const longitude = result?.gps_evidence?.gps?.longitude ?? 24.7536;
  const mediaTemplate = buildMediaGpsEvidenceTemplate({ latitude, longitude, sourceKind: result?.source_kind ?? 'readiness_approved_manifest', now });
  const addressTemplate = buildNormalizedGeocodeAddressTemplate({ latitude, longitude, now });
  const mediaPathForEnv = result?.configured_paths?.media_evidence_path ?? (!result?.configured_paths?.manifest_path ? paths.mediaGpsTemplatePath : null);
  const manifestPathForEnv = result?.configured_paths?.manifest_path ?? null;
  const addressPathForEnv = result?.configured_paths?.address_evidence_path ?? paths.normalizedAddressTemplatePath;
  const envLines = buildBridgeEnvLines({
    mediaEvidencePath: mediaPathForEnv,
    manifestPath: manifestPathForEnv,
    addressEvidencePath: addressPathForEnv,
    workerRuntimeStatusPath: result?.configured_paths?.worker_runtime_status_path,
    sourceKind: result?.source_kind ?? 'readiness_approved_manifest',
  });
  await writeFile(paths.mediaGpsTemplatePath, `${JSON.stringify(sanitizeEvidence(mediaTemplate), null, 2)}\n`, 'utf8');
  await writeFile(paths.normalizedAddressTemplatePath, `${JSON.stringify(sanitizeEvidence(addressTemplate), null, 2)}\n`, 'utf8');
  await writeFile(paths.latestEnvPath, `${envLines.join('\n')}\n`, 'utf8');
  await writeFile(paths.latestReportPath, `${JSON.stringify(sanitizeEvidence(result), null, 2)}\n`, 'utf8');
  await writeFile(paths.nextStepsPath, `${result.next_steps.join('\n')}\n`, 'utf8');
  return {
    ...paths,
    envLines,
    envLine: envLines.join('\n'),
    relative: Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, repoRelative(value)])),
  };
}
