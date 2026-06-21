import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAddressOverlayEvidenceTemplate,
  evaluateAddressOverlayEvidence,
  validateAddressOverlayVisualEvidence,
} from '../tools/raspberry-address-overlay-device-display-lib.mjs';

const VALID_SHA = 'a'.repeat(64);

function validEvidence(overrides = {}) {
  const marker = overrides.overlay_marker ?? 'PF_ADDR_20260621_194034';
  return {
    overlay_marker: marker,
    native_display_path_observed: true,
    address_text_present: true,
    overlay_rendered_on_device: true,
    operator_observed: true,
    marker_visible_in_device_evidence: true,
    visual_evidence: {
      kind: 'operator_photo',
      artifact_sha256: VALID_SHA,
      artifact_path_redacted: true,
      expected_marker: marker,
      observed_marker: marker,
      marker_validation: 'matched',
      operator_confirmation: true,
    },
    ...overrides,
  };
}

test('address overlay proof passes only with all required observed fields and marker evidence on Raspberry', () => {
  const loadedEvidence = { source: 'injected', load_error: null, data: validEvidence() };
  assert.equal(evaluateAddressOverlayEvidence({ target: { raspberry_like: true }, loadedEvidence }).proofStatus, 'PASSED');
  assert.equal(evaluateAddressOverlayEvidence({ target: { raspberry_like: false }, loadedEvidence }).proofStatus, 'BLOCKED');
});

test('address overlay proof fails incomplete supplied evidence instead of inventing proof', () => {
  const evaluation = evaluateAddressOverlayEvidence({ target: { raspberry_like: true }, loadedEvidence: { source: 'injected', load_error: null, data: { address_text_present: true } } });
  assert.equal(evaluation.proofStatus, 'FAILED');
  assert.match(evaluation.failedReasons.join('\n'), /overlay/);
  assert.match(evaluation.failedReasons.join('\n'), /visual evidence invalid/);
});

test('address overlay evidence template defaults to non-claiming false fields and pending visual evidence', () => {
  const template = buildAddressOverlayEvidenceTemplate();
  assert.equal(template.native_display_path_observed, false);
  assert.equal(template.address_text_present, false);
  assert.equal(template.overlay_rendered_on_device, false);
  assert.equal(template.operator_observed, false);
  assert.equal(template.marker_visible_in_device_evidence, false);
  assert.equal(template.visual_evidence.marker_validation, 'manual_pending');
  assert.match(template.operator_note, /Set all required boolean fields to true only after observing/);
});

test('visual evidence validator requires matched marker and sha256 metadata', () => {
  assert.equal(validateAddressOverlayVisualEvidence(validEvidence()).status, 'PASSED');
  const markerMismatch = validEvidence({ visual_evidence: { ...validEvidence().visual_evidence, observed_marker: 'PF_ADDR_OTHER' } });
  const validation = validateAddressOverlayVisualEvidence(markerMismatch);
  assert.equal(validation.status, 'FAILED');
  assert.match(validation.errors.join('\n'), /observed_marker/);
});
