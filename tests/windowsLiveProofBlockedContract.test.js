import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeWindowsLiveProofBlockedContract } from '../tools/windows-live-proof-blocked-contract-lib.mjs';

test('Windows live proof wrappers convert missing operator input into honest BLOCKED contract', () => {
  const result = analyzeWindowsLiveProofBlockedContract();
  assert.equal(result.status, 'PASSED');
  assert.equal(result.failures.length, 0);
  assert.equal(result.wrappers_checked, 4);
});
