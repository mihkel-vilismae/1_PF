import test from 'node:test';
import assert from 'node:assert/strict';
import { readAndAnalyzeProviderProofEnvTemplate, analyzeProviderProofEnvTemplate } from '../tools/provider-proof-env-template-lib.mjs';

test('provider proof env template includes required keys and safe defaults', () => {
  const analysis = readAndAnalyzeProviderProofEnvTemplate();
  assert.equal(analysis.required_keys.every((entry) => entry.present), true);
  assert.equal(analysis.opt_in_defaults_safe.every((entry) => entry.safe), true);
  assert.equal(analysis.no_secret_values, true);
});

test('provider proof env template analyzer catches filled secret values', () => {
  const analysis = analyzeProviderProofEnvTemplate('PF_PROOF_ENABLE_REAL_ICLOUDPD=false\nuser=someone@example.test\npw=secret\n');
  assert.equal(analysis.no_secret_values, false);
  assert.ok(analysis.secret_value_findings.length >= 2);
});
