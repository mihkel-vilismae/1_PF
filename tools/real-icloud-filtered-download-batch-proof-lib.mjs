import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateDownloadManifestSafeSchema } from './download-manifest-safe-schema-lib.mjs';

export const REAL_ICLOUD_FILTERED_DOWNLOAD_BATCH_PROOF_KIND = 'real_icloud_filtered_download_batch';

export function readManifestFile(manifestPath, { cwd = process.cwd() } = {}) {
  if (!manifestPath || typeof manifestPath !== 'string') return { manifest: null, reason: 'manifest file path is not configured' };
  const resolved = resolve(cwd, manifestPath);
  if (!existsSync(resolved)) return { manifest: null, reason: 'manifest file does not exist' };
  try {
    return { manifest: JSON.parse(readFileSync(resolved, 'utf8')), reason: 'manifest parsed' };
  } catch (error) {
    return { manifest: null, reason: `manifest file is not valid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export function validateRealIcloudFilteredDownloadBatch({ manifest, expectedBatchIndex = 0, expectedFilterSignature = null, minItems = 1 } = {}) {
  if (!manifest) return { status: 'BLOCKED', errors: ['manifest is not provided'], batch: null };
  const schema = validateDownloadManifestSafeSchema(manifest);
  const errors = [...schema.errors];
  const batch = manifest.batches?.[expectedBatchIndex] ?? null;
  if (!batch) errors.push(`batch index ${expectedBatchIndex} is missing`);
  if (batch && batch.downloaded_count < minItems) errors.push(`batch ${batch.batch_id} downloaded_count must be at least ${minItems}`);
  if (batch && !Array.isArray(batch.items)) errors.push(`batch ${batch.batch_id} items must be an array`);
  if (expectedFilterSignature && manifest.filter_signature !== expectedFilterSignature) errors.push('manifest filter_signature does not match expected filter signature');
  if (batch?.filter_signature && batch.filter_signature !== manifest.filter_signature) errors.push(`batch ${batch.batch_id} filter_signature does not match manifest filter_signature`);
  return { status: errors.length ? 'FAILED' : 'PASSED', errors, batch };
}

export function evaluateBatchProofFromEnv(env = process.env, { cwd = process.cwd(), envVar, expectedBatchIndex, proofLabel } = {}) {
  const manifestPath = env[envVar];
  const expectedFilterSignature = env.PF_REAL_ICLOUD_EXPECTED_FILTER_SIGNATURE || null;
  const { manifest, reason } = readManifestFile(manifestPath, { cwd });
  if (!manifest) return { proofStatus: 'BLOCKED', manifest_path_configured: Boolean(manifestPath), block_reasons: [`${proofLabel}: ${reason}`], validation: null };
  const validation = validateRealIcloudFilteredDownloadBatch({ manifest, expectedBatchIndex, expectedFilterSignature, minItems: 1 });
  return {
    proofStatus: validation.status,
    manifest_path_configured: true,
    manifest_summary: {
      filter_signature: manifest.filter_signature ?? null,
      batch_count: manifest.batches?.length ?? 0,
      expected_batch_id: validation.batch?.batch_id ?? null,
      expected_batch_downloaded_count: validation.batch?.downloaded_count ?? null,
    },
    block_reasons: validation.status === 'FAILED' ? validation.errors : [],
    validation,
  };
}
