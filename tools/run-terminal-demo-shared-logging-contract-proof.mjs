#!/usr/bin/env node
// Proves the shared terminal-demo action logging contract.
// Checks source and docs only; it does not execute runtime side effects.
// The contract is branch-safe for View 0 and View 6 evidence.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();

// Reads a repository text file for contract assertions.
function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

// Asserts that a contract source includes a marker.
function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: expected ${expected}`);
}

// Checks a group of required markers in one text block.
function assertAll(text, markers, label) {
  for (const marker of markers) assertIncludes(text, marker, `${label} marker`);
}

const openspec = read('docs/20_architecture_and_specs/openspec/terminal_demo_shared_logging_openspec.md');
const proof = read('docs/proofs/terminal_demo_shared_logging_contract_proof.md');
const readme = read('terminal/demo/README.md');
const toc = read('docs/table_of_contents.md');
const writer = read('terminal/demo/src/run/TerminalActionLogWriter.ts');

assertAll(writer, [
  'terminal-button-actions.jsonl',
  'branchFeature',
  'view0_map_testing',
  'view6_fixture_playback',
  'noCron'
], 'writer');

assertAll(openspec, [
  'Terminal Demo Shared Logging OpenSpec',
  'runtime_data/logs/demo/terminal-button-actions.jsonl',
  'branchFeature',
  'view0_map_testing',
  'view6_fixture_playback',
  'default_operator',
  'Do not create branch-specific top-level terminal action logs'
], 'openspec');

assertAll(proof, [
  'proof:terminal-demo-shared-logging-contract',
  'runtime_data/logs/demo/terminal-button-actions.jsonl',
  'view0_map_testing',
  'view6_fixture_playback',
  'Does not prove real playback'
], 'proof doc');

assertAll(readme, [
  'Real-demo terminal shared logging contract',
  'terminal_demo_shared_logging_openspec.md',
  'proof:terminal-demo-shared-logging-contract'
], 'README');

assertAll(toc, [
  'terminal_demo_shared_logging_openspec.md',
  'terminal_demo_shared_logging_contract_proof.md'
], 'table of contents');

console.log('terminal_demo_shared_logging_contract: PASS');
console.log('verified: shared branch-safe terminal action logging contract and docs coverage');
