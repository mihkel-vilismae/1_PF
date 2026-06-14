import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateIcloudpdPreflight, summarizeConfigPresence, runIcloudpdVersionCandidates } from '../tools/raspberry-icloudpd-preflight-lib.mjs';

test('iCloudPD preflight blocks when required config is missing', () => {
  const evaluation = evaluateIcloudpdPreflight({
    target: { raspberry_like: true, explicit_override_used: false },
    config: summarizeConfigPresence({}),
    attempts: [{ command: 'icloudpd', args: ['--version'], exit_code: 0, timed_out: false, usable: true }],
  });
  assert.equal(evaluation.proofStatus, 'BLOCKED');
  assert.deepEqual(evaluation.missingConfig, ['user', 'pw', 'ICLOUDPD_COOKIE_DIR']);
});

test('iCloudPD preflight can pass with Raspberry target, config, and version command', () => {
  const evaluation = evaluateIcloudpdPreflight({
    target: { raspberry_like: true, explicit_override_used: false },
    config: summarizeConfigPresence({ user: 'present', pw: 'secret', ICLOUDPD_COOKIE_DIR: 'runtime_data/icloudpd_cookies' }),
    attempts: [{ command: 'icloudpd', args: ['--version'], exit_code: 0, timed_out: false, usable: true }],
  });
  assert.equal(evaluation.proofStatus, 'PASSED');
});

test('iCloudPD version candidates stop after first usable command', async () => {
  const calls = [];
  const attempts = await runIcloudpdVersionCandidates({
    commandRunner: async (command, args) => {
      calls.push(command);
      return { command, args, exitCode: command === 'python3' ? 0 : 1, timedOut: false, stdout: 'icloudpd 1.0', stderr: '' };
    },
  });
  assert.deepEqual(calls, ['icloudpd', 'python3']);
  assert.equal(attempts.at(-1).usable, true);
});
