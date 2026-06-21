import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { blockReasons, hasSecretLikeText, readJsonFile, requirement, statusFromRequirements } from './real-icloud-proof-evidence-utils.mjs';

const REQUIRED_ENTRIES = [
  'auth_session_usable_evidence.json',
  'filter.json',
  'download_ledger.json',
  'batch1_manifest.json',
  'batch2_manifest.json',
  'last_run_stats.json'
];

export function buildSampleEvidenceZipManifest(overrides = {}) {
  return { schema_version: 1, proof_kind: 'real_icloud_evidence_zip_contract', entries: REQUIRED_ENTRIES, secret_safety: { secrets_included: false, raw_media_included: false, raw_provider_output_included: false }, ...overrides };
}

export function evaluateRealIcloudEvidenceZipContract(env = process.env, { cwd = process.cwd() } = {}) {
  const manifestPath = env.PF_REAL_ICLOUD_EVIDENCE_ZIP_MANIFEST_FILE;
  const manifest = readJsonFile(manifestPath, { cwd });
  const requirements = [requirement('evidence_zip_manifest_configured', Boolean(manifestPath), 'Set PF_REAL_ICLOUD_EVIDENCE_ZIP_MANIFEST_FILE to a JSON manifest representing the upload ZIP contents.')];
  if (manifest.value) {
    requirements.push(requirement('manifest_schema_version', manifest.value.schema_version === 1, 'Evidence ZIP manifest schema_version must be 1.'));
    requirements.push(requirement('manifest_kind', manifest.value.proof_kind === 'real_icloud_evidence_zip_contract', 'proof_kind must be real_icloud_evidence_zip_contract.'));
    for (const entry of REQUIRED_ENTRIES) requirements.push(requirement(`contains:${entry}`, Array.isArray(manifest.value.entries) && manifest.value.entries.includes(entry), `Evidence ZIP must include ${entry}.`));
    requirements.push(requirement('secrets_not_included', manifest.value.secret_safety?.secrets_included === false, 'secrets_included must be false.'));
    requirements.push(requirement('raw_media_not_included', manifest.value.secret_safety?.raw_media_included === false, 'raw_media_included must be false.'));
    requirements.push(requirement('raw_provider_output_not_included', manifest.value.secret_safety?.raw_provider_output_included === false, 'raw_provider_output_included must be false.'));
    requirements.push(requirement('manifest_secret_safe', !hasSecretLikeText(manifest.value), 'Manifest itself must not contain secret-like values.'));
  }
  const evidenceDir = env.PF_REAL_ICLOUD_EVIDENCE_PACKAGE_DIR;
  if (evidenceDir) {
    const dir = resolve(cwd, evidenceDir);
    requirements.push(requirement('evidence_package_dir_exists', existsSync(dir), 'Optional evidence package directory must exist when configured.'));
    for (const entry of REQUIRED_ENTRIES) requirements.push(requirement(`dir_contains:${entry}`, existsSync(resolve(dir, entry)), `Evidence package directory must contain ${entry}.`));
    try {
      const text = REQUIRED_ENTRIES.map((entry) => existsSync(resolve(dir, entry)) ? readFileSync(resolve(dir, entry), 'utf8') : '').join('
');
      requirements.push(requirement('evidence_package_dir_secret_safe', !hasSecretLikeText(text), 'Evidence package directory files must not contain secret-like values.'));
    } catch { requirements.push(requirement('evidence_package_dir_secret_safe', false, 'Could not audit evidence package directory files.')); }
  }
  return { proofStatus: statusFromRequirements(requirements), requirements, required_entries: REQUIRED_ENTRIES, block_reasons: blockReasons(requirements) };
}
