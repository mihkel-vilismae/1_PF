#!/usr/bin/env node
// Compatibility proof for logs view shell after View 0/View 6 promotion.
// Logs shell behavior is guarded while View 0 and View 6 keep their own contracts.
// Runs terminal smoke paths directly through Node/tsx to avoid nested npm issues.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
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

const logsView = runTerminal(['--view-shell-smoke=L']);
assertIncludes(logsView, 'VIEW L — LOGS VIEW', 'logs view title');
assertIncludes(logsView, 'CORE LOG / STATUS SNAPSHOTS', 'core log shell section');
assertIncludes(logsView, 'SELECTED LOG DETAIL', 'placeholder panels section');
assertIncludes(logsView, 'Logs implementation: read-only snapshot inspector', 'logs shell status row');
assertIncludes(logsView, 'Reads seven allowlisted runtime files when View L is active.', 'no tail/read copy');
assertIncludes(logsView, 'No writes, DB, worker, playback, auth, file-copy, or cron behavior runs.', 'no effects copy');
assertNotIncludes(logsView, 'EMPTY VIEW SHELL ONLY', 'logs view is no longer generic empty shell');
for (const label of logLabels) assertIncludes(logsView, label, `log label ${label}`);
for (const path of logPaths) assertIncludes(logsView, path, `log path ${path}`);

const view0 = runTerminal(['--view-shell-smoke=0']);
assertIncludes(view0, 'MAP AND TESTING - VIEW 0', 'view 0 map/testing contract remains available');
assertIncludes(view0, 'TESTING', 'view 0 testing remains');

const view6 = runTerminal(['--view-shell-smoke=6']);
assertIncludes(view6, 'VIEW 6 - PLAYBACK', 'view 6 remains present');
assertIncludes(view6, 'QUEUE-BACKED PLAYBACK - FUTURE DISABLED', 'view 6 queue playback remains deferred');
assertIncludes(view6, 'FIXTURE-BACKED PLAYBACK - CURRENT ENABLED', 'view 6 fixture contract remains available');

const logsRenderer = read('terminal/demo/src/ui/renderLogsView.ts');
for (const forbidden of ['node:fs', 'readFile', 'writeFile', 'appendFile', 'watchFile']) {
  assertNotIncludes(logsRenderer, forbidden, `logs renderer must not use direct file APIs: ${forbidden}`);
}

const docs = [
  'terminal/demo/README.md',
  'docs/20_architecture_and_specs/openspec/terminal_demo_logs_view_shell_openspec.md',
  'docs/proofs/terminal_demo_logs_view_shell_proof.md',
  'docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md',
  'CHANGELOG.md'
].map(read).join('\n');
for (const marker of [
  'View `L` logs read-only inspection view',
  'CORE LOG / STATUS SNAPSHOTS',
  'SELECTED LOG DETAIL',
  'read-only snapshot inspector',
  'Snapshot states',
  'View `L` may read the seven allowlisted files while active'
]) {
  assertIncludes(docs, marker, 'logs shell docs marker');
}
for (const label of logLabels) assertIncludes(docs, label, `docs log label ${label}`);

console.log('terminal_demo_logs_view_shell: PASS');
console.log('verified: View L logs snapshot inspector labels/detail panel, read-only boundary, no runtime side effects, View 0/View 6 contracts preserved');
