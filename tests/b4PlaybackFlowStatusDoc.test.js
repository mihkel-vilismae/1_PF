/*
 * Verifies the B4 playback closure document keeps real behavior and placeholders explicit.
 * The guard prevents docs from claiming rendering or Raspberry display support too early.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const compatibilityDoc = readFileSync('docs/categorized/current_implementation_status_docs/b4_playback_flow_status.md', 'utf8');
const canonicalDoc = readFileSync('docs/30_status_snapshots/2026-05-12/b4_playback_flow_status.md', 'utf8');

test('B4 playback flow status compatibility pointer names the canonical moved document', () => {
  // Checks old links remain useful after the categorized status snapshot move.
  assert.match(compatibilityDoc, /docs\/30_status_snapshots\/2026-05-12\//);
  assert.match(compatibilityDoc, /b4_playback_flow_status\.md/);
});

test('B4 playback flow status records the real route and worker command', () => {
  // Checks that the closure doc names the actual B4 HTTP and scheduler entrypoints.
  assert.match(canonicalDoc, /POST \/api\/runtime\/playback\/select-current/);
  assert.match(canonicalDoc, /npm run api -- --scheduler playback-worker/);
  assert.match(canonicalDoc, /playback-worker-status\.json/);
});

test('B4 playback flow status keeps rendering and Raspberry support honest', () => {
  // Checks that the closure doc does not overclaim real rendering or Raspberry support.
  assert.match(canonicalDoc, /Preview-window rendering is not yet real media display\./);
  assert.match(canonicalDoc, /Fullscreen rendering is not yet real media display\./);
  assert.match(canonicalDoc, /Raspberry OS rendering remains disabled\/planned/);
});

test('B4 playback flow status preserves B3, B4, B5, and worker-loop boundaries', () => {
  // Checks that the closure doc keeps B3 queue preparation, B4 selection, and B5 screen responsibilities separate.
  assert.match(canonicalDoc, /B3\.5 owns queue preparation\/building/);
  assert.match(canonicalDoc, /playback_worker` does not download, index, parse GPS, geocode, prepare\/build the queue, render media, enter fullscreen, or control screen hardware/);
  assert.match(canonicalDoc, /B5 screen simulation\/hardware behavior is separate/);
});
