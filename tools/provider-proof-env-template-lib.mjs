/** Provider proof environment template guard. */
import { readFileSync } from 'node:fs';

export const PROVIDER_PROOF_TEMPLATE_PATH = 'docs/10_runbooks/provider_proof_env_template.env.example';
export const REQUIRED_TEMPLATE_KEYS = Object.freeze([
  'PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN',
  'PF_GEOCODE_CHAIN_PROOF_PROVIDER',
  'PF_PROOF_ENABLE_REAL_ICLOUDPD',
  'PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION',
  'PF_API_BASE_URL',
]);

const SECRET_VALUE_PATTERNS = Object.freeze([
  /user\s*=\s*[^#\s].+/i,
  /pw\s*=\s*[^#\s].+/i,
  /password\s*=\s*[^#\s].+/i,
  /token\s*=\s*[^#\s].+/i,
  /api[_-]?key\s*=\s*[^#\s].+/i,
  /cookie\s*=\s*[^#\s].+/i,
]);

export function analyzeProviderProofEnvTemplate(text) {
  const requiredKeys = REQUIRED_TEMPLATE_KEYS.map((key) => ({ key, present: new RegExp(`^${key}=`, 'm').test(text) }));
  const optInDefaultsSafe = [
    { key: 'PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN', safe: /^PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=false$/m.test(text) },
    { key: 'PF_PROOF_ENABLE_REAL_ICLOUDPD', safe: /^PF_PROOF_ENABLE_REAL_ICLOUDPD=false$/m.test(text) },
    { key: 'PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION', safe: /^PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION=false$/m.test(text) },
  ];
  const secretFindings = SECRET_VALUE_PATTERNS
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source);
  return {
    required_keys: requiredKeys,
    opt_in_defaults_safe: optInDefaultsSafe,
    secret_value_findings: secretFindings,
    no_secret_values: secretFindings.length === 0,
    template_path: PROVIDER_PROOF_TEMPLATE_PATH,
  };
}

export function readAndAnalyzeProviderProofEnvTemplate(path = PROVIDER_PROOF_TEMPLATE_PATH) {
  return analyzeProviderProofEnvTemplate(readFileSync(path, 'utf8'));
}
