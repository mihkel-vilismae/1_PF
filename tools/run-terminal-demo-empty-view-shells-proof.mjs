#!/usr/bin/env node
// Compatibility proof for terminal-demo view shells after View 6 promotion.
// Views 1-5 remain empty stage shells; View 6 now owns the fixture contract.
// Runs terminal smoke paths directly through Node/tsx to avoid nested npm issues.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const ansiPattern = /\u001b\[[0-9;]*m/g;
const genericEmptyViews = [
  ['1', 'DOWNLOAD STAGE VIEW'],
  ['2', 'INDEXING STAGE VIEW'],
  ['3', 'GPS PARSER STAGE VIEW'],
  ['4', 'GEOCODE STAGE VIEW'],
  ['5', 'ENQUEUE VIEW']
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

const defaultView = runTerminal(['--view-shell-smoke=D']);
assertIncludes(defaultView, 'PHOTOFRAME REAL DEMO TERMINAL', 'default view still renders operator screen');
assertNotIncludes(defaultView, 'EMPTY VIEW SHELL ONLY', 'default view is not replaced by empty shell');

for (const [key, title] of genericEmptyViews) {
  const output = runTerminal([`--view-shell-smoke=${key}`]);
  assertIncludes(output, title, `view ${key} title`);
  assertIncludes(output, `View key: ${key}`, `view ${key} key`);
  assertIncludes(output, 'EMPTY VIEW SHELL ONLY', `view ${key} empty shell status`);
  assertIncludes(output, 'No buttons, workers, auth, playback, DB writes, file copies, or cron calls', `view ${key} no-effect guard`);
}

const view6 = runTerminal(['--view-shell-smoke=6']);
assertIncludes(view6, 'VIEW 6 - PLAYBACK', 'view 6 title');
assertIncludes(view6, 'FIXTURE-BACKED PLAYBACK - CURRENT ENABLED', 'view 6 promoted fixture section');
assertNotIncludes(view6, 'EMPTY VIEW SHELL ONLY', 'view 6 no longer generic empty shell');

const logsView = runTerminal(['--view-shell-smoke=L']);
assertIncludes(logsView, 'VIEW L — LOGS VIEW', 'view L now renders logs shell title');
assertIncludes(logsView, 'CORE LOG / STATUS SHELLS', 'view L logs shell section');
assertNotIncludes(logsView, 'EMPTY VIEW SHELL ONLY', 'view L is no longer generic empty shell');

const loginView = runTerminal(['--view-shell-smoke=I']);
assertIncludes(loginView, 'VIEW I — ICLOUDPD LOGIN VIEW', 'view I now renders auth shell title');
assertIncludes(loginView, 'NEW AUTH BUTTON SHELLS', 'view I auth button shell');
assertNotIncludes(loginView, 'EMPTY VIEW SHELL ONLY', 'view I is no longer generic empty shell');

const modalPriority = runTerminal(['--empty-view-modal-priority-smoke']);
assertIncludes(modalPriority, 'START STAGE MODAL', 'modal priority keeps modal visible');
assertIncludes(modalPriority, 'Index', 'modal key 2 still targets index row');
assertNotIncludes(modalPriority, 'INDEXING STAGE VIEW', 'modal key 2 must not switch to view 2');

const docs = [
  'terminal/demo/README.md',
  'docs/20_architecture_and_specs/openspec/terminal_demo_empty_view_shells_openspec.md',
  'docs/proofs/terminal_demo_empty_view_shells_proof.md'
].map(read).join('\n');
for (const marker of ['View', 'Pane', 'Section', 'Subsection', 'Modal', 'D', 'L', 'I', '1', '2', '3', '4', '5', '6']) {
  assertIncludes(docs, marker, 'docs coverage');
}

console.log('terminal_demo_empty_view_shells: PASS');
console.log('verified: D stays default, L renders logs shell, I renders auth shell, 1-5 generic shells keep modal priority, and View 6 is promoted to fixture contract');
