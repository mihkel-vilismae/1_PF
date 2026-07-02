#!/usr/bin/env node
// Proves TerminalLogsSnapshotReader reads exactly the allowlisted View L files safely.
// The proof creates isolated fixture files, then confirms the reader does not mutate them.

import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const readerPath = path.join(repoRoot, 'terminal/demo/src/logs/TerminalLogsSnapshotReader.ts');
const { readTerminalLogsSnapshots } = await import(pathToFileURL(readerPath).href);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function write(root, relativePath, content) {
  const absolute = path.join(root, relativePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
  return absolute;
}

function fileState(absolutePath) {
  if (!existsSync(absolutePath)) return null;
  const stats = statSync(absolutePath);
  return { size: stats.size, content: readFileSync(absolutePath, 'utf8') };
}

const root = path.join(os.tmpdir(), `pf-view-l-reader-${process.pid}`);
rmSync(root, { recursive: true, force: true });
const files = new Map();
files.set('terminal_actions', write(root, 'runtime_data/logs/demo/terminal-button-actions.jsonl', '{"action":"one"}\n{"action":"two"}\n'));
files.set('playback_worker_truth', write(root, 'runtime_data/v2_worker_truth/demo/playback-worker.truth.jsonl', ''));
files.set('screen_worker_truth', write(root, 'runtime_data/v2_worker_truth/demo/screen-worker.truth.jsonl', '{not json}\n'));
files.set('regular_worker_status', write(root, 'runtime_data/scheduler/demo/regular-worker.status.json', '{"status":"ready","count":1}\n'));
files.set('playback_worker_status', write(root, 'runtime_data/scheduler/demo/playback-worker-status.json', '{bad json}\n'));
files.set('screen_worker_status', write(root, 'runtime_data/scheduler/demo/screen-on-off-worker-status.json', '{"payload":"this file is intentionally too large for the bounded reader proof and should not be parsed as json because it exceeds the max byte limit"}\n'));
const before = new Map([...files].map(([id, absolute]) => [id, fileState(absolute)]));

const snapshots = readTerminalLogsSnapshots({ runtimeRoot: root, maxBytes: 64, previewLineLimit: 1, tailLineLimit: 2 });
assert(snapshots.length === 7, `expected 7 snapshots, got ${snapshots.length}`);
const byId = new Map(snapshots.map((snapshot) => [snapshot.entry.id, snapshot]));
assert(byId.get('terminal_actions')?.status === 'ready', 'terminal actions should be ready JSONL');
assert(byId.get('regular_worker_truth')?.status === 'missing', 'regular worker truth should be missing');
assert(byId.get('playback_worker_truth')?.status === 'empty', 'playback truth should be empty');
assert(byId.get('screen_worker_truth')?.status === 'invalid_jsonl', 'screen truth should be invalid JSONL');
assert(byId.get('regular_worker_status')?.status === 'ready', 'regular worker status should be ready JSON');
assert(byId.get('playback_worker_status')?.status === 'invalid_json', 'playback worker status should be invalid JSON');
assert(byId.get('screen_worker_status')?.status === 'too_large', 'screen worker status should be too_large');
assert(byId.get('terminal_actions')?.lineCount === 2, 'ready JSONL line count should be 2');
assert(byId.get('regular_worker_status')?.previewLines.length === 1, 'ready JSON preview should be bounded');
assert(!existsSync(path.join(root, 'runtime_data/v2_worker_truth/demo/regular-worker.truth.jsonl')), 'reader must not create missing files');
for (const [id, absolute] of files) {
  const after = fileState(absolute);
  assert(JSON.stringify(before.get(id)) === JSON.stringify(after), `reader mutated fixture ${id}`);
}

const readerSource = readFileSync(readerPath, 'utf8');
for (const forbidden of ['writeFile', 'appendFile', 'mkdir', 'rmSync', 'watchFile', 'createWriteStream']) {
  assert(!readerSource.includes(forbidden), `reader source must not contain ${forbidden}`);
}
rmSync(root, { recursive: true, force: true });
console.log('terminal_demo_logs_snapshot_reader: PASS');
console.log('verified: seven allowlisted snapshots, missing/empty/ready/invalid/too_large states, and read-only behavior');
