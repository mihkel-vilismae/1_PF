#!/usr/bin/env node
// Compatibility proof for View 0 map and the merged View 6 contract.
// The package-script name is historical; View 6 is no longer blank after merge.
// Runs terminal smoke paths directly through Node/tsx to avoid nested npm issues.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const ansiPattern = /\u001b\[[0-9;]*m/g;

const viewMapRows = [
  '[D] Default operator view',
  '[L] Logs view',
  '[I] iCloudPD login view',
  '[1] Download stage view',
  '[2] Indexing stage view',
  '[3] GPS Parser stage view',
  '[4] Geocode stage view',
  '[5] Enqueue view',
  '[6] Playback view'
];

// Renders the real-demo terminal for a focused smoke argument set.
function runTerminal(args) {
  return execFileSync(process.execPath, ['--import', 'tsx', 'terminal/demo/src/main.ts', '--adapter=real-demo', ...args], {
    cwd: repoRoot,
    env: { ...process.env, TERMINAL_DEMO_COLUMNS: '240', NO_COLOR: '1' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).replace(ansiPattern, '');
}

// Reads a repository text file for documentation coverage checks.
function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

// Asserts that output or docs include an expected marker.
function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: expected ${expected}`);
}

// Asserts that output does not include a forbidden marker.
function assertNotIncludes(text, unexpected, label) {
  if (text.includes(unexpected)) throw new Error(`${label}: unexpected ${unexpected}`);
}

const view0 = runTerminal(['--view-shell-smoke=0']);
assertIncludes(view0, 'MAP AND TESTING - VIEW 0', 'view 0 title');
assertIncludes(view0, 'VIEW MAP', 'view 0 map section');
assertIncludes(view0, 'TESTING', 'view 0 testing section');
for (const row of viewMapRows) assertIncludes(view0, row, `view map row ${row}`);
assertNotIncludes(view0, 'Enter test page integer', 'view 0 modal is deferred');
assertNotIncludes(view0, 'Default test page is 0A', 'view 0 test routing is deferred');

const view6 = runTerminal(['--view-shell-smoke=6']);
assertIncludes(view6, 'VIEW 6 - PLAYBACK', 'view 6 title');
assertIncludes(view6, 'QUEUE-BACKED PLAYBACK - FUTURE DISABLED', 'view 6 queue disabled section');
assertIncludes(view6, 'FIXTURE-BACKED PLAYBACK - CURRENT ENABLED', 'view 6 fixture enabled section');
assertIncludes(view6, '[disabled] Play queued images in HTML browser', 'view 6 disabled queue button');
assertIncludes(view6, '[enabled] Play fixture image in HTML browser', 'view 6 enabled fixture button');
assertNotIncludes(view6, 'EMPTY VIEW SHELL ONLY', 'view 6 no longer blank');

for (const [key, expected] of [
  ['D', 'PHOTOFRAME REAL DEMO TERMINAL'],
  ['L', 'LOGS VIEW'],
  ['I', 'ICLOUDPD LOGIN VIEW'],
  ['1', 'DOWNLOAD STAGE VIEW'],
  ['2', 'INDEXING STAGE VIEW'],
  ['3', 'GPS PARSER STAGE VIEW'],
  ['4', 'GEOCODE STAGE VIEW'],
  ['5', 'ENQUEUE VIEW'],
  ['6', 'VIEW 6 - PLAYBACK']
]) {
  const output = runTerminal([`--view0-link-smoke=${key}`]);
  assertIncludes(output, expected, `view 0 link ${key}`);
}

const docs = [
  'terminal/demo/README.md',
  'docs/20_architecture_and_specs/openspec/terminal_demo_view0_map_view6_blank_openspec.md',
  'docs/proofs/terminal_demo_view0_map_view6_blank_proof.md'
].map(read).join('\n');
for (const marker of ['View 0', 'View Map', 'Testing', 'View 6', 'fixture-backed playback contract', 'PF_login_View0_Map_Debug_Page_Overview_ACR.md', 'PF_login_View6_Playback_Page_Overview_XACR.md']) {
  assertIncludes(docs, marker, 'docs coverage');
}

console.log('terminal_demo_view0_map_view6_merged_contract: PASS');
console.log('verified: view 0 map + testing route entry, map navigation links, and merged View 6 fixture contract');
