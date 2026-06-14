import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAddressOverlayEvidenceTemplate, evaluateAddressOverlayEvidence } from '../tools/raspberry-address-overlay-device-display-lib.mjs';

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


test('address overlay evidence template defaults to non-claiming false fields', () => {
  const template = buildAddressOverlayEvidenceTemplate();
  assert.equal(template.native_display_path_observed, false);
  assert.equal(template.address_text_present, false);
  assert.equal(template.overlay_rendered_on_device, false);
  assert.equal(template.operator_observed, false);
  assert.match(template.operator_note, /Set all required boolean fields to true only after observing/);
});
