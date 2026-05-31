// Tests the deterministic address display proof runner.
// The proof uses temporary local media/database artifacts only.
// It verifies address propagation from GPS/geocode stages to playback payloads.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAddressDisplayProofPythonScript,
  runAddressDisplayProof,
} from '../tools/address-display-proof-lib.mjs';

test('address display proof script covers queue and playback contract assertions', () => {
  const script = buildAddressDisplayProofPythonScript();
  assert.match(script, /stage3_process_gps_queue/);
  assert.match(script, /stage4_process_geocode_queue/);
  assert.match(script, /prepare_slideshow_queue/);
  assert.match(script, /select_current_item/);
  assert.match(script, /playback_contract/);
  assert.match(script, /current_item_address_matches/);
});

test('address display proof passes with deterministic local sidecar input', async () => {
  const envelope = await runAddressDisplayProof({
    metadata: { version: '0.7.34', gitCommit: 'test' },
  });
  assert.equal(envelope.proof_status, 'PASSED', JSON.stringify(envelope.evidence.command_result, null, 2));
  assert.equal(envelope.evidence.assertions.selected_address_matches, true);
  assert.equal(envelope.evidence.assertions.current_item_address_matches, true);
  assert.equal(envelope.evidence.playback_contract.currentItem.hasResolvedAddress, true);
});
