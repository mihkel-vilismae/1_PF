#!/usr/bin/env node
// Aggregates the View 6 fixture contract and Codex placeholder proofs.
// Also checks source and docs for the handoff boundary markers.
// This proof stops before real playback implementation.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const expectedScripts = [
  'proof:terminal-demo-view6-fixture-playback-contract',
  'proof:terminal-demo-view6-codex-placeholder'
];
const docs = [
  'terminal/demo/README.md',
  'docs/20_architecture_and_specs/openspec/terminal_demo_view6_fixture_playback_contract_openspec.md',
  'docs/20_architecture_and_specs/openspec/terminal_demo_view6_codex_playback_handoff.md',
  'docs/proofs/terminal_demo_view6_fixture_playback_contract_proof.md',
  'docs/proofs/terminal_demo_view6_codex_placeholder_proof.md'
];
const requiredDocMarkers = [
  'QUEUE-BACKED PLAYBACK - FUTURE DISABLED',
  'FIXTURE-BACKED PLAYBACK - CURRENT ENABLED',
  'this will be done by Codex',
  'CODEX_DEFERRED',
  'launchesPlayback=false',
  'Codex owns browser/fullscreen/address-overlay execution'
];

// Runs a sibling View 6 proof script directly with Node.
function runProof(script) {
  execFileSync(process.execPath, [join(repoRoot, 'tools', `${script.replace('proof:', 'run-')}-proof.mjs`)], {
    cwd: repoRoot,
    env: { ...process.env, NO_COLOR: '1', TERMINAL_DEMO_COLUMNS: '240' },
    stdio: 'inherit'
  });
}

// Reads a repository text file for marker checks.
function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

// Asserts that a source or doc contains an expected marker.
function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: expected ${expected}`);
}

for (const script of expectedScripts) runProof(script);

const packageJson = JSON.parse(read('package.json'));
for (const script of expectedScripts) {
  if (!packageJson.scripts?.[script]) throw new Error(`missing package script ${script}`);
}

const combinedDocs = docs.map(read).join('\n');
for (const marker of requiredDocMarkers) assertIncludes(combinedDocs, marker, 'View 6 complete docs');

const source = [
  read('terminal/demo/src/playback/View6PlaybackContract.ts'),
  read('terminal/demo/src/playback/View6CodexPlaceholder.ts'),
  read('terminal/demo/src/ui/renderViewSixPlayback.ts')
].join('\n');
for (const marker of [
  'view6QueuePlaybackButtons',
  'view6FixturePlaybackButtons',
  'VIEW6_CODEX_PLACEHOLDER_MESSAGE',
  'VIEW6_CODEX_PLACEHOLDER_RESULT',
  'launchesPlayback: false'
]) {
  assertIncludes(source, marker, `View 6 complete source marker ${marker}`);
}

console.log('terminal_demo_view6_codex_placeholder_complete: PASS');
console.log('verified: View 6 scope is complete up to the Codex real-playback boundary');
