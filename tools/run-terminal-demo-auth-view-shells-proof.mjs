#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const ansiPattern = /\u001b\[[0-9;]*m/g;

const newAuthButtons = [
  'Verify iCloudPD install',
  'Verify with iCloudPD',
  'Login using .env values',
  'Check login',
  'Log out and remove existing session',
  'Show auth/session paths and files',
  'Generate auth evidence pack',
  'List auth evidence packs'
];

const legacyForbidden = [
  'TEST LOGIN BY DOWNLOADING A SINGLE FILE',
  'Reset local attempt',
  'Submit 2FA',
  'Refresh status'
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
assertIncludes(defaultView, 'ICLOUDPD AUTHORIZATION', 'default auth section title');
assertIncludes(defaultView, 'Authorization status: planned shell only', 'default auth read-only status');
assertIncludes(defaultView, '[I] Go to login view', 'default auth navigation button shell');
assertIncludes(defaultView, 'No iCloudPD command', 'default auth no execution copy');
assertNotIncludes(defaultView, 'NEW AUTH BUTTON SHELLS', 'default view must not render full login shell');

const overlay = runTerminal(['--section-header-ids-smoke']);
assertIncludes(overlay, 'L-4 ICLOUDPD AUTHORIZATION', 'auth section has stable header ID');

const loginView = runTerminal(['--view-shell-smoke=I']);
assertIncludes(loginView, 'VIEW I — ICLOUDPD LOGIN VIEW', 'login view title');
assertIncludes(loginView, 'NEW AUTH BUTTON SHELLS', 'new auth shell section');
assertIncludes(loginView, 'Auth implementation: NEW AUTH shell only', 'new auth status row');
assertIncludes(loginView, 'No iCloudPD process is started from View I in this slice.', 'login shell no execution guard');
for (const button of newAuthButtons) assertIncludes(loginView, button, `new auth button ${button}`);
for (const forbidden of legacyForbidden) assertNotIncludes(loginView, forbidden, `legacy button ${forbidden}`);
assertNotIncludes(loginView, 'EMPTY VIEW SHELL ONLY', 'login view is no longer generic empty shell');

const fromDefaultToLogin = runTerminal(['--view-shell-smoke=I']);
assertIncludes(fromDefaultToLogin, 'VIEW I — ICLOUDPD LOGIN VIEW', 'pressing I opens login view shell');

const view0 = runTerminal(['--view-shell-smoke=0']);
assertIncludes(view0, 'VIEW 0 — TABLE OF CONTENTS AND DEBUG', 'view 0 remains unchanged');
assertIncludes(view0, 'TESTING', 'view 0 testing remains unchanged');

const view6 = runTerminal(['--view-shell-smoke=6']);
assertIncludes(view6, 'PLAYBACK VIEW', 'view 6 remains present');
assertIncludes(view6, 'EMPTY VIEW SHELL ONLY', 'view 6 remains blank');
assertNotIncludes(view6, 'Play queued images in HTML browser', 'view 6 playback remains deferred');

const docs = [
  'terminal/demo/README.md',
  'docs/20_architecture_and_specs/openspec/terminal_demo_auth_view_shells_openspec.md',
  'docs/proofs/terminal_demo_auth_view_shells_proof.md',
  'docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md',
  'CHANGELOG.md'
].map(read).join('\n');
for (const marker of [
  'iCloudPD authorization',
  'Go to login view',
  'NEW AUTH shell only',
  'StatusRing',
  'StatusRow',
  'View `0` and View `6` are unchanged'
]) {
  assertIncludes(docs, marker, 'auth shell docs marker');
}
for (const button of newAuthButtons) assertIncludes(docs, button, `docs new auth button ${button}`);
for (const forbidden of ['TEST LOGIN BY DOWNLOADING A SINGLE FILE', 'Reset local attempt', 'Submit 2FA']) {
  assertNotIncludes(read('docs/20_architecture_and_specs/openspec/terminal_demo_auth_view_shells_openspec.md'), forbidden, `docs forbidden legacy ${forbidden}`);
}

console.log('terminal_demo_auth_view_shells: PASS');
console.log('verified: default auth shell, View I NEW AUTH shell, legacy exclusion, no auth execution, View 0/View 6 unchanged');
