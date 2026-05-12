/*
 * Verifies that browser-facing dashboard code sends backend calls through apiClient.
 * The shared client is the only frontend layer allowed to call fetch directly.
 * This keeps request/response transit logging consistent for operator-visible calls.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dashboardRoot = path.join(repoRoot, 'dashboard');
const allowedRawFetchFiles = new Set([
  path.normalize(path.join(dashboardRoot, 'services', 'apiClient.ts')),
]);

test('frontend backend calls do not bypass the shared api client', () => {
  const rawFetchFiles = collectSourceFiles(dashboardRoot)
    .filter((filePath) => !allowedRawFetchFiles.has(path.normalize(filePath)))
    .filter((filePath) => /\bfetch\s*\(/.test(fs.readFileSync(filePath, 'utf8')));

  assert.deepEqual(
    rawFetchFiles.map((filePath) => path.relative(repoRoot, filePath)).sort(),
    [],
    'Only dashboard/services/apiClient.ts may call fetch directly so transit logging remains centralized.',
  );
});

function collectSourceFiles(rootPath) {
  // Walks frontend source files without following generated folders or dependencies.
  const files = [];
  for (const entry of fs.readdirSync(rootPath, { withFileTypes: true })) {
    const fullPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      files.push(...collectSourceFiles(fullPath));
      continue;
    }
    if (/\.(ts|js|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}
