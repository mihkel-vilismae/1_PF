#!/usr/bin/env node
// Proves View L renders a real overview table from read-only snapshots.

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const ansiPattern = /\u001b\[[0-9;]*m/g;
function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: expected ${expected}`);
}
function assertNotIncludes(text, unexpected, label) {
  if (text.includes(unexpected)) throw new Error(`${label}: unexpected ${unexpected}`);
}
function write(root, relativePath, content) {
  const absolute = path.join(root, relativePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

const root = path.join(os.tmpdir(), `pf-view-l-overview-${process.pid}`);
rmSync(root, { recursive: true, force: true });
write(root, 'runtime_data/logs/demo/terminal-button-actions.jsonl', '{"action":"view_l"}\n');
write(root, 'runtime_data/v2_worker_truth/demo/playback-worker.truth.jsonl', '');
write(root, 'runtime_data/v2_worker_truth/demo/screen-worker.truth.jsonl', '{bad}\n');
write(root, 'runtime_data/scheduler/demo/regular-worker.status.json', '{"status":"ready"}\n');
write(root, 'runtime_data/scheduler/demo/playback-worker-status.json', '{bad json}\n');
write(root, 'runtime_data/scheduler/demo/screen-on-off-worker-status.json', '{"payload":"ready"}\n');

const output = execFileSync(process.execPath, ['--import', 'tsx', 'terminal/demo/src/main.ts', '--adapter=real-demo', '--view-shell-smoke=L'], {
  cwd: repoRoot,
  env: { ...process.env, PHOTOFRAME_REPO_ROOT: root, TERMINAL_DEMO_COLUMNS: '240', NO_COLOR: '1' },
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
}).replace(ansiPattern, '');

for (const marker of [
  'VIEW L — LOGS VIEW',
  'read-only snapshot inspector',
  'CORE LOG / STATUS SNAPSHOTS',
  'status',
  'kind',
  'size',
  'lines',
  'terminal-button-actions.jsonl',
  'regular-worker.truth.jsonl',
  'playback-worker.truth.jsonl',
  'screen-worker.truth.jsonl',
  'regular-worker.status.json',
  'playback-worker-status.json',
  'screen-on-off-worker-status.json',
  'ready',
  'missing',
  'empty',
  'invalid_jsonl',
  'invalid_json'
]) assertIncludes(output, marker, `overview marker ${marker}`);
assertNotIncludes(output, 'LOG PANEL PLACEHOLDERS', 'old shell placeholder section');
assertNotIncludes(output, 'shell placeholders only', 'old shell status');
rmSync(root, { recursive: true, force: true });
console.log('terminal_demo_logs_view_overview: PASS');
console.log('verified: View L renders seven-file snapshot overview table with real file states');
