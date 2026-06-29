// Resolves terminal Demo Mode runtime configuration and path boundaries.
// Keep this file focused so future slices can stay below the 300 LOC target.

import path from 'node:path';

export function resolveAgainstRepoRoot(repoRoot: string, value: string): string {
  return path.resolve(repoRoot, value);
}

export function normalizeForCompare(value: string): string {
  return path.resolve(value).replace(/\\/g, '/').toLowerCase();
}

export function pathsOverlap(left: string, right: string): boolean {
  const a = normalizeForCompare(left);
  const b = normalizeForCompare(right);
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

export function readEnvPath(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}
