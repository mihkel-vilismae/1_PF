import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAddressOverlayEvidence } from '../tools/raspberry-address-overlay-device-display-lib.mjs';

test('address overlay proof passes only with all required observed fields on Raspberry', () => {
  const loadedEvidence = { source: 'injected', load_error: null, data: {
    native_display_path_observed: true,
    address_text_present: true,
    overlay_rendered_on_device: true,
    operator_observed: true,
  } };
  assert.equal(evaluateAddressOverlayEvidence({ target: { raspberry_like: true }, loadedEvidence }).proofStatus, 'PASSED');
  assert.equal(evaluateAddressOverlayEvidence({ target: { raspberry_like: false }, loadedEvidence }).proofStatus, 'BLOCKED');
});

test('address overlay proof fails incomplete supplied evidence instead of inventing proof', () => {
  const evaluation = evaluateAddressOverlayEvidence({ target: { raspberry_like: true }, loadedEvidence: { source: 'injected', load_error: null, data: { address_text_present: true } } });
  assert.equal(evaluation.proofStatus, 'FAILED');
  assert.match(evaluation.failedReasons.join('\n'), /overlay/);
});
