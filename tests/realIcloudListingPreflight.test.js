import test from 'node:test';
import assert from 'node:assert/strict';
import { runRealIcloudListingPreflight } from '../tools/real-icloud-listing-preflight-lib.mjs';

test('real iCloud listing preflight blocks safely by default', () => {
  const result = runRealIcloudListingPreflight({ env: {}, envText: '' });
  assert.equal(result.proof_status, 'BLOCKED');
  assert.equal(result.safety.downloads_performed, false);
  assert.equal(result.safety.secrets_collected, false);
});

test('real iCloud listing preflight can pass only with explicit enable and safe session path config', () => {
  const env = { PF_PROOF_ENABLE_REAL_ICLOUD_LISTING_PREFLIGHT: 'true' };
  const envText = 'ICLOUDPD_COOKIE_DIR=runtime_data/icloudpd_cookies\nDOWNLOAD_DIR=runtime_data/downloads\n';
  const result = runRealIcloudListingPreflight({ env, envText });
  assert.equal(result.proof_status, 'PASSED');
  assert.equal(result.command_plan.download_allowed, false);
});

test('real iCloud listing preflight rejects download allowance', () => {
  const env = { PF_PROOF_ENABLE_REAL_ICLOUD_LISTING_PREFLIGHT: 'true', PF_REAL_ICLOUD_LISTING_ALLOW_DOWNLOAD: 'true' };
  const envText = 'ICLOUDPD_COOKIE_DIR=runtime_data/icloudpd_cookies\n';
  const result = runRealIcloudListingPreflight({ env, envText });
  assert.equal(result.proof_status, 'BLOCKED');
});
