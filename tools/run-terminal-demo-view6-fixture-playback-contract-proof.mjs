#!/usr/bin/env node
// Proves the View 6 fixture-backed playback placeholder contract.
// Confirms disabled queue controls, enabled fixture controls, and fixture hashes.
// This proof does not launch real playback.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const ansiPattern = /\u001b\[[0-9;]*m/g;
const hardCodedNotice = 'Right now we are using hard-coded files, not using files from the playback queue table.';

const queueButtons = [
  'Play queued images in HTML browser',
  'Play queued videos in HTML browser',
  'Play queued images full screen without overlay',
  'Play queued videos full screen without overlay',
  'Show queued images with address overlay',
  'Show queued videos with address overlay'
];

const fixtureButtons = [
  'Play fixture image in HTML browser',
  'Play fixture video in HTML browser',
  'Play fixture image full screen without overlay',
  'Play fixture video full screen without overlay',
  'Show fixture image with address overlay',
  'Show fixture video with address overlay'
];

const fixturePairs = [
  ['generated_test_data/gps_valid/gps_valid_01.jpg', 'terminal/demo/test_data/playback_fixtures/gps_valid_01.jpg'],
  ['generated_test_data/gps_valid/gps_valid_video_02_tartu.mp4', 'terminal/demo/test_data/playback_fixtures/gps_valid_video_02_tartu.mp4']
];

// Renders the real-demo terminal for a focused View 6 smoke argument set.
function runTerminal(args) {
  return execFileSync(process.execPath, ['--import', 'tsx', 'terminal/demo/src/main.ts', '--adapter=real-demo', ...args], {
    cwd: repoRoot,
    env: { ...process.env, TERMINAL_DEMO_COLUMNS: '240', NO_COLOR: '1' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).replace(ansiPattern, '');
}

// Reads a repository file as bytes for hashing or text conversion.
function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath));
}

// Reads a repository file as UTF-8 text.
function readText(relativePath) {
  return read(relativePath).toString('utf8');
}

// Hashes a fixture file to compare source and copied fixture bytes.
function hash(relativePath) {
  return createHash('sha256').update(read(relativePath)).digest('hex');
}

// Asserts that proof output contains an expected marker.
function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: expected ${expected}`);
}

// Asserts that proof output does not contain a forbidden marker.
function assertNotIncludes(text, unexpected, label) {
  if (text.includes(unexpected)) throw new Error(`${label}: unexpected ${unexpected}`);
}

const view6 = runTerminal(['--view-shell-smoke=6']);
assertIncludes(view6, 'VIEW 6 - PLAYBACK', 'view 6 title');
assertIncludes(view6, 'QUEUE-BACKED PLAYBACK - FUTURE DISABLED', 'queue disabled section');
assertIncludes(view6, hardCodedNotice, 'queue disabled notice');
assertIncludes(view6, 'FIXTURE-BACKED PLAYBACK - CURRENT ENABLED', 'fixture enabled section');
assertNotIncludes(view6, 'EMPTY VIEW SHELL ONLY', 'view 6 is no longer blank');
assertNotIncludes(view6, 'PLAYBACK_QUEUE', 'view 6 must not render queue table as execution source');
for (const label of queueButtons) assertIncludes(view6, `[disabled] ${label}`, `disabled queue button ${label}`);
for (const label of fixtureButtons) assertIncludes(view6, `[enabled] ${label}`, `enabled fixture button ${label}`);
for (const [source, fixture] of fixturePairs) {
  assertIncludes(view6, fixture, `fixture path rendered ${fixture}`);
  assertIncludes(view6, source, `source path rendered ${source}`);
  if (hash(source) !== hash(fixture)) throw new Error(`fixture hash mismatch: ${fixture}`);
}

const docs = [
  'terminal/demo/README.md',
  'docs/20_architecture_and_specs/openspec/terminal_demo_view6_fixture_playback_contract_openspec.md',
  'docs/proofs/terminal_demo_view6_fixture_playback_contract_proof.md',
  'terminal/demo/test_data/playback_fixtures/README.md'
].map(readText).join('\n');

for (const marker of [
  'View 6 fixture-backed playback contract',
  hardCodedNotice,
  'QUEUE-BACKED PLAYBACK - FUTURE DISABLED',
  'FIXTURE-BACKED PLAYBACK - CURRENT ENABLED',
  'generated_test_data/gps_valid/gps_valid_video_02_tartu.mp4',
  'terminal/demo/test_data/playback_fixtures/gps_valid_video_02_tartu.mp4'
]) {
  assertIncludes(docs, marker, `docs marker ${marker}`);
}

console.log('terminal_demo_view6_fixture_playback_contract: PASS');
console.log('verified: disabled queue section, enabled fixture section, copied fixtures, docs, and no queue-table rendering');
