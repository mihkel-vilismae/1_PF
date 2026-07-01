#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const ansiPattern = /\u001b\[[0-9;]*m/g;

const logLabels = [
  'terminal-button-actions.jsonl',
  'regular-worker.truth.jsonl',
  'playback-worker.truth.jsonl',
  'screen-worker.truth.jsonl',
  'regular-worker.status.json',
  'playback-worker-status.json',
  'screen-on-off-worker-status.json'
];

const logPaths = [
  'runtime_data/logs/demo/terminal-button-actions.jsonl',
  'runtime_data/v2_worker_truth/demo/regular-worker.truth.jsonl',
  'runtime_data/v2_worker_truth/demo/playback-worker.truth.jsonl',
  'runtime_data/v2_worker_truth/demo/screen-worker.truth.jsonl',
  'runtime_data/scheduler/demo/regular-worker.status.json',
  'runtime_data/scheduler/demo/playback-worker-status.json',
  'runtime_data/scheduler/demo/screen-on-off-worker-status.json'
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

const logsView = runTerminal(['--view-shell-smoke=L']);
assertIncludes(logsView, 'VIEW L — LOGS VIEW', 'logs view title');
assertIncludes(logsView, 'CORE LOG / STATUS SHELLS', 'core log shell section');
assertIncludes(logsView, 'LOG PANEL PLACEHOLDERS', 'placeholder panels section');
assertIncludes(logsView, 'Logs implementation: shell placeholders only', 'logs shell status row');
assertIncludes(logsView, 'No files are tailed or read from this view slice.', 'no tail/read copy');
assertIncludes(logsView, 'No worker, DB, playback, auth, file-copy, or cron behavior runs.', 'no effects copy');
assertNotIncludes(logsView, 'EMPTY VIEW SHELL ONLY', 'logs view is no longer generic empty shell');
for (const label of logLabels) assertIncludes(logsView, label, `log label ${label}`);
for (const path of logPaths) assertIncludes(logsView, path, `log path ${path}`);

const view0 = runTerminal(['--view-shell-smoke=0']);
assertIncludes(view0, 'VIEW 0 — TABLE OF CONTENTS AND DEBUG', 'view 0 remains unchanged');
assertIncludes(view0, 'TESTING', 'view 0 testing remains');

const view6 = runTerminal(['--view-shell-smoke=6']);
assertIncludes(view6, 'PLAYBACK VIEW', 'view 6 remains present');
assertIncludes(view6, 'EMPTY VIEW SHELL ONLY', 'view 6 remains blank');
assertNotIncludes(view6, 'Play queued images in HTML browser', 'view 6 remains untouched');

const logsRenderer = read('terminal/demo/src/ui/renderLogsView.ts');
for (const forbidden of ['node:fs', 'readFile', 'watchFile']) {
  assertNotIncludes(logsRenderer, forbidden, `logs renderer must not use file APIs: ${forbidden}`);
}

const docs = [
  'terminal/demo/README.md',
  'docs/20_architecture_and_specs/openspec/terminal_demo_logs_view_shell_openspec.md',
  'docs/proofs/terminal_demo_logs_view_shell_proof.md',
  'docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md',
  'CHANGELOG.md'
].map(read).join('\n');
for (const marker of [
  'View `L` logs shell',
  'CORE LOG / STATUS SHELLS',
  'LOG PANEL PLACEHOLDERS',
  'shell placeholders only',
  'no file tailing',
  'View `0` and View `6` are unchanged'
]) {
  assertIncludes(docs, marker, 'logs shell docs marker');
}
for (const label of logLabels) assertIncludes(docs, label, `docs log label ${label}`);

console.log('terminal_demo_logs_view_shell: PASS');
console.log('verified: View L logs shell labels/placeholders, no file tailing, no runtime side effects, View 0/View 6 unchanged');
