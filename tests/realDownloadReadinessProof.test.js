import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRealDownloadReadinessProof } from '../tools/real-download-readiness-proof-lib.mjs';

const metadata = { version: 'test', gitCommit: 'test' };

test('real download readiness blocks without explicit opt-in', () => {
  const envelope = buildRealDownloadReadinessProof({ metadata, env: {} });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.evidence.checks.find((check) => check.name === 'real_download_opt_in_set').passed, false);
  assert.equal(envelope.evidence.readiness.mock_download_route_used, false);
});

test('real download readiness passes configured opt-in without backend calls', () => {
  const envelope = buildRealDownloadReadinessProof({ metadata, env: { PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION: 'true', PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR: '/tmp/downloads' } });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.checks.every((check) => check.passed), true);
  const routePaths = envelope.evidence.readiness.route_plan.map((route) => route.path);
  assert.equal(routePaths.filter((path) => path === '/api/runtime/download/real-run').length, 2);
  assert.equal(routePaths.some((path) => path.includes('/mock')), false);
  assert.match(envelope.known_limitations[0], /does not call/);
});


test('real download readiness bridges iCloud readiness and download directory resolution', () => {
  const envelope = buildRealDownloadReadinessProof({ metadata, env: {} });
  const bridge = envelope.evidence.readiness.config_bridge;
  assert.deepEqual(bridge.depends_on_proofs, [
    'npm run proof:real-icloudpd-readiness',
    'npm run proof:real-icloudpd',
    'npm run proof:real-download-continuation',
  ]);
  assert.equal(bridge.required_env_groups.find((entry) => entry.group === 'download_directory').fallback, 'backend /api/init/verify-env DOWNLOAD_DIR');
  assert.match(bridge.secret_boundary, /must not emit/);
});

test('real download readiness does not leak explicit download directory path', () => {
  const envelope = buildRealDownloadReadinessProof({ metadata, env: { PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION: 'true', PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR: '/home/sensitive/downloads' } });
  const serialized = JSON.stringify(envelope);
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(serialized.includes('/home/sensitive/downloads'), false);
  assert.equal(envelope.evidence.readiness.download_directory_resolution, 'explicit_proof_env');
});
