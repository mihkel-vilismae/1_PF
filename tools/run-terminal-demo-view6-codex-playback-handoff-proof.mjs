#!/usr/bin/env node
// Proves the View 6 Codex playback handoff document is complete.
// This is a documentation proof for the deferred real-playback boundary.
// It does not implement or launch playback.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const handoffPath = 'docs/20_architecture_and_specs/openspec/terminal_demo_view6_codex_playback_handoff.md';
const requiredMarkers = [
  'Terminal Demo View 6 Codex Playback Handoff',
  'this will be done by Codex',
  'CODEX_DEFERRED',
  'launchesPlayback=false',
  'terminal/demo/test_data/playback_fixtures/gps_valid_01.jpg',
  'terminal/demo/test_data/playback_fixtures/gps_valid_video_02_tartu.mp4',
  'Play fixture image in HTML browser',
  'Play fixture video in HTML browser',
  'Play fixture image full screen without overlay',
  'Play fixture video full screen without overlay',
  'Show fixture image with address overlay',
  'Show fixture video with address overlay',
  'Only after fixture playback works, switch future queue-backed buttons',
  'Do not add cron, auth, DB writes, worker calls, or queue execution',
  'npm run proof:terminal-demo-view6-codex-placeholder-complete'
];

// Reads a repository text file for handoff assertions.
function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

// Asserts that the handoff includes a required marker.
function assertIncludes(text, expected) {
  if (!text.includes(expected)) throw new Error(`handoff missing marker: ${expected}`);
}

const handoff = read(handoffPath);
for (const marker of requiredMarkers) assertIncludes(handoff, marker);

const packageJson = JSON.parse(read('package.json'));
if (!packageJson.scripts?.['proof:terminal-demo-view6-codex-playback-handoff']) {
  throw new Error('missing handoff proof package script');
}

console.log('terminal_demo_view6_codex_playback_handoff: PASS');
console.log('verified: View 6 Codex handoff doc preserves fixture-first and no-queue/no-playback boundary');
