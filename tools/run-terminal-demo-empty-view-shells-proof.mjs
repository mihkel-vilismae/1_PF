#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const ansiPattern = /\u001b\[[0-9;]*m/g;
const views = [
  ['D', 'PHOTOFRAME REAL DEMO TERMINAL'],
  ['L', 'LOGS VIEW'],
  ['1', 'DOWNLOAD STAGE VIEW'],
  ['2', 'INDEXING STAGE VIEW'],
  ['3', 'GPS PARSER STAGE VIEW'],
  ['4', 'GEOCODE STAGE VIEW'],
  ['5', 'ENQUEUE VIEW'],
  ['6', 'PLAYBACK VIEW']
];

function runTerminal(args) {
  return execFileSync(npmCommand, ['run', '-s', 'demo:terminal:real', '--', ...args], {
    cwd: repoRoot,
    env: { ...process.env, TERMINAL_DEMO_COLUMNS: '240' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).replace(ansiPattern, '');
}

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: expected ${expected}`);
}

function assertNotIncludes(text, unexpected, label) {
  if (text.includes(unexpected)) throw new Error(`${label}: unexpected ${unexpected}`);
}

const defaultView = runTerminal(['--view-shell-smoke=D']);
assertIncludes(defaultView, 'PHOTOFRAME REAL DEMO TERMINAL', 'default view still renders operator screen');
assertNotIncludes(defaultView, 'EMPTY VIEW SHELL ONLY', 'default view is not replaced by empty shell');

for (const [key, title] of views.slice(1)) {
  const output = runTerminal([`--view-shell-smoke=${key}`]);
  assertIncludes(output, title, `view ${key} title`);
  assertIncludes(output, `View key: ${key}`, `view ${key} key`);
  assertIncludes(output, 'EMPTY VIEW SHELL ONLY', `view ${key} empty shell status`);
  assertIncludes(output, 'No buttons, workers, auth, playback, DB writes, file copies, or cron calls', `view ${key} no-effect guard`);
}

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
console.log('verified: D stays default, L/1-6 stay generic empty shells, I renders auth shell, modal keys keep priority, no-effect guard is rendered');
