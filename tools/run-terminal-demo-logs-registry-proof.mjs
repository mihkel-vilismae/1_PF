#!/usr/bin/env node
// Proves View L owns a canonical seven-file log/status/truth allowlist.
// This proof intentionally checks registry source purity and does not create runtime files.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const registryPath = path.join(repoRoot, 'terminal/demo/src/logs/TerminalLogsRegistry.ts');
const viewRegistryPath = path.join(repoRoot, 'terminal/demo/src/views/TerminalLogsViewRegistry.ts');

const expectedEntries = [
  ['terminal_actions', 'terminal-button-actions.jsonl', 'runtime_data/logs/demo/terminal-button-actions.jsonl', 'jsonl', 'action_log'],
  ['regular_worker_truth', 'regular-worker.truth.jsonl', 'runtime_data/v2_worker_truth/demo/regular-worker.truth.jsonl', 'jsonl', 'truth_log'],
  ['playback_worker_truth', 'playback-worker.truth.jsonl', 'runtime_data/v2_worker_truth/demo/playback-worker.truth.jsonl', 'jsonl', 'truth_log'],
  ['screen_worker_truth', 'screen-worker.truth.jsonl', 'runtime_data/v2_worker_truth/demo/screen-worker.truth.jsonl', 'jsonl', 'truth_log'],
  ['regular_worker_status', 'regular-worker.status.json', 'runtime_data/scheduler/demo/regular-worker.status.json', 'json', 'status_snapshot'],
  ['playback_worker_status', 'playback-worker-status.json', 'runtime_data/scheduler/demo/playback-worker-status.json', 'json', 'status_snapshot'],
  ['screen_worker_status', 'screen-on-off-worker-status.json', 'runtime_data/scheduler/demo/screen-on-off-worker-status.json', 'json', 'status_snapshot']
];

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

const moduleUrl = pathToFileURL(registryPath).href;
const { terminalLogsRegistry } = await import(moduleUrl);
assert(Array.isArray(terminalLogsRegistry), 'terminalLogsRegistry must be an array');
assert(terminalLogsRegistry.length === 7, `registry must contain exactly 7 entries, got ${terminalLogsRegistry.length}`);

const ids = new Set();
const labels = new Set();
const paths = new Set();
for (let index = 0; index < expectedEntries.length; index += 1) {
  const [id, label, relativePath, kind, role] = expectedEntries[index];
  const entry = terminalLogsRegistry[index];
  assert(entry.id === id, `entry ${index + 1} id mismatch`);
  assert(entry.label === label, `entry ${index + 1} label mismatch`);
  assert(entry.relativePath === relativePath, `entry ${index + 1} path mismatch`);
  assert(entry.kind === kind, `entry ${index + 1} kind mismatch`);
  assert(entry.role === role, `entry ${index + 1} role mismatch`);
  assert(typeof entry.purpose === 'string' && entry.purpose.length > 20, `entry ${index + 1} purpose must be descriptive`);
  ids.add(entry.id);
  labels.add(entry.label);
  paths.add(entry.relativePath);
}
assert(ids.size === 7, 'registry ids must be unique');
assert(labels.size === 7, 'registry labels must be unique');
assert(paths.size === 7, 'registry paths must be unique');

const registrySource = readFileSync(registryPath, 'utf8');
for (const forbidden of ['node:fs', 'node:path', 'readFile', 'writeFile', 'appendFile', 'watchFile', 'mkdir', 'rmSync']) {
  assert(!registrySource.includes(forbidden), `canonical registry must not use runtime file API: ${forbidden}`);
}
for (const marker of ['TerminalLogFileKind', 'TerminalLogFileRole', 'TerminalLogRegistryEntry', 'terminalLogsRegistry']) {
  assert(registrySource.includes(marker), `registry source must include ${marker}`);
}

const viewRegistrySource = readFileSync(viewRegistryPath, 'utf8');
assert(viewRegistrySource.includes("../logs/TerminalLogsRegistry.js"), 'View L shell registry must derive from canonical TerminalLogsRegistry');
assert(!viewRegistrySource.includes('runtime_data/logs/demo/terminal-button-actions.jsonl'), 'View shell registry must not duplicate canonical runtime paths');

console.log('terminal_demo_logs_registry: PASS');
console.log('verified: canonical View L registry contains exactly seven allowed log/status/truth entries and has no runtime file side effects');
