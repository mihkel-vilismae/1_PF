import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAddressOverlayProofMarker,
  buildAddressOverlayProofMarkerContract,
  readAddressOverlayProofInput,
  validateAddressOverlayProofMarker,
} from '../tools/address-overlay-proof-marker-lib.mjs';

const metadata = { version: 'test', gitCommit: 'test' };

test('address overlay marker contract creates stable PF_ADDR marker from run id', () => {
  const marker = buildAddressOverlayProofMarker({ runId: '20260621_193027' });
  assert.equal(marker.marker, 'PF_ADDR_20260621_193027');
  assert.equal(validateAddressOverlayProofMarker({ ...marker, primary_line: 'Tartu, Estonia', secondary_line: marker.marker }).status, 'PASSED');
});

test('address overlay proof input adds marker to secondary line and readiness source kind', () => {
  const input = readAddressOverlayProofInput({ PF_ADDRESS_OVERLAY_PROOF_RUN_ID: 'abc-123', PF_ADDRESS_OVERLAY_PROOF_ADDRESS_TEXT: 'Tallinn, Estonia' });
  assert.equal(input.marker, 'PF_ADDR_ABC-123');
  assert.equal(input.primary_line, 'Tallinn, Estonia');
  assert.equal(input.secondary_line, 'PF_ADDR_ABC-123');
  assert.equal(input.source_kind, 'readiness_approved_address');
});

test('address overlay marker contract proof passes without claiming display visibility', async () => {
  const envelope = await buildAddressOverlayProofMarkerContract({ metadata, env: { PF_ADDRESS_OVERLAY_PROOF_RUN_ID: '20260621_193027' } });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.overlay.marker, 'PF_ADDR_20260621_193027');
  assert.match(envelope.evidence.non_claims.join('\n'), /does not prove visual device output/);
});
