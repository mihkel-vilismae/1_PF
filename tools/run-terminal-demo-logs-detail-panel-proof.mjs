#!/usr/bin/env node
// Proves View L renders a selected detail panel with bounded preview/tail content.

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

const root = path.join(os.tmpdir(), `pf-view-l-detail-${process.pid}`);
rmSync(root, { recursive: true, force: true });
write(root, 'runtime_data/logs/demo/terminal-button-actions.jsonl', Array.from({ length: 24 }, (_, index) => JSON.stringify({ action: 'view_l_detail', index })).join('\n'));
write(root, 'runtime_data/scheduler/demo/regular-worker.status.json', '{"status":"ready","source":"detail-proof"}\n');

const output = execFileSync(process.execPath, ['--import', 'tsx', 'terminal/demo/src/main.ts', '--adapter=real-demo', '--view-shell-smoke=L'], {
  cwd: repoRoot,
  env: { ...process.env, PHOTOFRAME_REPO_ROOT: root, TERMINAL_DEMO_COLUMNS: '240', NO_COLOR: '1' },
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
}).replace(ansiPattern, '');

for (const marker of [
  'SELECTED LOG DETAIL — terminal-button-actions.jsonl',
  'Path: runtime_data/logs/demo/terminal-button-actions.jsonl',
  'Role: action_log | Kind: jsonl | Status: ready',
  'Size:',
  'Lines: 24',
  'Purpose: Terminal button/action evidence ledger.',
  'Message: JSONL log is readable.',
  '--- tail / preview ---',
  'view_l_detail',
  'index":23'
]) assertIncludes(output, marker, `detail marker ${marker}`);
assertNotIncludes(output, 'index":0', 'bounded tail should not include earliest line');
assertNotIncludes(output, 'No files are tailed or read from this view slice.', 'old shell wording removed');
rmSync(root, { recursive: true, force: true });
console.log('terminal_demo_logs_detail_panel: PASS');
console.log('verified: View L selected detail panel renders bounded tail/preview for selected log');
