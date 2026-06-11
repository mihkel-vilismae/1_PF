/**
 * Git ignore guard for local runtime proof evidence.
 *
 * Proof runners write timestamped JSON/log/archive artifacts under runtime_data/proofs.
 * Operators may upload those artifacts in evidence ZIPs, but they must not become tracked
 * repository files or dirty baseline noise.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const proofArtifacts = [
  'runtime_data/proofs/gps_fallback_2026-06-11T19-01-03-499Z.json',
  'runtime_data/proofs/address_display_2026-06-11T19-01-05-306Z.json',
  'runtime_data/proofs/proof-run-summary.json',
  'runtime_data/proofs/live_windows_scheduler_2026-06-11T19-01-15-854Z.log',
  'runtime_data/proofs/PF_login-v0.8.33-proof-results-20260611-220056.zip',
  'runtime_data/private_logs/icloudpd-auth-session.log',
  'test_runtime_data/proofs/e2e_local_photo_frame.json',
];

function checkIgnored(paths) {
  const result = spawnSync('git', ['check-ignore', '--stdin'], {
    input: `${paths.join('\n')}\n`,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim().split(/\r?\n/).filter(Boolean);
}

test('runtime proof evidence artifacts are explicitly ignored', () => {
  const ignored = checkIgnored(proofArtifacts);
  assert.deepEqual(ignored, proofArtifacts);
});
