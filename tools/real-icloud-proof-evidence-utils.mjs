import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
export const TRUE_VALUES = new Set(['1', 'true', 'yes', 'y']);
export const SECRET_RE = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|password|passwd|pwd|token|cookie|2fa|two.?factor|apple[_-]?id|session_path|icloud\.com)/i;
export function isTruthy(value) { return TRUE_VALUES.has(String(value ?? '').toLowerCase()); }
export function readJsonFile(path, { cwd = process.cwd() } = {}) {
  if (!path) return { value: null, reason: 'path is not configured' };
  const resolved = resolve(cwd, path);
  if (!existsSync(resolved)) return { value: null, reason: 'file does not exist', resolved };
  try { return { value: JSON.parse(readFileSync(resolved, 'utf8')), reason: 'file parsed', resolved }; }
  catch (error) { return { value: null, reason: `file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`, resolved }; }
}
export function requirement(name, passed, detail) { return { name, passed: Boolean(passed), detail }; }
export function statusFromRequirements(requirements) { return requirements.every((r) => r.passed) ? 'PASSED' : 'BLOCKED'; }
export function blockReasons(requirements) { return requirements.filter((r) => !r.passed).map((r) => `${r.name}: ${r.detail}`); }
const SAFE_SHA256_VALUE_RE = /sha256:[a-f0-9]{64}/gi;
export function hasSecretLikeText(value) {
  return SECRET_RE.test(JSON.stringify(value ?? '').replace(SAFE_SHA256_VALUE_RE, 'sha256:<safe-hash-redacted>'));
}
export function directoryRequirement(inputPath, label, { cwd = process.cwd() } = {}) {
  if (!inputPath) return requirement(`${label}_configured`, false, `${label} is not configured`);
  const resolved = resolve(cwd, inputPath);
  try { const stat = statSync(resolved); return requirement(`${label}_exists`, stat.isDirectory(), stat.isDirectory() ? `${label} exists` : `${label} is not a directory`); }
  catch { return requirement(`${label}_exists`, false, `${label} does not exist`); }
}
