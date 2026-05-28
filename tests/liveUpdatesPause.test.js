/*
 * Guards the operator live-update pause control used for stable DevTools inspection.
 * The static checks ensure background polling and transit-triggered renders can pause.
 * User-triggered controls remain available because the button lives in the dashboard shell.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = () => readFileSync('dashboard/app.ts', 'utf8');

test('dashboard shell renders a live-update pause control for stable inspection', () => {
  const source = appSource();

  assert.match(source, /data-action="toggle-live-updates"/);
  assert.match(source, /Pause live updates/);
  assert.match(source, /Resume live updates/);
  assert.match(source, /aria-pressed="\$\{liveUpdatesPaused \? 'true' : 'false'\}"/);
});

test('transit-driven renders use the live-update render guard', () => {
  const source = appSource();

  assert.match(source, /function requestLiveUpdateRender\(\): void/);
  assert.match(source, /pendingLiveUpdateRender = true/);
  assert.match(source, /window\.addEventListener\(TRANSIT_EVENT_NAME[\s\S]*requestLiveUpdateRender\(\);[\s\S]*\}\);/);
});

test('background polling skips automatic work while live updates are paused', () => {
  const source = appSource();

  assert.match(source, /function shouldRunLiveUpdates\(\): boolean/);
  assert.match(source, /if \(!shouldRunLiveUpdates\(\) \|\| state\.activeView !== 'A'\)/);
  assert.match(source, /if \(!shouldRunLiveUpdates\(\)\) \{\n\s+return;\n\s+\}\n\s+const platform = getOsPlaybackPlatformForView/);
});
