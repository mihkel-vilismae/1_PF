/*
 * Verifies Goal 3 documentation records the fullscreen activity reuse boundary.
 * The doc must stay honest about backend, PIR, and Raspberry hardware limits.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const docsSource = readFileSync('docs/OS_PLAYBACK_ACTIVITY_GOAL_3.md', 'utf8');
const appSource = readFileSync('dashboard/app.ts', 'utf8');

test('Goal 3 documentation records implemented slices and preserved boundaries', () => {
  assert.match(docsSource, /Goal 3 is implemented through five slices/);
  assert.match(docsSource, /View B\/B5 activity testing remains available and separate/);
  assert.match(docsSource, /PIR remains honest/);
  assert.match(docsSource, /not a real Raspberry Pi display power command/);
});

test('Goal 3 implementation avoids new backend wake mutation endpoints', () => {
  assert.doesNotMatch(appSource, /api\/runtime\/playback\/activity|api\/runtime\/playback\/wake/);
  assert.match(appSource, /markOsPlaybackActivityDetected\('mouse'\)/);
  assert.match(appSource, /markOsPlaybackActivityDetected\('keyboard'\)/);
});
