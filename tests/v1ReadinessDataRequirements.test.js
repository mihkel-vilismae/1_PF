import assert from 'node:assert/strict';
import test from 'node:test';
import { buildV1ReadinessLiveDataRequirements, evaluateRaspberryV1Readiness } from '../tools/raspberry-v1-readiness-lib.mjs';

test('v1 readiness data requirements list live proof kinds and separate local pre-pass', () => {
  const requirements = buildV1ReadinessLiveDataRequirements();
  assert.equal(requirements.live_data_status, 'NOT_ENOUGH_LIVE_PROOF_DATA');
  assert.equal(requirements.proof_artifact_directory, 'runtime_data/proofs');
  assert.ok(requirements.required_proof_kinds.includes('real_icloudpd_pipeline'));
  assert.ok(requirements.required_proof_kinds.includes('raspberry_screen_worker_non_blocking'));
  assert.match(requirements.local_prepass_policy, /do not replace Raspberry target proof artifacts/);
});

test('v1 readiness remains blocked without live proof artifact index', () => {
  const readiness = evaluateRaspberryV1Readiness({ latestByKind: {} });
  assert.equal(readiness.proofStatus, 'BLOCKED');
  assert.equal(readiness.summary.required_passed_count, 0);
  assert.ok(readiness.blocking_gate_ids.includes('real_icloud_media_source'));
});
