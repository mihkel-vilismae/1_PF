import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderLastRunView } from '../dashboard/views/lastRunView.ts';

test('View C restore wording is read-only and does not expose an enabled restore action', () => {
  const markup = renderLastRunView(createInitialState(), 'real');
  assert.match(markup, /read-only/iu);
  assert.match(markup, /does not call any restore endpoint/);
  assert.match(markup, /data-restore-contract-status="not-implemented"/);
  assert.match(markup, /Restore action not implemented/);
  assert.doesNotMatch(markup, /Resume from saved state \(placeholder\)/);
});
