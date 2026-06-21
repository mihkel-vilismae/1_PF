import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { isTruthy, readJsonFile, requirement, statusFromRequirements, blockReasons } from './real-icloud-proof-evidence-utils.mjs';
import { sanitizeEvidence } from './proof-utils.mjs';
import { buildRegularWorkerProductEvidenceFromResolvedInput, evaluateRegularWorkerStructuredEvidence, resolveWorkerInputFromDownloadManifest } from './regular-worker-product-evidence-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

function toPortablePath(path) {
  return path.split(sep).join('/');
}

function repoRelative(path) {
  const rel = relative(repoRoot, path);
  return rel && !rel.startsWith('..') ? toPortablePath(rel) : path;
}

export function evaluateRegularWorkerProductEvidenceProducer(env = process.env, opts = {}) {
  const manifestPath = env.PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE ?? env.PF_WORKER_REAL_DOWNLOAD_BRIDGE_MANIFEST_FILE ?? env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE;
  const sourceKind = opts.sourceKind ?? env.PF_WORKER_INPUT_SOURCE_KIND ?? 'readiness_approved_manifest';
  const productWorkClaimed = isTruthy(env.PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED);
  const manifest = readJsonFile(manifestPath, { cwd: opts.cwd ?? process.cwd() });
  const resolvedInput = manifest.value ? resolveWorkerInputFromDownloadManifest(manifest.value, { sourceKind }) : null;
  const evidence = resolvedInput ? buildRegularWorkerProductEvidenceFromResolvedInput({
    resolvedInput,
    productWorkClaimed,
    workerRunId: env.PF_REGULAR_WORKER_PRODUCT_RUN_ID ?? null,
    now: opts.now ?? new Date().toISOString(),
  }) : null;
  const structuredEvaluation = evidence ? evaluateRegularWorkerStructuredEvidence(evidence) : null;
  const requirements = [
    requirement('regular_worker_product_evidence_opt_in', isTruthy(env.PF_PROOF_ENABLE_REGULAR_WORKER_PRODUCT_EVIDENCE), 'Set PF_PROOF_ENABLE_REGULAR_WORKER_PRODUCT_EVIDENCE=true to generate product evidence.'),
    requirement('regular_worker_product_manifest_configured', Boolean(manifestPath), 'Set PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE or PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE.'),
    requirement('regular_worker_product_work_confirmed', productWorkClaimed, 'Set PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED=true only after regular_stage_worker performed the product run.'),
  ];
  if (manifestPath) requirements.push(requirement('regular_worker_product_manifest_parsed', Boolean(manifest.value), manifest.reason));
  if (resolvedInput) requirements.push(requirement('regular_worker_product_input_resolved', resolvedInput.status === 'PASSED', resolvedInput.errors.join('; ') || 'Manifest resolved to worker input.'));
  if (structuredEvaluation) requirements.push(requirement('regular_worker_product_structured_evidence_complete', structuredEvaluation.complete, structuredEvaluation.failedReasons.join('; ') || structuredEvaluation.missingCoreFlags.join(', ') || 'Structured evidence is core-complete.'));
  return {
    proofStatus: statusFromRequirements(requirements),
    requirements,
    manifest_path: manifestPath ?? null,
    source_kind: sourceKind,
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
