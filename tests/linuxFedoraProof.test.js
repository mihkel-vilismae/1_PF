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
import { evaluateFedoraReadinessGate } from '../tools/linux-fedora-proof-lib.mjs';

test('Fedora readiness marks Raspberry-only gates as not Raspberry proven', () => {
  const gate = evaluateFedoraReadinessGate({ id: 'rpi', title: 'Raspberry display', proofKinds: ['raspberry_address_overlay_device_display'], raspberryOnly: true }, {});
  assert.equal(gate.gate_status, 'NOT_RASPBERRY_PROVEN');
  assert.equal(gate.proofs[0].proof_status, 'NOT_RASPBERRY_PROVEN');
});


import { evaluateFedoraExecutablePermissionRows, summarizeFedoraEnvPresence, FEDORA_WORKER_COMMANDS, FEDORA_READINESS_GATES } from '../tools/linux-fedora-proof-lib.mjs';

test('Fedora executable permission evaluation blocks missing or non-executable files', () => {
  const evalResult = evaluateFedoraExecutablePermissionRows([
    { relative_path: 'ok.sh', exists: true, executable_after: true },
    { relative_path: 'missing.sh', exists: false, executable_after: false },
    { relative_path: 'plain.mjs', exists: true, executable_after: false },
  ]);
  assert.equal(evalResult.proofStatus, 'BLOCKED');
  assert.deepEqual(evalResult.missing, ['missing.sh']);
  assert.deepEqual(evalResult.notExecutable, ['plain.mjs']);
});

test('Fedora env presence redacts secret/account-like values', () => {
  const rows = summarizeFedoraEnvPresence({ user: 'person@example.com', pw: 'secret', ICLOUDPD_COOKIE_DIR: '/tmp/cookies' });
  assert.equal(rows.find((row) => row.key === 'user').redacted_value, '[REDACTED_ACCOUNT]');
  assert.equal(rows.find((row) => row.key === 'pw').redacted_value, '[REDACTED]');
});

test('Fedora readiness gates include parity proof kinds', () => {
  const kinds = FEDORA_READINESS_GATES.flatMap((gate) => gate.proofKinds);
  assert.ok(kinds.includes('linux_fedora_executable_permissions'));
  assert.ok(kinds.includes('linux_fedora_icloudpd_preflight'));
  assert.ok(kinds.includes('linux_fedora_worker_command_inventory'));
  assert.ok(kinds.includes('linux_fedora_export_proof_artifacts'));
  assert.equal(FEDORA_WORKER_COMMANDS.length, 3);
});
