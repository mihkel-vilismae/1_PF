import test from 'node:test';
import assert from 'node:assert/strict';
import { validateIcloudpdSessionPathConfig } from '../tools/icloudpd-session-path-validator-lib.mjs';

test('iCloudPD session path validator passes configured path without returning secret values', () => {
  const result = validateIcloudpdSessionPathConfig({ envText: 'user=person@example.com\npw=secret\nICLOUDPD_COOKIE_DIR=runtime_data/icloudpd_cookies\nDOWNLOAD_DIR=runtime_data/downloads\n' });
  assert.equal(result.proof_status, 'PASSED');
  assert.equal(result.session_boundary.value_redacted, '[REDACTED_PATH]');
  assert.equal(result.secret_policy.raw_env_values_returned, false);
  assert.deepEqual(result.configured_keys.session_key, 'ICLOUDPD_COOKIE_DIR');
});

test('iCloudPD session path validator blocks safely when env/session path is absent', () => {
  const result = validateIcloudpdSessionPathConfig({ envText: '' });
  assert.equal(result.proof_status, 'BLOCKED');
});
