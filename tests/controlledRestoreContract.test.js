import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('controlled restore OpenSpec defines states before implementation', () => {
  const doc = readFileSync('docs/20_architecture_and_specs/openspec/controlled_restore_action_openspec.md', 'utf8');
  for (const state of ['RESTORE_UNAVAILABLE', 'RESTORE_PREVIEW_READY', 'RESTORE_CONFIRMATION_REQUIRED', 'RESTORE_BLOCKED', 'RESTORE_EXECUTED']) {
    assert.match(doc, new RegExp(state));
  }
  assert.match(doc, /View C remains read-only/);
  assert.match(doc, /Debug may offer fake\/local restore previews only/);
  assert.match(doc, /does not implement restore mutation/);
});
