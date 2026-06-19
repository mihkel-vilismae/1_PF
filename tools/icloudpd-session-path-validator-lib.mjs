/** Secret-safe iCloudPD session path validator. */
import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SECRET_KEYS = new Set(['user', 'pw', 'password', 'APPLE_ID', 'APPLE_PASSWORD', 'ICLOUDPD_PASSWORD', 'TOKEN', 'COOKIE']);
export const SESSION_PATH_KEYS = Object.freeze(['ICLOUDPD_COOKIE_DIR', 'TEST_ICLOUDPD_COOKIE_DIR']);
export const DOWNLOAD_PATH_KEYS = Object.freeze(['DOWNLOAD_DIR', 'PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR']);

export function parseEnvText(text = '') {
  const result = {};
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    result[key] = value;
  }
  return result;
}

export function discoverEnvCandidates(repoRoot = process.cwd()) {
  return [resolve(repoRoot, '.env'), resolve(dirname(resolve(repoRoot)), '.env')];
}

function summarizePath(value, repoRoot) {
  if (!value) return { configured: false, exists: false, path_class: 'missing' };
  const absolute = resolve(repoRoot, value);
  let exists = false;
  let isDirectory = false;
  let fileCount = null;
  let newestMtime = null;
  try {
    const stat = statSync(absolute);
    exists = true;
    isDirectory = stat.isDirectory();
    if (isDirectory) {
      const entries = readdirSync(absolute, { withFileTypes: true });
      fileCount = entries.length;
      newestMtime = stat.mtime.toISOString();
    }
  } catch {}
  return {
    configured: true,
    exists,
    is_directory: isDirectory,
    path_class: value.includes('runtime_data') ? 'repo_runtime_data' : value.startsWith('.') ? 'relative' : 'operator_configured',
    file_count: fileCount,
    newest_mtime: newestMtime,
    value_redacted: '[REDACTED_PATH]',
  };
}

export function validateIcloudpdSessionPathConfig({ repoRoot = process.cwd(), envText = null } = {}) {
  let envSource = 'provided_text';
  let text = envText;
  if (text === null) {
    const found = discoverEnvCandidates(repoRoot).find((candidate) => existsSync(candidate));
    envSource = found ? (found.endsWith('/.env') || found.endsWith('\\.env') ? 'repo_or_parent_env' : 'unknown') : 'missing';
    text = found ? readFileSync(found, 'utf8') : '';
  }
  const env = parseEnvText(text);
  const sessionKey = SESSION_PATH_KEYS.find((key) => env[key]);
  const downloadKey = DOWNLOAD_PATH_KEYS.find((key) => env[key]);
  const presentSecretKeys = Object.keys(env).filter((key) => SECRET_KEYS.has(key) || /password|token|secret|cookie/i.test(key) && !SESSION_PATH_KEYS.includes(key));
  const session = summarizePath(sessionKey ? env[sessionKey] : '', repoRoot);
  const download = summarizePath(downloadKey ? env[downloadKey] : '', repoRoot);
  const checks = [
    { name: 'env_present_or_blocked', passed: text.length > 0, status_if_failed: 'BLOCKED' },
    { name: 'session_path_configured', passed: Boolean(sessionKey), status_if_failed: 'BLOCKED' },
    { name: 'download_path_optional', passed: true },
    { name: 'secrets_not_returned', passed: true, secret_keys_present_but_not_values: presentSecretKeys.sort() },
  ];
  const hardFailures = checks.filter((check) => !check.passed && check.status_if_failed !== 'BLOCKED');
  const blockers = checks.filter((check) => !check.passed && check.status_if_failed === 'BLOCKED');
  return {
    proof_status: hardFailures.length ? 'FAILED' : blockers.length ? 'BLOCKED' : 'PASSED',
    env_source: envSource,
    configured_keys: { session_key: sessionKey ?? null, download_key: downloadKey ?? null },
    session_boundary: session,
    download_boundary: download,
    checks,
    secret_policy: { raw_env_values_returned: false, secret_keys_may_exist_but_values_redacted: true },
  };
}
