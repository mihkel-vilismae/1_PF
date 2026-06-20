import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { validateAuthSessionUsableEvidence } from './auth-session-usable-evidence-lib.mjs';
import { createIcloudFilterSignature } from './icloud-filter-signature-lib.mjs';

export const REAL_ICLOUD_DOWNLOAD_PREFLIGHT_PROOF_KIND = 'real_icloud_download_preflight';
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'y']);
const FORBIDDEN_VALUE = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|password|passwd|pwd|token|cookie|2fa|two.?factor|icloud\.com|appleid|session_path)/i;

export function evaluateRealIcloudDownloadPreflight(env = process.env, { cwd = process.cwd() } = {}) {
  const requirements = [];
  const optIn = TRUE_VALUES.has(String(env.PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD ?? '').toLowerCase());
  requirements.push(requirement('explicit_real_download_opt_in', optIn, 'Set PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD=true to run real download proofs.'));

  const authPath = env.PF_AUTH_SESSION_USABLE_EVIDENCE_FILE;
  const auth = readJsonRequirement(authPath, cwd, 'auth_session_usable_evidence_file');
  if (auth.value) {
    const validation = validateAuthSessionUsableEvidence(auth.value);
    requirements.push(requirement('auth_session_usable_evidence_valid', validation.status === 'PASSED', validation.errors.join('; ') || 'Auth session usable evidence validates.'));
  } else {
    requirements.push(requirement('auth_session_usable_evidence_valid', false, auth.reason));
  }

  const filterJson = env.PF_REAL_ICLOUD_FILTER_JSON;
  const filterFile = env.PF_REAL_ICLOUD_FILTER_FILE;
  const filter = filterJson ? parseJsonRequirement(filterJson, 'real_icloud_filter_json') : readJsonRequirement(filterFile, cwd, 'real_icloud_filter_file');
  let filterSignature = null;
  if (filter.value) {
    try {
      filterSignature = createIcloudFilterSignature(filter.value);
      requirements.push(requirement('normalized_filter_signature_created', true, 'Normalized filter signature was created.'));
    } catch (error) {
      requirements.push(requirement('normalized_filter_signature_created', false, error instanceof Error ? error.message : String(error)));
    }
  } else {
    requirements.push(requirement('normalized_filter_signature_created', false, filter.reason));
  }

  const downloadDir = env.PF_REAL_ICLOUD_DOWNLOAD_DIR;
  const downloadDirCheck = validateDirectoryPath(downloadDir, cwd, 'real_icloud_download_dir');
  requirements.push(requirement('download_directory_exists', downloadDirCheck.ok, downloadDirCheck.reason));

  const ledgerPath = env.PF_REAL_ICLOUD_DOWNLOAD_LEDGER_FILE;
  const ledgerCheck = validateWritableJsonPath(ledgerPath, cwd, 'real_icloud_download_ledger_file');
  requirements.push(requirement('ledger_file_path_is_safe', ledgerCheck.ok, ledgerCheck.reason));

  const redactionCheck = containsForbiddenValue({ authPath, filterJson, filterFile, downloadDir, ledgerPath }) === false;
  requirements.push(requirement('preflight_inputs_are_secret_safe', redactionCheck, 'Preflight inputs must not include Apple IDs, tokens, cookies, 2FA codes, or raw session paths.'));

  const blockingRequirements = requirements.filter((entry) => !entry.passed);
  return {
    proofStatus: blockingRequirements.length === 0 ? 'PASSED' : 'BLOCKED',
    requirements,
    filter_signature: filterSignature?.filter_signature ?? null,
    normalized_filter: filterSignature?.normalized ?? null,
    safe_paths: {
      auth_session_evidence_file_present: Boolean(authPath),
      filter_file_present: Boolean(filterFile),
      download_dir_present: Boolean(downloadDir),
      ledger_file_present: Boolean(ledgerPath),
    },
    block_reasons: blockingRequirements.map((entry) => `${entry.name}: ${entry.detail}`),
  };
}

function requirement(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

function resolvePath(inputPath, cwd) {
  if (!inputPath || typeof inputPath !== 'string') return null;
  return resolve(cwd, inputPath);
}

function readJsonRequirement(inputPath, cwd, label) {
  const resolved = resolvePath(inputPath, cwd);
  if (!resolved) return { value: null, reason: `${label} path is not configured` };
  if (!existsSync(resolved)) return { value: null, reason: `${label} does not exist` };
  try {
    return { value: JSON.parse(readFileSync(resolved, 'utf8')), reason: `${label} parsed` };
  } catch (error) {
    return { value: null, reason: `${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
}

function parseJsonRequirement(text, label) {
  if (!text) return { value: null, reason: `${label} is not configured` };
  try {
    return { value: JSON.parse(text), reason: `${label} parsed` };
  } catch (error) {
    return { value: null, reason: `${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
}

function validateDirectoryPath(inputPath, cwd, label) {
  const resolved = resolvePath(inputPath, cwd);
  if (!resolved) return { ok: false, reason: `${label} is not configured` };
  try {
    const stat = statSync(resolved);
    return { ok: stat.isDirectory(), reason: stat.isDirectory() ? `${label} exists` : `${label} is not a directory` };
  } catch {
    return { ok: false, reason: `${label} does not exist` };
  }
}

function validateWritableJsonPath(inputPath, cwd, label) {
  const resolved = resolvePath(inputPath, cwd);
  if (!resolved) return { ok: false, reason: `${label} is not configured` };
  if (!resolved.endsWith('.json')) return { ok: false, reason: `${label} must be a .json file` };
  if (existsSync(resolved)) {
    try { return { ok: statSync(resolved).isFile(), reason: statSync(resolved).isFile() ? `${label} exists as file` : `${label} exists but is not a file` }; } catch {}
  }
  return { ok: existsSync(dirname(resolved)), reason: existsSync(dirname(resolved)) ? `${label} parent directory exists` : `${label} parent directory does not exist` };
}

function containsForbiddenValue(value) {
  if (typeof value === 'string') return FORBIDDEN_VALUE.test(value);
  if (Array.isArray(value)) return value.some(containsForbiddenValue);
  if (value && typeof value === 'object') return Object.values(value).some(containsForbiddenValue);
  return false;
}
