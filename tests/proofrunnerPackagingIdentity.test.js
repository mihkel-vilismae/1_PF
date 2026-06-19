import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeArchiveRootNames, expectedRepoArchiveRoot } from '../tools/proofrunner-packaging-identity-lib.mjs';

test('expected repo archive root includes current version and full_git marker', () => {
  assert.equal(expectedRepoArchiveRoot({ version: '0.8.233', slug: 'abc' }), 'PF_login--v0.8.233--abc-full_git');
});

test('archive root identity accepts current version root', () => {
  const result = analyzeArchiveRootNames(['PF_login--v0.8.233--proof-summary-docs-registry-hotfix-full_git'], { version: '0.8.233' });
  assert.equal(result.status, 'PASSED');
});

test('archive root identity rejects stale v0.8.199 root', () => {
  const result = analyzeArchiveRootNames(['PF_login--v0.8.199--debug-page-keybook-skill-full_git'], { version: '0.8.233' });
  assert.equal(result.status, 'FAILED');
  assert.equal(result.checks.find((check) => check.name === 'no_stale_v0_8_199_root').passed, false);
});
