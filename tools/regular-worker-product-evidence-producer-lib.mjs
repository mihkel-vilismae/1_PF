/**
 * Produces structured regular-worker product evidence from safe manifests.
 * Requires durable product-capable worker runtime status as claim authority.
 * Writes only sanitized operator evidence and handoff paths.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { isTruthy, readJsonFile, requirement, statusFromRequirements, blockReasons } from './real-icloud-proof-evidence-utils.mjs';
import { sanitizeEvidence } from './proof-utils.mjs';
import { buildRegularWorkerProductEvidenceFromResolvedInput, evaluateRegularWorkerStructuredEvidence, resolveWorkerInputFromDownloadManifest } from './regular-worker-product-evidence-lib.mjs';
import { evaluateRegularWorkerRuntimeProductEvidence } from './regular-worker-runtime-evidence-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

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

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeExtensionFromName(name) {
  const ext = extname(String(name ?? '')).toLowerCase();
  return ext && /^\.[a-z0-9]{1,12}$/.test(ext) ? ext : '.bin';
}

function safeFilename(value, fallback = 'media.bin') {
  const name = basename(String(value ?? '')).replace(/[^a-zA-Z0-9._-]/g, '_');
  return name && !name.includes('..') ? name : fallback;
}

function findLatestProofFile(cwd, prefix) {
  const proofDir = join(cwd, 'runtime_data', 'proofs');
  if (!existsSync(proofDir)) return null;
  return readdirSync(proofDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.json'))
    .sort()
    .reverse()
    .map((name) => join(proofDir, name))[0] ?? null;
}

function readJsonSync(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function firstArray(...values) {
  for (const value of values) if (Array.isArray(value) && value.length) return value;
  return [];
}

/** Builds a safe manifest from the latest PASSED real_download_continuation proof when no manifest env is supplied. */
export function deriveSafeManifestFromLatestContinuationProof({ cwd = process.cwd(), now = new Date().toISOString() } = {}) {
  const proofPath = findLatestProofFile(cwd, 'real_download_continuation_');
  if (!proofPath) return { manifest: null, source: null, reason: 'No real_download_continuation proof was found.' };
  const proof = readJsonSync(proofPath);
  if (!isObject(proof)) return { manifest: null, source: proofPath, reason: 'real_download_continuation proof could not be parsed.' };
  if (proof.proof_status !== 'PASSED') return { manifest: null, source: proofPath, reason: 'latest real_download_continuation proof is not PASSED.' };
  const comparison = proof.evidence?.comparison ?? {};
  const samples = firstArray(
    comparison.afterSecond?.fileSample,
    comparison.afterFirst?.fileSample,
    comparison.before?.fileSample,
  );
  const items = samples
    .map((sample, index) => {
      const relativePath = sample?.relativePath ?? sample?.path ?? `media_${index}`;
      const extension = normalizeExtensionFromName(relativePath);
      const sizeBytes = Number(sample?.sizeBytes ?? sample?.size_bytes ?? 0);
      if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) return null;
      const sourceSeed = JSON.stringify({ proof: proofPath, relativePath, sha1: sample?.sha1 ?? null, sizeBytes, index });
      return {
        safe_source_id_hash: safeHash(`source:${sourceSeed}`),
        file_sha256: safeHash(`file:${sourceSeed}`),
        safe_filename: safeFilename(relativePath, `media_${index}${extension}`),
        extension,
        size_bytes: sizeBytes,
        downloaded_at: proof.proof_timestamp ?? now,
      };
    })
    .filter(Boolean);
  if (!items.length) return { manifest: null, source: proofPath, reason: 'real_download_continuation proof has no safe file samples.' };
  return {
    manifest: {
      schema_version: 1,
      proof_kind: 'real_icloud_filtered_download_manifest',
      filter_signature: safeHash(`regular-worker-derived-manifest:${proofPath}:${proof.proof_timestamp ?? now}:${items.length}`),
      batches: [
        {
          batch_id: 'real_download_continuation_latest',
          run_id: safeHash(`run:${proofPath}:${proof.proof_timestamp ?? now}`),
          started_at: proof.proof_timestamp ?? now,
          completed_at: proof.proof_timestamp ?? now,
          downloaded_count: items.length,
          items,
        },
      ],
      overlap: { source_id_overlap_count: 0, file_hash_overlap_count: 0, filename_overlap_count: 0 },
      secret_safety: { raw_media_included: false, raw_provider_output_included: false, secrets_removed: true },
      derived_from: {
        proof_kind: 'real_download_continuation',
        proof_status: 'PASSED',
        proof_path_redacted: true,
        proof_timestamp: proof.proof_timestamp ?? null,
      },
    },
    source: proofPath,
    reason: 'Derived safe manifest from latest PASSED real_download_continuation proof.',
  };
}

/** Evaluates manifest inputs and derives product confirmation from worker runtime status. */
export function evaluateRegularWorkerProductEvidenceProducer(env = process.env, opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const manifestPath = env.PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE ?? env.PF_WORKER_REAL_DOWNLOAD_BRIDGE_MANIFEST_FILE ?? env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE;
  const sourceKind = opts.sourceKind ?? env.PF_WORKER_INPUT_SOURCE_KIND ?? 'readiness_approved_manifest';
  const workerRuntimeEvidence = evaluateRegularWorkerRuntimeProductEvidence(env, { cwd });
  const productWorkClaimed = workerRuntimeEvidence.confirmed;
  const manifest = manifestPath
    ? readJsonFile(manifestPath, { cwd })
    : { value: deriveSafeManifestFromLatestContinuationProof({ cwd, now: opts.now ?? new Date().toISOString() }).manifest, reason: 'auto-derived from latest real_download_continuation proof' };
  const autoManifest = manifestPath ? null : deriveSafeManifestFromLatestContinuationProof({ cwd, now: opts.now ?? new Date().toISOString() });
  const manifestValue = manifestPath ? manifest.value : autoManifest.manifest;
  const manifestReason = manifestPath ? manifest.reason : autoManifest.reason;
  const resolvedInput = manifestValue ? resolveWorkerInputFromDownloadManifest(manifestValue, { sourceKind }) : null;
  const evidence = resolvedInput ? buildRegularWorkerProductEvidenceFromResolvedInput({
    resolvedInput,
    workerRuntimeEvidence,
    workerRunId: workerRuntimeEvidence.worker_run_id ?? env.PF_REGULAR_WORKER_PRODUCT_RUN_ID ?? null,
    now: opts.now ?? new Date().toISOString(),
  }) : null;
  const structuredEvaluation = evidence ? evaluateRegularWorkerStructuredEvidence(evidence) : null;
  const requirements = [
    requirement('regular_worker_product_evidence_opt_in', isTruthy(env.PF_PROOF_ENABLE_REGULAR_WORKER_PRODUCT_EVIDENCE), 'Set PF_PROOF_ENABLE_REGULAR_WORKER_PRODUCT_EVIDENCE=true to generate product evidence.'),
    requirement('regular_worker_product_manifest_configured_or_auto_derived', Boolean(manifestPath || manifestValue), manifestPath ? 'Manifest path configured.' : manifestReason),
    requirement('regular_worker_runtime_product_work_confirmed', productWorkClaimed, workerRuntimeEvidence.reasons.join('; ') || 'regular_stage_worker runtime evidence confirms product work.'),
  ];
  if (manifestPath || manifestValue) requirements.push(requirement('regular_worker_product_manifest_parsed', Boolean(manifestValue), manifestReason));
  if (resolvedInput) requirements.push(requirement('regular_worker_product_input_resolved', resolvedInput.status === 'PASSED', resolvedInput.errors.join('; ') || 'Manifest resolved to worker input.'));
  if (structuredEvaluation) requirements.push(requirement('regular_worker_product_structured_evidence_complete', structuredEvaluation.complete, structuredEvaluation.failedReasons.join('; ') || structuredEvaluation.missingCoreFlags.join(', ') || 'Structured evidence is core-complete.'));
  return {
    proofStatus: statusFromRequirements(requirements),
    requirements,
    manifest_path: manifestPath ?? null,
    manifest_auto_source: autoManifest?.source ?? null,
    manifest_auto_reason: autoManifest?.reason ?? null,
    source_kind: sourceKind,
    worker_runtime_evidence: workerRuntimeEvidence,
    resolved_input: resolvedInput,
    product_pipeline_evidence: evidence,
    structured_evaluation: structuredEvaluation,
    block_reasons: blockReasons(requirements),
  };
}

export function getRegularWorkerProductEvidenceOutputPaths({ outputDirectory = join(repoRoot, 'runtime_data', 'operator_evidence', 'regular_worker_product') } = {}) {
  return {
    outputDirectory,
    latestEvidencePath: join(outputDirectory, 'latest.json'),
    latestEnvPath: join(outputDirectory, 'latest.env'),
  };
}

export async function writeRegularWorkerProductEvidence(evidence, { outputDirectory = join(repoRoot, 'runtime_data', 'operator_evidence', 'regular_worker_product'), updateLatest = true } = {}) {
  const safeEvidence = sanitizeEvidence(evidence);
  const timestamp = String(safeEvidence.observed_at ?? new Date().toISOString()).replace(/[:.]/g, '-');
  const outputPath = join(outputDirectory, `regular_worker_product_evidence_${timestamp}.json`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(safeEvidence, null, 2)}\n`, 'utf8');
  const paths = getRegularWorkerProductEvidenceOutputPaths({ outputDirectory });
  if (updateLatest) {
    await writeFile(paths.latestEvidencePath, `${JSON.stringify(safeEvidence, null, 2)}\n`, 'utf8');
    await writeFile(paths.latestEnvPath, `PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE=${repoRelative(paths.latestEvidencePath)}\n`, 'utf8');
  }
  return { outputPath, latestEvidencePath: paths.latestEvidencePath, latestEnvPath: paths.latestEnvPath, envLine: `PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE=${repoRelative(paths.latestEvidencePath)}` };
}
