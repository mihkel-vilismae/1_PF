#!/usr/bin/env node
// Proves View 6 fixture buttons stop at the Codex placeholder modal.
// Confirms JSONL evidence records CODEX_DEFERRED and launchesPlayback=false.
// This proof does not launch browser, fullscreen, overlay, worker, or queue playback.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const ansiPattern = /\u001b\[[0-9;]*m/g;
const proofRoot = join(repoRoot, 'runtime_data', 'proofs', 'view6_codex_placeholder');
const logDir = join(proofRoot, 'logs');
const logPath = join(logDir, 'terminal-button-actions.jsonl');
const codexMessage = 'this will be done by Codex';

const buttons = [
  ['1', 'Play fixture image in HTML browser', 'image', 'html_browser'],
  ['2', 'Play fixture video in HTML browser', 'video', 'html_browser'],
  ['3', 'Play fixture image full screen without overlay', 'image', 'fullscreen_no_overlay'],
  ['4', 'Play fixture video full screen without overlay', 'video', 'fullscreen_no_overlay'],
  ['5', 'Show fixture image with address overlay', 'image', 'address_overlay'],
  ['6', 'Show fixture video with address overlay', 'video', 'address_overlay']
];

// Renders View 6 after selecting one fixture button.
function runTerminal(key) {
  return execFileSync(process.execPath, ['--import', 'tsx', 'terminal/demo/src/main.ts', '--adapter=real-demo', `--view6-fixture-button-smoke=${key}`], {
    cwd: repoRoot,
    env: {
      ...process.env,
      TERMINAL_DEMO_COLUMNS: '240',
      NO_COLOR: '1',
      DEMO_LOG_DIR: logDir,
      DEMO_DB_PATH: join(proofRoot, 'demo.sqlite'),
      DEMO_DOWNLOAD_DIR: join(repoRoot, 'generated_test_data'),
      DEMO_RUNTIME_OUTPUT_DIR: join(proofRoot, 'outputs'),
      DEMO_QUEUE_OUTPUT_PATH: join(proofRoot, 'outputs', 'display_queue.json')
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).replace(ansiPattern, '');
}

// Asserts that proof output contains an expected marker.
function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: expected ${expected}`);
}

rmSync(proofRoot, { recursive: true, force: true });
mkdirSync(join(proofRoot, 'outputs'), { recursive: true });
mkdirSync(logDir, { recursive: true });

for (const [key, label, mediaType, mode] of buttons) {
  const output = runTerminal(key);
  assertIncludes(output, 'VIEW 6 CODEX PLACEHOLDER MODAL', `modal title for ${key}`);
  assertIncludes(output, codexMessage, `codex message for ${key}`);
  assertIncludes(output, `Button ${key}: ${label}`, `button label for ${key}`);
  assertIncludes(output, `Fixture media type: ${mediaType}`, `media type for ${key}`);
  assertIncludes(output, `Intended playback mode: ${mode}`, `playback mode for ${key}`);
  assertIncludes(output, 'Real playback launch: not implemented in this ChatGPT slice.', `no launch for ${key}`);
  assertIncludes(output, 'Codex owns browser/fullscreen/address-overlay execution.', `codex owns execution for ${key}`);
}

const events = readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
if (events.length !== buttons.length) throw new Error(`expected ${buttons.length} events, found ${events.length}`);
for (const [key, label, mediaType, mode] of buttons) {
  const event = events.find((candidate) => candidate.buttonKey === key);
  if (!event) throw new Error(`missing event for button ${key}`);
  if (event.view !== '6') throw new Error(`wrong view for ${key}`);
  if (event.button !== label) throw new Error(`wrong button label for ${key}`);
  if (event.action !== 'view6_fixture_playback_codex_placeholder') throw new Error(`wrong action for ${key}`);
  if (event.branchFeature !== 'view6_fixture_playback') throw new Error(`wrong branchFeature for ${key}`);
  if (event.status !== 'CODEX_DEFERRED') throw new Error(`wrong status for ${key}`);
  if (event.mediaType !== mediaType) throw new Error(`wrong media type for ${key}`);
  if (event.playbackMode !== mode) throw new Error(`wrong playback mode for ${key}`);
  if (event.noCron !== true) throw new Error(`noCron not true for ${key}`);
  if (event.launchesPlayback !== false) throw new Error(`playback launched flag wrong for ${key}`);
  if (event.message !== codexMessage) throw new Error(`wrong codex message for ${key}`);
}

console.log('terminal_demo_view6_codex_placeholder: PASS');
console.log('verified: all six fixture buttons open the Codex placeholder modal and write no-playback evidence');
