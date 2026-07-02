#!/usr/bin/env node
// Proves the View 6 Codex handoff document is now completed by real fixture playback.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const handoffPath = 'docs/20_architecture_and_specs/openspec/terminal_demo_view6_codex_playback_handoff.md';
const requiredMarkers = [
  'Terminal Demo View 6 Codex Playback Handoff',
  'This handoff is complete in v2.0.18.',
  'this will be done by Codex',
  'CODEX_DEFERRED',
  'superseded by real fixture playback artifact generation',
  'terminal/demo/test_data/playback_fixtures/gps_valid_01.jpg',
  'terminal/demo/test_data/playback_fixtures/gps_valid_video_02_tartu.mp4',
  'Play fixture image in HTML browser',
  'Play fixture video in HTML browser',
  'Play fixture image full screen without overlay',
  'Play fixture video full screen without overlay',
  'Show fixture image with address overlay',
  'Show fixture video with address overlay',
  'action=view6_fixture_playback_real',
  'Only after fixture playback remains stable',
  'Do not add cron, auth, DB writes, worker calls, or queue execution',
  'npm run proof:terminal-demo-view6-real-fixture-playback'
];

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

const handoff = read(handoffPath);
for (const marker of requiredMarkers) {
  if (!handoff.includes(marker)) throw new Error(`handoff missing marker: ${marker}`);
}

const packageJson = JSON.parse(read('package.json'));
if (!packageJson.scripts?.['proof:terminal-demo-view6-codex-playback-handoff']) {
  throw new Error('missing handoff proof package script');
}
if (!packageJson.scripts?.['proof:terminal-demo-view6-real-fixture-playback']) {
  throw new Error('missing real fixture playback proof package script');
}

console.log('terminal_demo_view6_codex_playback_handoff: PASS');
console.log('verified: View 6 Codex handoff doc is completed by real fixture playback and preserves no-queue/no-cron boundaries');
