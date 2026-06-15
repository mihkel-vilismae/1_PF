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
