// Tests the real download continuation proof contract without calling iCloudPD.
// The proof is opt-in for live provider runs, so unit tests exercise route plans,
// blocked behavior, and deterministic snapshot comparison only.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRealDownloadContinuationRoutePlan,
  compareContinuationSnapshots,
  resolveDownloadDirectory,
  runRealDownloadContinuationProof,
} from '../tools/real-download-continuation-proof-lib.mjs';

test('real download continuation proof is blocked by default and avoids mock route', async () => {
  const envelope = await runRealDownloadContinuationProof({
    baseUrl: 'http://127.0.0.1:8787',
    recentCount: 10,
    metadata: { version: '0.7.34', gitCommit: 'test' },
    env: {},
  });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.evidence.mock_download_route_used, false);
});

test('real download continuation route plan calls real-run twice and never mock download', () => {
  const plan = buildRealDownloadContinuationRoutePlan(5);
  assert.deepEqual(plan.map((route) => route.key), ['verify_env', 'auth_status', 'real_download_first_run', 'real_download_second_run']);
  assert.equal(plan.filter((route) => route.path === '/api/runtime/download/real-run').length, 2);
  assert.equal(plan.some((route) => route.path === '/api/runtime/download/run'), false);
});

test('download directory resolves from explicit env before verify-env payload', () => {
  const payload = { checks: [{ key: 'DOWNLOAD_DIR', details: { absolutePath: '/from/verify-env' } }] };
  assert.equal(resolveDownloadDirectory({ verifyEnvPayload: payload, env: { PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR: '/explicit' } }), '/explicit');
  assert.equal(resolveDownloadDirectory({ verifyEnvPayload: payload, env: {} }), '/from/verify-env');
});

test('snapshot comparison fails when second run adds duplicate content', () => {
  const before = [{ relativePath: 'a.jpg', sha1: 'hash-a', sizeBytes: 1 }];
  const afterFirst = [...before, { relativePath: 'b.jpg', sha1: 'hash-b', sizeBytes: 1 }];
  const afterSecond = [...afterFirst, { relativePath: 'b-copy.jpg', sha1: 'hash-b', sizeBytes: 1 }];
  const comparison = compareContinuationSnapshots({ before, afterFirst, afterSecond });
  assert.equal(comparison.continuationSafe, false);
  assert.equal(comparison.duplicateContentAddedOnSecondRun.length, 1);
});

test('snapshot comparison passes when second run adds no duplicate content', () => {
  const before = [{ relativePath: 'a.jpg', sha1: 'hash-a', sizeBytes: 1 }];
  const afterFirst = [...before, { relativePath: 'b.jpg', sha1: 'hash-b', sizeBytes: 1 }];
  const afterSecond = [...afterFirst, { relativePath: 'c.jpg', sha1: 'hash-c', sizeBytes: 1 }];
  const comparison = compareContinuationSnapshots({ before, afterFirst, afterSecond });
  assert.equal(comparison.continuationSafe, true);
  assert.equal(comparison.uniqueContentAddedOnSecondRun.length, 1);
});
