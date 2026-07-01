#!/usr/bin/env node
// Proves the View 0 default 0A route and shared JSONL evidence.
// Runs the terminal entrypoint directly through Node/tsx to avoid nested npm issues.
// This proof is local and does not claim workers, DB writes, playback, or cron.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const repoRoot = process.cwd();
const ansiPattern = /\u001b\[[0-9;]*m/g;

// Renders the real-demo terminal for a focused smoke argument set.
function runTerminal(args, env) {
  return execFileSync(process.execPath, ['--import', 'tsx', 'terminal/demo/src/main.ts', '--adapter=real-demo', ...args], {
    cwd: repoRoot,
    env: { ...process.env, ...env, TERMINAL_DEMO_COLUMNS: '240', NO_COLOR: '1' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).replace(ansiPattern, '');
}

// Reads a repository text file for documentation coverage checks.
function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

// Asserts that proof output contains an expected marker.
function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: expected ${expected}`);
}

// Asserts exact values in rendered output or parsed JSONL events.
function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

const logDir = join(mkdtempSync(join(tmpdir(), 'pf-view0-route-proof-')), 'logs');
const rendered = runTerminal(['--view0-default-test-route-smoke'], { DEMO_LOG_DIR: logDir });
assertIncludes(rendered, 'TEST PAGE 0A', 'default test page title');
assertIncludes(rendered, 'Route proof target: 0 -> Enter -> Enter -> Enter -> 0A', 'route proof text');
assertIncludes(rendered, 'Default character accepted: A', 'character default text');

const logPath = join(logDir, 'terminal-button-actions.jsonl');
const events = readFileSync(logPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
const actions = events.map((event) => event.action);
assertEqual(actions.join(','), [
  'view0_opened',
  'view0_test_selector_opened',
  'view0_test_integer_selected',
  'view0_test_page_route_completed'
].join(','), 'logged action order');

for (const event of events) {
  assertEqual(event.source, 'terminal-demo', `${event.action} source`);
  assertEqual(event.view, '0', `${event.action} view`);
  assertEqual(event.branchFeature, 'view0_map_testing', `${event.action} branchFeature`);
  assertEqual(event.noCron, true, `${event.action} noCron`);
}

const finalEvent = events.at(-1);
assertEqual(finalEvent.targetTestPage, '0A', 'final target test page');
assertEqual(finalEvent.result, 'TEST_PAGE_ROUTE_READY', 'final result');
assertEqual(finalEvent.inputSequence.join(' -> '), '0 -> Enter -> Enter -> Enter', 'final input sequence');
assertEqual(finalEvent.selectedInteger, 0, 'selected integer default');
assertEqual(finalEvent.selectedCharacter, 'A', 'selected character default');

const docs = [
  'docs/20_architecture_and_specs/openspec/terminal_demo_view0_default_test_route_openspec.md',
  'docs/proofs/terminal_demo_view0_default_test_route_proof.md',
  'terminal/demo/README.md',
  'CHANGELOG.md'
].map(read).join('\n');
for (const marker of [
  'map and testing - view 0',
  '0 -> Enter -> Enter -> Enter -> 0A',
  'runtime_data/logs/demo/terminal-button-actions.jsonl',
  'view0_test_page_route_completed',
  'TEST_PAGE_ROUTE_READY',
  'proof:terminal-demo-view0-default-test-route'
]) assertIncludes(docs, marker, 'docs coverage');

console.log('terminal_demo_view0_default_test_route: PASS');
console.log('verified: 0 -> Enter -> Enter -> Enter reaches test page 0A and writes shared JSONL evidence');
