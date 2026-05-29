/*
 * Verifies that the reusable logging standard contract remains discoverable.
 * The contract is documentation-only, but it must keep the core implementation
 * guarantees and source-evidence links that make it portable to other projects.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CONTRACT_PATH = 'docs/20_architecture_and_specs/reference/LOGGING_STANDARD_CONTRACT.md';

/*
 * Reads the checked-in logging contract so section assertions stay focused on
 * the documented reusable standard rather than runtime implementation details.
 */
async function readContract() {
  return readFile(CONTRACT_PATH, 'utf8');
}

test('logging standard contract documents the reusable logging guarantees', async () => {
  const contract = await readContract();

  for (const heading of [
    '## 1. Purpose and scope',
    '## 3. Mandatory logging guarantees',
    '## 4. Log categories and channels',
    '## 6. Request/response correlation requirements',
    '## 7. Redaction and security rules',
    '## 8. Terminal-like UI requirements',
    '## 11. Test checklist',
    '## 12. Migration checklist for another project',
  ]) {
    assert.match(contract, new RegExp(escapeRegExp(heading)));
  }

  for (const requiredTerm of [
    'full_log.log',
    'full_log_verbose.log',
    'logindebug.log',
    'copy all',
    'clear',
    'expand row',
    'Test/Real separation',
    'X-Dashboard-Request-Id',
  ]) {
    assert.match(contract, new RegExp(escapeRegExp(requiredTerm)));
  }
});

test('logging standard contract links to repo evidence used by the extraction', async () => {
  const contract = await readContract();

  for (const evidencePath of [
    'server/logging/projectLogger.ts',
    'server/index.ts',
    'server/auth/icloudpdRawStdioLog.ts',
    'server/runtimeModeEnv.ts',
    'dashboard/views/osPlaybackView.ts',
    'tests/projectLogger.test.js',
    'tests/initApi.step1.test.js',
  ]) {
    assert.match(contract, new RegExp(escapeRegExp(evidencePath)));
  }
});

/*
 * Escapes literal strings before they are used as regular-expression patterns.
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
