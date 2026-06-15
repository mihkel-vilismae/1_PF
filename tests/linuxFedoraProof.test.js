import test from 'node:test';
import assert from 'node:assert/strict';
import { detectFedoraLinuxTarget, FEDORA_NON_CLAIMS } from '../tools/linux-fedora-proof-lib.mjs';

test('Fedora target detection supports explicit rehearsal override', () => {
  const target = detectFedoraLinuxTarget({ env: { PF_LINUX_FEDORA_ASSUME_TARGET: 'true' }, platform: 'win32', arch: 'x64' });
  assert.equal(target.linux_like, true);
  assert.equal(target.fedora_like, true);
  assert.equal(target.explicit_override_used, true);
});

test('Fedora non-claims preserve Raspberry proof boundary', () => {
  assert.ok(FEDORA_NON_CLAIMS.some((claim) => claim.includes('Raspberry native image playback')));
  assert.ok(FEDORA_NON_CLAIMS.some((claim) => claim.includes('proof:raspberry-v1-readiness')));
});
import { evaluateProofOwnedWorkerSingletonLane, expectedFedoraCronRows, LINUX_FEDORA_WORKER_LANES } from '../tools/linux-fedora-proof-lib.mjs';

test('Fedora cron rows preserve the three worker lane schedule model', () => {
  const rows = expectedFedoraCronRows({ repoRoot: '/repo' });
  assert.equal(rows.length, 3);
  assert.ok(rows[0].startsWith('*/10'));
  assert.ok(rows[1].startsWith('* * * * *'));
  assert.ok(rows[2].startsWith('*/3'));
});

test('Fedora worker singleton rehearsal skips duplicates and recovers stale locks', () => {
  for (const lane of LINUX_FEDORA_WORKER_LANES) {
    const evidence = evaluateProofOwnedWorkerSingletonLane({ lane, nowMs: Date.parse('2026-01-01T00:00:00Z'), staleMs: 60000 });
    assert.equal(evidence.duplicate_invocation.accepted, false);
    assert.equal(evidence.stale_lock_recovery.accepted, true);
    assert.equal(evidence.pass, true);
  }
});
