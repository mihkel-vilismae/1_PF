#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const ansiPattern = /\u001b\[[0-9;]*m/g;

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: expected ${expected}`);
}

function assertNotIncludes(text, unexpected, label) {
  if (text.includes(unexpected)) throw new Error(`${label}: unexpected ${unexpected}`);
}

function runTerminal(args) {
  return execFileSync(npmCommand, ['run', '-s', 'demo:terminal:real', '--', ...args], {
    cwd: repoRoot,
    env: { ...process.env, TERMINAL_DEMO_COLUMNS: '240' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).replace(ansiPattern, '');
}

const openspec = read('docs/20_architecture_and_specs/openspec/terminal_demo_remaining_view_shells_preflight_openspec.md');
const proofDoc = read('docs/proofs/terminal_demo_view_shell_beeline_preflight_proof.md');
const readme = read('terminal/demo/README.md');
const defaults = read('docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md');
const changelog = read('CHANGELOG.md');
const combinedDocs = [openspec, proofDoc, readme, defaults, changelog].join('\n');

for (const marker of [
  'View `0`',
  'View `6`',
  'Frozen for this chat',
  'planned shell contract',
  'iCloudPD authorization',
  'Go to login view',
  'terminal-button-actions.jsonl',
  'regular-worker.truth.jsonl',
  'playback-worker.truth.jsonl',
  'screen-worker.truth.jsonl',
  'regular-worker.status.json',
  'playback-worker-status.json',
  'screen-on-off-worker-status.json',
  'Copy one file from generated test images',
  'SectionFrame',
  'ViewMapSection',
  'StatusRing',
  'StatusRow',
  'RpiStagesSection',
  'RpiWorkersSection'
]) {
  assertIncludes(combinedDocs, marker, 'preflight docs marker');
}

for (const button of [
  'Verify iCloudPD install',
  'Verify with iCloudPD',
  'Login using .env values',
  'Check login',
  'Log out and remove existing session',
  'Show auth/session paths and files',
  'Generate auth evidence pack',
  'List auth evidence packs'
]) {
  assertIncludes(openspec, button, 'new auth button shell');
}

for (const forbiddenLegacy of [
  'TEST LOGIN BY DOWNLOADING A SINGLE FILE',
  'Reset local attempt',
  'Submit 2FA'
]) {
  assertNotIncludes(openspec, forbiddenLegacy, 'legacy auth button must not be in shell contract');
}

for (const falseClaim of [
  'View `I` is implemented',
  'View `L` is implemented',
  'View `1` is implemented',
  'logs are tailed',
  'auth execution is implemented',
  'file copy is implemented'
]) {
  assertNotIncludes(combinedDocs, falseClaim, 'docs must not claim future work is implemented');
}

const view0 = runTerminal(['--view-shell-smoke=0']);
assertIncludes(view0, 'VIEW 0 — TABLE OF CONTENTS AND DEBUG', 'view 0 remains map page');
assertIncludes(view0, 'VIEW MAP', 'view 0 map section remains');
assertIncludes(view0, 'TESTING', 'view 0 testing section remains');

const view6 = runTerminal(['--view-shell-smoke=6']);
assertIncludes(view6, 'PLAYBACK VIEW', 'view 6 remains present');
assertIncludes(view6, 'EMPTY VIEW SHELL ONLY', 'view 6 remains blank');
assertNotIncludes(view6, 'Play queued images in HTML browser', 'view 6 playback buttons remain deferred');
assertNotIncludes(view6, 'Play fixture image in HTML browser', 'view 6 fixture buttons remain deferred');

console.log('terminal_demo_view_shell_beeline_preflight: PASS');
console.log('verified: scope guard, docs-only planned shell contracts, reusable component guidance, and frozen View 0/View 6 behavior');
