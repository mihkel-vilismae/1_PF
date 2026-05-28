/*
 * Verifies the Goal 2 View B/B5 documentation keeps the reuse boundary explicit.
 * The docs test prevents accidental claims that fullscreen playback reuse already landed.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Goal 2 docs document View B activity detection and defer fullscreen reuse', async () => {
  const doc = await readFile(new URL('../docs/VIEW_B_ACTIVITY_DETECTION_GOAL_2.md', import.meta.url), 'utf8');

  assert.match(doc, /Goal 2 is implemented as a View B \/ B5 testing surface/);
  assert.match(doc, /PIR is intentionally honest/);
  assert.match(doc, /Goal 3 will reuse the proven View B detection logic/);
  assert.match(doc, /Existing B5 backend-owned screen simulation toggles remain unchanged/);
});
