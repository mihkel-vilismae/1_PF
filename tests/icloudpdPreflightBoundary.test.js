import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildRaspberryIcloudpdPreflightProof, summarizeConfigPresence } from '../tools/raspberry-icloudpd-preflight-lib.mjs';

test('iCloudPD preflight summarizes config without leaking values', () => {
  const config = summarizeConfigPresence({ user: 'person@example.com', pw: 'secret-password', ICLOUDPD_COOKIE_DIR: '/home/private/cookies' });
  assert.deepEqual(config.map((entry) => entry.key), ['user', 'pw', 'ICLOUDPD_COOKIE_DIR']);
  assert.deepEqual(config.map((entry) => entry.present), [true, true, true]);
  assert.equal(JSON.stringify(config).includes('person@example.com'), false);
  assert.equal(JSON.stringify(config).includes('secret-password'), false);
  assert.equal(JSON.stringify(config).includes('/home/private/cookies'), false);
});

test('iCloudPD preflight proof redacts secret-like command output and blocks explicit target override runs', async () => {
  const envelope = await buildRaspberryIcloudpdPreflightProof({
    metadata: { version: 'test', gitCommit: 'test' },
    env: { user: 'person@example.com', pw: 'secret-password', ICLOUDPD_COOKIE_DIR: '/home/private/cookies', PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET: 'true' },
    commandRunner: async () => ({ exitCode: 0, timedOut: false, stdout: 'icloudpd 1.0 user=person@example.com token=abc123', stderr: '', args: [] }),
    cwd: process.cwd(),
  });
  const serialized = JSON.stringify(envelope);
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(serialized, /\[REDACTED\]/);
  assert.doesNotMatch(serialized, /person@example.com/);
  assert.doesNotMatch(serialized, /secret-password/);
  assert.match(serialized, /override runs cannot produce PASS/);
  assert.match(serialized, /does not perform iCloud login/);
});

test('iCloudPD secret boundary OpenSpec names allowed and forbidden evidence', () => {
  const doc = readFileSync('docs/20_architecture_and_specs/openspec/icloudpd_preflight_secret_boundary_openspec.md', 'utf8');
  assert.match(doc, /Allowed evidence/);
  assert.match(doc, /Forbidden evidence/);
  assert.match(doc, /must produce `BLOCKED`, not a false pass/);
});
