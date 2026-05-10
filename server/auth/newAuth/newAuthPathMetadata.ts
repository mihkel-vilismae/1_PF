/*
 * Handles NEW AUTH path discovery, session evidence, and safe filesystem metadata.
 * This module lists paths and summary metadata only; it never exposes session file
 * contents or raw credential material.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EMPTY_SESSION_EVIDENCE, MAX_SESSION_CHILDREN, SESSION_FILE_HINT_PATTERN } from './newAuthConstants.js';
import type { NewAuthContext, NewAuthEnvValues, NewAuthIcloudpdConfig, NewAuthPathMetadata, NewAuthSessionEvidence } from './newAuthTypes.js';
import { normalizeNewAuthPath, sanitizePathForDisplay } from './newAuthSanitization.js';

/*
 * Collects safe evidence that an iCloudPD session may exist locally.
 */
export function collectNewAuthSessionEvidence(config: NewAuthIcloudpdConfig): NewAuthSessionEvidence {
  if (!config.cookieDir) return EMPTY_SESSION_EVIDENCE;
  const absoluteCookieDir = resolveCandidatePath(config.cookieDir);
  if (!existsSync(absoluteCookieDir)) return EMPTY_SESSION_EVIDENCE;

  try {
    const entries = readdirSync(absoluteCookieDir, { withFileTypes: true });
    let sessionFileCount = 0;
    let latestModifiedMs: number | null = null;
    for (const entry of entries) {
      if (!entry.isFile() || !SESSION_FILE_HINT_PATTERN.test(entry.name)) continue;
      const entryPath = path.join(absoluteCookieDir, entry.name);
      const stats = statSync(entryPath);
      sessionFileCount += 1;
      latestModifiedMs = Math.max(latestModifiedMs ?? 0, stats.mtimeMs);
    }
    return {
      hasSessionFiles: sessionFileCount > 0,
      sessionFileCount,
      latestModifiedMs,
      latestModifiedAt: latestModifiedMs ? new Date(latestModifiedMs).toISOString() : null,
    };
  } catch {
    return EMPTY_SESSION_EVIDENCE;
  }
}

/*
 * Compares session evidence before and after provider execution.
 */
export function hasFreshNewAuthSessionEvidence(before: NewAuthSessionEvidence, after: NewAuthSessionEvidence): boolean {
  if (!after.hasSessionFiles) return false;
  if (!before.hasSessionFiles) return true;
  if (after.sessionFileCount > before.sessionFileCount) return true;
  if (after.latestModifiedMs && before.latestModifiedMs && after.latestModifiedMs > before.latestModifiedMs) return true;
  return false;
}

/*
 * Restricts logout cleanup to safe, expected session/cache directories.
 */
export function isSafeSessionCleanupPath(candidate: string): boolean {
  const normalized = path.resolve(candidate);
  const root = path.parse(normalized).root;
  if (normalized === root) return false;
  if (normalized === os.homedir()) return false;
  if (normalized === process.cwd()) return false;
  const basename = path.basename(normalized).toLowerCase();
  return basename.includes('icloud') || basename.includes('auth') || basename.includes('session') || basename.includes('cookie');
}

/*
 * Builds the safe set of NEW AUTH paths that may be shown in the dashboard.
 */
export function getNewAuthPathCandidates(context: NewAuthContext): NewAuthPathMetadata[] {
  const env = context.envValues ?? {};
  const candidates: Array<{ label: string; value: unknown; includeChildren?: boolean }> = [
    { label: 'Configured session directory', value: env.ICLOUDPD_COOKIE_DIR, includeChildren: true },
    { label: 'Configured download directory', value: env.ICLOUD_DOWNLOAD_DIR },
    { label: 'Default iCloudPD cookie directory', value: path.join(os.homedir(), '.cache', 'icloudpd'), includeChildren: true },
    { label: 'Runtime data directory', value: 'runtime_data' },
    { label: 'Runtime iCloudPD cookies directory', value: path.join('runtime_data', 'icloudpd_cookies'), includeChildren: true },
    { label: 'Generated test data directory', value: 'generated_test_data' },
  ];

  return candidates
    .map((candidate) => {
      const normalized = normalizeNewAuthPath(candidate.value);
      if (!normalized) return null;
      return buildPathMetadata(candidate.label, sanitizePathForDisplay(normalized), resolveCandidatePath(normalized), candidate.includeChildren === true);
    })
    .filter((entry): entry is NewAuthPathMetadata => Boolean(entry))
    .concat(buildEnvPresenceMetadata(env));
}

/*
 * Flattens path metadata so tests and diagnostics can inspect nested entries.
 */
export function flattenPathMetadata(paths: NewAuthPathMetadata[]): NewAuthPathMetadata[] {
  return paths.flatMap((entry) => [entry, ...(entry.children ? flattenPathMetadata(entry.children) : [])]);
}

/*
 * Converts selected environment values into presence-only metadata rows.
 */
function buildEnvPresenceMetadata(envValues: NewAuthEnvValues): NewAuthPathMetadata[] {
  const entries: NewAuthPathMetadata[] = [];
  for (const key of ['user', 'pw', 'APPLE_ID', 'APPLE_PASSWORD']) {
    if (Object.prototype.hasOwnProperty.call(envValues, key)) {
      entries.push({ label: `Env ${key}`, path: envValues[key] ? '[SET]' : '[EMPTY]', exists: Boolean(envValues[key]), type: 'unknown', contentsShown: false });
    }
  }
  return entries;
}

/*
 * Resolves relative candidate paths against the repository working directory.
 */
function resolveCandidatePath(candidate: string): string {
  if (path.isAbsolute(candidate)) return candidate;
  return path.resolve(candidate);
}

/*
 * Builds a single safe filesystem metadata record for a path candidate.
 */
function buildPathMetadata(label: string, displayPath: string, absolutePath: string | null, includeChildren = false): NewAuthPathMetadata {
  if (!absolutePath || !existsSync(absolutePath)) {
    return {
      label,
      path: displayPath,
      exists: false,
      type: 'missing',
      contentsShown: false,
    };
  }

  try {
    const stats = statSync(absolutePath);
    const type = stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : 'unknown';
    return {
      label,
      path: displayPath,
      exists: true,
      type,
      sizeBytes: stats.isFile() ? stats.size : undefined,
      lastModified: stats.mtime.toISOString(),
      contentsShown: false,
      children: includeChildren && stats.isDirectory() ? readSafeChildren(absolutePath) : undefined,
    };
  } catch {
    return {
      label,
      path: displayPath,
      exists: false,
      type: 'unknown',
      contentsShown: false,
    };
  }
}

/*
 * Lists safe child metadata without exposing file contents.
 */
function readSafeChildren(directoryPath: string): NewAuthPathMetadata[] {
  try {
    return readdirSync(directoryPath, { withFileTypes: true })
      .slice(0, MAX_SESSION_CHILDREN)
      .map((entry) => buildPathMetadata(entry.name, sanitizePathForDisplay(path.join(directoryPath, entry.name)), path.join(directoryPath, entry.name), false));
  } catch {
    return [];
  }
}
