import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRaspberryAddressOverlayDeviceEvidenceProof } from '../tools/raspberry-address-overlay-device-display-lib.mjs';

const metadata = { version: 'test', gitCommit: 'test' };
const marker = 'PF_ADDR_20260621_194034';
const evidence = {
  overlay_marker: marker,
  native_display_path_observed: true,
  address_text_present: true,
  overlay_rendered_on_device: true,
  operator_observed: true,
  marker_visible_in_device_evidence: true,
  visual_evidence: {
    kind: 'framebuffer_capture',
    artifact_sha256: 'b'.repeat(64),
    artifact_path_redacted: true,
    expected_marker: marker,
    observed_marker: marker,
    marker_validation: 'matched',
    operator_confirmation: false,
  },
};

test('device evidence proof passes structured non-OCR visual marker metadata', async () => {
  const envelope = await buildRaspberryAddressOverlayDeviceEvidenceProof({ metadata, evidence });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.visual_evidence_validation.evidence_level, 'L3_captured_output');
  assert.match(envelope.evidence.non_claims.join('\n'), /does not run OCR/);
});

test('device evidence proof blocks when evidence file is missing', async () => {
  const envelope = await buildRaspberryAddressOverlayDeviceEvidenceProof({ metadata, env: {} });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.visual_evidence_validation.errors.join('\n'), /PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE/);
});

test('device evidence proof fails mismatched marker metadata', async () => {
  const envelope = await buildRaspberryAddressOverlayDeviceEvidenceProof({ metadata, evidence: { ...evidence, visual_evidence: { ...evidence.visual_evidence, observed_marker: 'PF_ADDR_OTHER' } } });
  assert.equal(envelope.proof_status, 'FAILED');
  assert.match(envelope.evidence.visual_evidence_validation.errors.join('\n'), /observed_marker/);
});
