import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
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
import { validateAuthSessionUsableEvidence } from './auth-session-usable-evidence-lib.mjs';
import { validateDownloadManifestSafeSchema } from './download-manifest-safe-schema-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

export const REAL_ICLOUD_MEDIA_SOURCE_EVIDENCE_PACK_VERSION = 1;
const SAFE_SHA_RE = /^sha256:[a-f0-9]{64}$/i;
const SECRETISH_KEY_RE = /(?:apple[_-]?id|password|passwd|pwd|two[_-]?factor[_-]?code|2fa[_-]?code|sms[_-]?code|auth[_-]?code|cookie[_-]?value|cookies[_-]?value|token|session_path|raw_session)/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const SIX_DIGIT_CODE_RE = /\b\d{6}\b/;

function toPortablePath(path) { return path.split(sep).join('/'); }
function repoRelative(path) {
  const rel = relative(repoRoot, path);
  return rel && !rel.startsWith('..') ? toPortablePath(rel) : path;
}
function firstExistingPath(...values) {
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}
function sha(char) { return `sha256:${char.repeat(64)}`; }
function containsForbiddenText(value) {
  const serialized = JSON.stringify(value ?? '');
  return EMAIL_RE.test(serialized) || SIX_DIGIT_CODE_RE.test(serialized);
}
function containsForbiddenKey(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsForbiddenKey);
  return Object.entries(value).some(([key, entry]) => SECRETISH_KEY_RE.test(key) || containsForbiddenKey(entry));
}
function classifySafeJson(value) {
  const errors = [];
  if (containsForbiddenText(value)) errors.push('evidence must not include email addresses or 6-digit codes');
  if (containsForbiddenKey(value)) errors.push('evidence must not include secret-like key names');
  return { status: errors.length === 0 ? 'PASSED' : 'FAILED', errors };
}

export function buildUsableSessionEvidenceTemplate({ now = new Date().toISOString() } = {}) {
  return {
    schema_version: 1,
    proof_kind: 'auth_session_usable_evidence',
    session_state: 'REPLACE_WITH_usable_AFTER_OPERATOR_LOGIN',
    operator_completed_2fa: false,
    checkpoint_marker_seen: false,
    checked_at: now,
    evidence_source: 'operator_machine_redacted_status',
    redacted: true,
    secret_fields_present: false,
    safe_session_id_hash: 'sha256:REPLACE_WITH_64_HEX_CHARS',
    notes: ['Do not include account identifiers, passwords, codes, cookie values, raw session files, or provider output.'],
  };
}

export function buildDownloadEvidenceTemplate({ now = new Date().toISOString() } = {}) {
  return {
    schema_version: 1,
    evidence_kind: 'real_icloud_download_evidence',
    source_kind: 'real_icloudpd',
    download_status: 'REPLACE_WITH_completed_AFTER_REAL_DOWNLOAD',
    manifest_ready: false,
    downloaded_item_count: 0,
    safe_download_run_id: 'REPLACE_WITH_SAFE_RUN_ID_OR_HASH',
    manifest_file: 'runtime_data/operator_evidence/real_icloud_media_source_evidence_pack/real_icloud_download_manifest_template.json',
    redaction: {
      private_paths_redacted: true,
      secrets_redacted: true,
      raw_media_included: false,
      raw_provider_output_included: false,
      account_identifiers_included: false,
    },
    observed_at: now,
    operator_note: 'Fill only after a real/operator-approved download. Keep paths redacted and do not include raw media.',
  };
}

export function buildContinuationEvidenceTemplate({ now = new Date().toISOString() } = {}) {
  return {
    schema_version: 1,
    evidence_kind: 'real_icloud_download_continuation_evidence',
    continuation_status: 'REPLACE_WITH_safe_AFTER_REPEAT_DOWNLOAD_CHECK',
    first_run: { downloaded_count: 0, unique_content_count: 0, safe_run_id_hash: sha('a') },
    second_run: { downloaded_count: 0, duplicate_content_added_count: 0, safe_run_id_hash: sha('b') },
    continuation_safe: false,
    redaction: {
      private_paths_redacted: true,
      secrets_redacted: true,
      raw_media_included: false,
      raw_provider_output_included: false,
      account_identifiers_included: false,
    },
    observed_at: now,
    operator_note: 'Fill only after repeated-download proof/evidence confirms no duplicate content growth.',
  };
}

export function buildDownloadManifestTemplate({ now = new Date().toISOString() } = {}) {
  return {
    schema_version: 1,
    proof_kind: 'real_icloud_filtered_download_manifest',
    filter_signature: sha('c'),
    batches: [
      {
        batch_id: 'batch_001',
        run_id: 'REPLACE_WITH_SAFE_RUN_ID',
        started_at: now,
        completed_at: now,
        downloaded_count: 0,
        items: [],
      },
      {
        batch_id: 'batch_002',
        run_id: 'REPLACE_WITH_SAFE_RUN_ID_SECOND_RUN',
        started_at: now,
        completed_at: now,
        downloaded_count: 0,
        items: [],
      },
    ],
    overlap: { source_id_overlap_count: 0, file_hash_overlap_count: 0, filename_overlap_count: 0 },
    secret_safety: { raw_media_included: false, raw_provider_output_included: false, secrets_removed: true, private_paths_redacted: true },
    operator_note: 'Replace empty items with safe hashes/basenames only after real/download evidence exists. No private paths or raw provider output.',
  };
}

export function validateDownloadEvidence(evidence) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object') errors.push('download evidence must be an object');
  if (evidence?.schema_version !== 1) errors.push('schema_version must be 1');
  if (evidence?.evidence_kind !== 'real_icloud_download_evidence') errors.push('evidence_kind must be real_icloud_download_evidence');
  if (evidence?.download_status !== 'completed') errors.push('download_status must be completed');
  if (evidence?.manifest_ready !== true) errors.push('manifest_ready must be true');
  if (!Number.isInteger(evidence?.downloaded_item_count) || evidence.downloaded_item_count <= 0) errors.push('downloaded_item_count must be positive');
  if (evidence?.redaction?.private_paths_redacted !== true) errors.push('private_paths_redacted must be true');
  if (evidence?.redaction?.secrets_redacted !== true) errors.push('secrets_redacted must be true');
  if (evidence?.redaction?.raw_media_included !== false) errors.push('raw_media_included must be false');
  if (evidence?.redaction?.raw_provider_output_included !== false) errors.push('raw_provider_output_included must be false');
  if (evidence?.redaction?.account_identifiers_included !== false) errors.push('account_identifiers_included must be false');
  const safety = classifySafeJson(evidence);
  errors.push(...safety.errors);
  return { status: errors.length === 0 ? 'PASSED' : 'FAILED', errors };
}

export function validateContinuationEvidence(evidence) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object') errors.push('continuation evidence must be an object');
  if (evidence?.schema_version !== 1) errors.push('schema_version must be 1');
  if (evidence?.evidence_kind !== 'real_icloud_download_continuation_evidence') errors.push('evidence_kind must be real_icloud_download_continuation_evidence');
  if (evidence?.continuation_status !== 'safe') errors.push('continuation_status must be safe');
  if (evidence?.continuation_safe !== true) errors.push('continuation_safe must be true');
  if (!Number.isInteger(evidence?.first_run?.downloaded_count) || evidence.first_run.downloaded_count <= 0) errors.push('first_run.downloaded_count must be positive');
  if (!Number.isInteger(evidence?.second_run?.duplicate_content_added_count) || evidence.second_run.duplicate_content_added_count !== 0) errors.push('second_run.duplicate_content_added_count must be 0');
  if (!SAFE_SHA_RE.test(evidence?.first_run?.safe_run_id_hash ?? '')) errors.push('first_run.safe_run_id_hash must be sha256 hash');
  if (!SAFE_SHA_RE.test(evidence?.second_run?.safe_run_id_hash ?? '')) errors.push('second_run.safe_run_id_hash must be sha256 hash');
  if (evidence?.redaction?.private_paths_redacted !== true) errors.push('private_paths_redacted must be true');
  if (evidence?.redaction?.secrets_redacted !== true) errors.push('secrets_redacted must be true');
  if (evidence?.redaction?.raw_media_included !== false) errors.push('raw_media_included must be false');
  if (evidence?.redaction?.raw_provider_output_included !== false) errors.push('raw_provider_output_included must be false');
  if (evidence?.redaction?.account_identifiers_included !== false) errors.push('account_identifiers_included must be false');
  const safety = classifySafeJson(evidence);
  errors.push(...safety.errors);
  return { status: errors.length === 0 ? 'PASSED' : 'FAILED', errors };
}

export function buildRealIcloudEvidencePackEnvLines({ authPath, downloadEvidencePath, manifestPath, continuationEvidencePath, reportPath } = {}) {
  const lines = [
    'PF_PROOF_ENABLE_REAL_ICLOUD_MEDIA_SOURCE_EVIDENCE_PACK=true',
    'PF_PROOF_ENABLE_REAL_ICLOUDPD=true',
    'PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION=true',
    'PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD=true',
  ];
  if (authPath) lines.push(`PF_AUTH_SESSION_USABLE_EVIDENCE_FILE=${repoRelative(authPath)}`);
  if (downloadEvidencePath) lines.push(`PF_REAL_ICLOUD_DOWNLOAD_EVIDENCE_FILE=${repoRelative(downloadEvidencePath)}`);
  if (manifestPath) {
    lines.push(`PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE=${repoRelative(manifestPath)}`);
    lines.push(`PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE=${repoRelative(manifestPath)}`);
    lines.push(`PF_REAL_ICLOUD_MANIFEST_FILE=${repoRelative(manifestPath)}`);
    lines.push(`PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE=${repoRelative(manifestPath)}`);
    lines.push(`PF_WORKER_REAL_DOWNLOAD_BRIDGE_MANIFEST_FILE=${repoRelative(manifestPath)}`);
    lines.push(`PF_REAL_GPS_GEOCODE_MANIFEST_FILE=${repoRelative(manifestPath)}`);
  }
  if (continuationEvidencePath) lines.push(`PF_REAL_ICLOUD_CONTINUATION_EVIDENCE_FILE=${repoRelative(continuationEvidencePath)}`);
  if (reportPath) lines.push(`PF_REAL_ICLOUD_MEDIA_SOURCE_EVIDENCE_PACK_REPORT=${repoRelative(reportPath)}`);
  return lines;
}

export function evaluateRealIcloudMediaSourceEvidencePack(env = process.env, opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const authPath = firstExistingPath(env.PF_AUTH_SESSION_USABLE_EVIDENCE_FILE);
  const downloadEvidencePath = firstExistingPath(env.PF_REAL_ICLOUD_DOWNLOAD_EVIDENCE_FILE);
  const manifestPath = firstExistingPath(env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE, env.PF_REAL_ICLOUD_MANIFEST_FILE);
  const continuationEvidencePath = firstExistingPath(env.PF_REAL_ICLOUD_CONTINUATION_EVIDENCE_FILE);

  const authFile = readJsonFile(authPath, { cwd });
  const downloadEvidenceFile = readJsonFile(downloadEvidencePath, { cwd });
  const manifestFile = readJsonFile(manifestPath, { cwd });
  const continuationFile = readJsonFile(continuationEvidencePath, { cwd });

  const authValidation = authFile.value ? validateAuthSessionUsableEvidence(authFile.value) : null;
  const downloadValidation = downloadEvidenceFile.value ? validateDownloadEvidence(downloadEvidenceFile.value) : null;
  const manifestValidation = manifestFile.value ? validateDownloadManifestSafeSchema(manifestFile.value) : null;
  const continuationValidation = continuationFile.value ? validateContinuationEvidence(continuationFile.value) : null;
  const manifestBatchHasItems = Array.isArray(manifestFile.value?.batches) && manifestFile.value.batches.some((batch) => Array.isArray(batch.items) && batch.items.length > 0 && Number(batch.downloaded_count) > 0);

  const missing = [];
  if (!authPath) missing.push('PF_AUTH_SESSION_USABLE_EVIDENCE_FILE');
  if (!downloadEvidencePath) missing.push('PF_REAL_ICLOUD_DOWNLOAD_EVIDENCE_FILE');
  if (!manifestPath) missing.push('PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE or PF_REAL_ICLOUD_MANIFEST_FILE');
  if (!continuationEvidencePath) missing.push('PF_REAL_ICLOUD_CONTINUATION_EVIDENCE_FILE');
  if (!isTruthy(env.PF_PROOF_ENABLE_REAL_ICLOUD_MEDIA_SOURCE_EVIDENCE_PACK)) missing.push('PF_PROOF_ENABLE_REAL_ICLOUD_MEDIA_SOURCE_EVIDENCE_PACK=true');

  const requirements = [
    requirement('evidence_pack_opt_in', isTruthy(env.PF_PROOF_ENABLE_REAL_ICLOUD_MEDIA_SOURCE_EVIDENCE_PACK), 'Set PF_PROOF_ENABLE_REAL_ICLOUD_MEDIA_SOURCE_EVIDENCE_PACK=true.'),
    requirement('auth_session_evidence_configured', Boolean(authPath), 'Set PF_AUTH_SESSION_USABLE_EVIDENCE_FILE.'),
    requirement('download_evidence_configured', Boolean(downloadEvidencePath), 'Set PF_REAL_ICLOUD_DOWNLOAD_EVIDENCE_FILE.'),
    requirement('download_manifest_configured', Boolean(manifestPath), 'Set PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE or PF_REAL_ICLOUD_MANIFEST_FILE.'),
    requirement('continuation_evidence_configured', Boolean(continuationEvidencePath), 'Set PF_REAL_ICLOUD_CONTINUATION_EVIDENCE_FILE.'),
  ];
  if (authPath) requirements.push(requirement('auth_session_evidence_parsed', Boolean(authFile.value), authFile.reason));
  if (authValidation) requirements.push(requirement('auth_session_evidence_valid', authValidation.status === 'PASSED', authValidation.errors.join('; ') || 'Usable-session evidence validates.'));
  if (downloadEvidencePath) requirements.push(requirement('download_evidence_parsed', Boolean(downloadEvidenceFile.value), downloadEvidenceFile.reason));
  if (downloadValidation) requirements.push(requirement('download_evidence_valid', downloadValidation.status === 'PASSED', downloadValidation.errors.join('; ') || 'Download evidence validates.'));
  if (manifestPath) requirements.push(requirement('download_manifest_parsed', Boolean(manifestFile.value), manifestFile.reason));
  if (manifestValidation) requirements.push(requirement('download_manifest_schema_valid', manifestValidation.status === 'PASSED', manifestValidation.errors.join('; ') || 'Download manifest schema validates.'));
  if (manifestFile.value) requirements.push(requirement('download_manifest_has_downloaded_items', manifestBatchHasItems, 'Manifest must contain at least one safe downloaded item before it can claim real media source.'));
  if (continuationEvidencePath) requirements.push(requirement('continuation_evidence_parsed', Boolean(continuationFile.value), continuationFile.reason));
  if (continuationValidation) requirements.push(requirement('continuation_evidence_valid', continuationValidation.status === 'PASSED', continuationValidation.errors.join('; ') || 'Continuation evidence validates.'));

  const proofStatus = statusFromRequirements(requirements);
  return {
    proofStatus,
    requirements,
    configured_paths: {
      auth_session_evidence_path: authPath ?? null,
      download_evidence_path: downloadEvidencePath ?? null,
      download_manifest_path: manifestPath ?? null,
      continuation_evidence_path: continuationEvidencePath ?? null,
    },
    parsed: {
      auth_session_evidence: Boolean(authFile.value),
      download_evidence: Boolean(downloadEvidenceFile.value),
      download_manifest: Boolean(manifestFile.value),
      continuation_evidence: Boolean(continuationFile.value),
    },
    validations: {
      auth_session_evidence: authValidation,
      download_evidence: downloadValidation,
      download_manifest: manifestValidation,
      continuation_evidence: continuationValidation,
    },
    missing_for_real_icloud_media_source: missing,
    block_reasons: blockReasons(requirements),
    next_steps: buildRealIcloudEvidencePackNextSteps({ missing, authPath, downloadEvidencePath, manifestPath, continuationEvidencePath }),
    non_claims: [
      'does not claim Apple authentication unless usable-session evidence validates',
      'does not claim real iCloud download unless download evidence and manifest validate',
      'does not claim GPS/geocode unless separate GPS/geocode evidence exists',
      'does not claim worker product output unless separate product evidence exists',
      'does not claim address overlay visibility unless separate display evidence exists',
    ],
  };
}

export function buildRealIcloudEvidencePackNextSteps({ missing = [], authPath = null, downloadEvidencePath = null, manifestPath = null, continuationEvidencePath = null } = {}) {
  const steps = [];
  if (missing.length) steps.push(`Fill or provide missing iCloud media source inputs: ${missing.join(', ')}.`);
  if (!authPath) steps.push('Fill auth_session_usable_evidence_template.json only after manual login/2FA has produced an app-owned usable-session checkpoint.');
  if (!downloadEvidencePath) steps.push('Fill real_icloud_download_evidence_template.json only after a real/operator-approved download has happened.');
  if (!manifestPath) steps.push('Fill real_icloud_download_manifest_template.json with safe hashes/basenames and downloaded items; do not include private paths or raw media.');
  if (!continuationEvidencePath) steps.push('Fill real_icloud_continuation_evidence_template.json only after repeated-download/no-duplicate behavior is checked.');
  steps.push('Review latest.env, then source/dot-source it before running real iCloud readiness/download proofs.');
  steps.push('Do not add Apple identifiers, passwords, codes, cookies, raw session files, raw media bytes, private paths, or raw provider output.');
  return steps;
}

export function getRealIcloudEvidencePackOutputPaths({ outputDirectory = join(repoRoot, 'runtime_data', 'operator_evidence', 'real_icloud_media_source_evidence_pack') } = {}) {
  return {
    outputDirectory,
    authSessionTemplatePath: join(outputDirectory, 'auth_session_usable_evidence_template.json'),
    downloadEvidenceTemplatePath: join(outputDirectory, 'real_icloud_download_evidence_template.json'),
    downloadManifestTemplatePath: join(outputDirectory, 'real_icloud_download_manifest_template.json'),
    continuationEvidenceTemplatePath: join(outputDirectory, 'real_icloud_continuation_evidence_template.json'),
    latestEnvPath: join(outputDirectory, 'latest.env'),
    latestReportPath: join(outputDirectory, 'latest_report.json'),
    nextStepsPath: join(outputDirectory, 'NEXT_STEPS.txt'),
  };
}

export async function writeRealIcloudMediaSourceEvidencePack(result, { outputDirectory = join(repoRoot, 'runtime_data', 'operator_evidence', 'real_icloud_media_source_evidence_pack'), now = new Date().toISOString() } = {}) {
  const paths = getRealIcloudEvidencePackOutputPaths({ outputDirectory });
  await mkdir(paths.outputDirectory, { recursive: true });
  const authPathForEnv = result?.configured_paths?.auth_session_evidence_path ?? paths.authSessionTemplatePath;
  const downloadPathForEnv = result?.configured_paths?.download_evidence_path ?? paths.downloadEvidenceTemplatePath;
  const manifestPathForEnv = result?.configured_paths?.download_manifest_path ?? paths.downloadManifestTemplatePath;
  const continuationPathForEnv = result?.configured_paths?.continuation_evidence_path ?? paths.continuationEvidenceTemplatePath;
  const envLines = buildRealIcloudEvidencePackEnvLines({
    authPath: authPathForEnv,
    downloadEvidencePath: downloadPathForEnv,
    manifestPath: manifestPathForEnv,
    continuationEvidencePath: continuationPathForEnv,
    reportPath: paths.latestReportPath,
  });
  await writeFile(paths.authSessionTemplatePath, `${JSON.stringify(sanitizeEvidence(buildUsableSessionEvidenceTemplate({ now })), null, 2)}\n`, 'utf8');
  await writeFile(paths.downloadEvidenceTemplatePath, `${JSON.stringify(sanitizeEvidence(buildDownloadEvidenceTemplate({ now })), null, 2)}\n`, 'utf8');
  await writeFile(paths.downloadManifestTemplatePath, `${JSON.stringify(sanitizeEvidence(buildDownloadManifestTemplate({ now })), null, 2)}\n`, 'utf8');
  await writeFile(paths.continuationEvidenceTemplatePath, `${JSON.stringify(sanitizeEvidence(buildContinuationEvidenceTemplate({ now })), null, 2)}\n`, 'utf8');
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
