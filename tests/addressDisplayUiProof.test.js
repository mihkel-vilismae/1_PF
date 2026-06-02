// Tests the deterministic address display UI proof runner.
// The proof renders display-facing dashboard markup from local state only.
// It verifies semantic fragments, fallback copy, and filesystem-path hiding.

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateAddressDisplayUiProof,
  runAddressDisplayUiProof,
} from '../tools/address-display-ui-proof-lib.mjs';

test('address display UI proof checks semantic fragments without storing snapshots', () => {
  const evaluated = evaluateAddressDisplayUiProof();

  assert.equal(evaluated.assertions.selected_view_has_playback_stage, true);
  assert.equal(evaluated.assertions.selected_view_has_expected_address, true);
  assert.equal(evaluated.assertions.selected_fullscreen_has_expected_address, true);
  assert.equal(evaluated.assertions.missing_view_has_fallback_copy, true);
  assert.equal(evaluated.assertions.missing_fullscreen_has_fallback_copy, true);
  assert.equal(evaluated.assertions.selected_view_omits_unsafe_paths, true);
  assert.equal(evaluated.assertions.selected_fullscreen_omits_unsafe_paths, true);
  assert.ok(evaluated.renderedMarkupMetrics.selectedViewLength > 0);
  assert.ok(evaluated.semanticFragments.every((fragment) => fragment.present === true));
});

test('address display UI proof envelope is sanitized and passes locally', async () => {
  const envelope = await runAddressDisplayUiProof({
    metadata: { version: '0.7.44', gitCommit: 'test' },
  });
  const serialized = JSON.stringify(envelope);

  assert.equal(envelope.proof_kind, 'address_display_ui');
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.assertions.selected_view_has_expected_address, true);
  assert.equal(envelope.evidence.assertions.missing_view_has_fallback_copy, true);
  assert.equal(envelope.evidence.snapshot_policy.includes('Full HTML snapshots are intentionally not stored'), true);
  assert.doesNotMatch(serialized, /C:\\Users\\|\/home\/|runtime_data\/downloads|test_runtime_data\/downloads|canonicalPath/);
});
