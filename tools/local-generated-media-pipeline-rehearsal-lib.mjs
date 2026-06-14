/** Windows-safe local/generated media pipeline rehearsal proof. */
import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { buildRegularWorkerProductPipelineContract } from './regular-worker-product-pipeline-contract-lib.mjs';

function readManifest(manifestPath) {
  if (!existsSync(manifestPath)) return { exists: false, data: null, error: null };
  try { return { exists: true, data: JSON.parse(readFileSync(manifestPath, 'utf8')), error: null }; }
  catch (error) { return { exists: true, data: null, error: error instanceof Error ? error.message : String(error) }; }
}

export function inspectGeneratedMediaFixtures({ repoRoot = process.cwd() } = {}) {
  const base = join(repoRoot, 'generated_test_data');
  const manifestPath = join(base, 'manifest.json');
  const manifest = readManifest(manifestPath);
  const records = Array.isArray(manifest.data?.records) ? manifest.data.records : Array.isArray(manifest.data?.files) ? manifest.data.files : [];
  const mediaRecords = records.filter((record) => typeof record.relativePath === 'string' || typeof record.path === 'string');
  const gpsRecords = mediaRecords.filter((record) => record.hasGps === true || record.has_gps === true || String(record.relativePath ?? record.path ?? '').includes('gps'));
  return {
    base,
    manifestPath,
    manifestExists: manifest.exists,
    manifestError: manifest.error,
    recordCount: mediaRecords.length,
    gpsLikeRecordCount: gpsRecords.length,
    requiredDirectories: ['videos_with_gps', 'videos_no_gps'].map((name) => ({ name, exists: existsSync(join(base, name)) })),
  };
}

export function evaluateGeneratedMediaRehearsal(inspect) {
  const blockReasons = [];
  if (!inspect.manifestExists) blockReasons.push('generated_test_data/manifest.json is missing');
  if (inspect.manifestError) blockReasons.push(`generated_test_data manifest is not parseable: ${inspect.manifestError}`);
  for (const dir of inspect.requiredDirectories) if (!dir.exists) blockReasons.push(`required generated media directory is missing: ${dir.name}`);
  if (inspect.recordCount <= 0) blockReasons.push('generated media manifest contains no media records');
  return { proofStatus: blockReasons.length ? 'BLOCKED' : 'PASSED', blockReasons };
}

export function buildLocalGeneratedMediaPipelineRehearsalProof({ metadata, repoRoot = process.cwd() } = {}) {
  const fixtureInspection = inspectGeneratedMediaFixtures({ repoRoot });
  const evaluation = evaluateGeneratedMediaRehearsal(fixtureInspection);
  return createProofEnvelope({
    proofKind: 'local_generated_media_pipeline_rehearsal',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: 'windows_safe_generated_media_rehearsal',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      fixtureInspection,
      pipeline_contract_preview: buildRegularWorkerProductPipelineContract({ sourcePriority: 'generated_media_rehearsal' }),
      evaluation,
      pass_criteria: 'PASSED when generated media fixtures and manifest required for a local pipeline rehearsal are present and parseable.',
      non_claims: ['does not download iCloud media', 'does not mutate the production DB', 'does not prove real GPS/geocode provider calls', 'does not prove Raspberry playback'],
    }),
    knownLimitations: ['This is a rehearsal/proof scaffold only. It prepares product-pipeline tests without claiming real provider or Raspberry execution.'],
  });
}
