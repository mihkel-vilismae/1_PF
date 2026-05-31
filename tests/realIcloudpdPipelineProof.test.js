/**
 * Tests real iCloudPD proof safety behavior.
 * Verifies the proof is opt-in and never substitutes mock download success.
 * Does not contact iCloudPD, Apple, or a live backend.
 * Protects the NEW AUTH provider boundary from accidental proof overclaims.
 * Runs through the standard Node test runner.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRealIcloudpdRoutePlan, isRealIcloudpdProofEnabled, runRealIcloudpdPipelineProof } from '../tools/real-icloudpd-pipeline-proof-lib.mjs';

/** Verifies the proof runner is blocked unless explicitly enabled. */
test('real iCloudPD proof is blocked by default and uses no mock download route', async () => { const envelope = await runRealIcloudpdPipelineProof({ baseUrl: 'http://127.0.0.1:8787', recentCount: 10, metadata: { version: '0.7.34', gitCommit: 'test' }, env: {} }); assert.equal(envelope.proof_status, 'BLOCKED'); assert.equal(envelope.evidence.mock_download_route_used, false); assert.equal(envelope.evidence.real_download_route_required, '/api/runtime/download/real-run'); });

/** Verifies the route plan uses the real route and preserves stage order. */
test('real iCloudPD route plan preserves existing backend stage order', () => { const routePlan = buildRealIcloudpdRoutePlan(3); assert.deepEqual(routePlan.map((route) => route.key), ['auth_status', 'real_download', 'index', 'gps', 'geocode', 'queue_prepare', 'playback_select']); assert.equal(routePlan[1].path, '/api/runtime/download/real-run'); assert.equal(routePlan.some((route) => route.path === '/api/runtime/download/run'), false); });

/** Verifies only the exact string true enables real proof execution. */
test('real iCloudPD proof opt-in flag is exact', () => { assert.equal(isRealIcloudpdProofEnabled({ PF_PROOF_ENABLE_REAL_ICLOUDPD: 'true' }), true); assert.equal(isRealIcloudpdProofEnabled({ PF_PROOF_ENABLE_REAL_ICLOUDPD: '1' }), false); assert.equal(isRealIcloudpdProofEnabled({}), false); });
