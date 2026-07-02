#!/usr/bin/env node
// Proves View 6 fixture buttons generate real browser-renderable playback artifacts.
// This proof does not launch a browser in CI/proof mode and does not use queue/DB/cron/workers.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const ansiPattern = /\u001b\[[0-9;]*m/g;
const proofRoot = join(repoRoot, 'runtime_data', 'proofs', 'view6_real_fixture_playback');
const logDir = join(proofRoot, 'logs');
const outputDir = join(proofRoot, 'outputs');
const logPath = join(logDir, 'terminal-button-actions.jsonl');

const buttons = [
  ['1', 'Play fixture image in HTML browser', 'image', 'html_browser', 'img', false, false],
  ['2', 'Play fixture video in HTML browser', 'video', 'html_browser', 'video', false, false],
  ['3', 'Play fixture image full screen without overlay', 'image', 'fullscreen_no_overlay', 'img', true, false],
  ['4', 'Play fixture video full screen without overlay', 'video', 'fullscreen_no_overlay', 'video', true, false],
  ['5', 'Show fixture image with address overlay', 'image', 'address_overlay', 'img', false, true],
  ['6', 'Show fixture video with address overlay', 'video', 'address_overlay', 'video', false, true]
];

function runTerminal(key) {
  return execFileSync(process.execPath, ['--import', 'tsx', 'terminal/demo/src/main.ts', '--adapter=real-demo', `--view6-fixture-button-smoke=${key}`], {
    cwd: repoRoot,
    env: {
      ...process.env,
      TERMINAL_DEMO_COLUMNS: '240',
      NO_COLOR: '1',
      TERMINAL_DEMO_VIEW6_PLAYBACK_PROOF: '1',
      DEMO_LOG_DIR: logDir,
      DEMO_DB_PATH: join(proofRoot, 'demo.sqlite'),
      DEMO_DOWNLOAD_DIR: join(repoRoot, 'generated_test_data'),
      DEMO_RUNTIME_OUTPUT_DIR: outputDir,
      DEMO_QUEUE_OUTPUT_PATH: join(outputDir, 'display_queue.json')
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).replace(ansiPattern, '');
}

function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label}: expected ${expected}`);
}

function assertNotIncludes(text, unexpected, label) {
  if (text.includes(unexpected)) throw new Error(`${label}: unexpected ${unexpected}`);
}

function read(relativeOrAbsolutePath) {
  return readFileSync(relativeOrAbsolutePath, 'utf8');
}

rmSync(proofRoot, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
mkdirSync(logDir, { recursive: true });

for (const [key, label, mediaType, mode, element, expectsFullscreen, expectsOverlay] of buttons) {
  const output = runTerminal(key);
  assertIncludes(output, 'VIEW 6 REAL FIXTURE PLAYBACK', `real playback title for ${key}`);
  assertIncludes(output, `Button ${key}: ${label}`, `button label for ${key}`);
  assertIncludes(output, `Fixture media type: ${mediaType}`, `media type for ${key}`);
  assertIncludes(output, `Playback mode: ${mode}`, `mode for ${key}`);
  assertIncludes(output, 'Viewer artifact status: rendered', `rendered artifact for ${key}`);
  if (!output.includes('Viewer open skipped in proof mode; HTML playback artifact was written.') && !output.includes('Viewer open skipped outside Windows; HTML playback artifact was written.')) {
    throw new Error(`proof open skip for ${key}: expected proof-mode or non-Windows open skip`);
  }
  assertIncludes(output, 'Queue-backed playback remains disabled; this uses hard-coded fixture files only.', `queue disabled for ${key}`);
  assertIncludes(output, 'No DB writes, cron, auth, worker execution, or queue execution ran.', `no side effects for ${key}`);
  assertNotIncludes(output, 'this will be done by Codex', `codex placeholder removed for ${key}`);
  assertNotIncludes(output, 'CODEX_DEFERRED', `codex result removed for ${key}`);

  const viewerPath = join(outputDir, 'view6-fixture-playback', `button-${key}-${mediaType}-${mode}.html`);
  if (!existsSync(viewerPath)) throw new Error(`viewer artifact missing for ${key}: ${viewerPath}`);
  const html = read(viewerPath);
  assertIncludes(html, 'data-view="6"', `viewer data view for ${key}`);
  assertIncludes(html, 'data-source="fixture"', `viewer source for ${key}`);
  assertIncludes(html, `data-playback-mode="${mode}"`, `viewer mode for ${key}`);
  assertIncludes(html, `data-media-type="${mediaType}"`, `viewer media type for ${key}`);
  assertIncludes(html, `<${element}`, `viewer media element for ${key}`);
  assertIncludes(html, 'View 6 fixture playback', `viewer badge for ${key}`);
  const fixturePath = mediaType === 'image'
    ? join(repoRoot, 'terminal/demo/test_data/playback_fixtures/gps_valid_01.jpg')
    : join(repoRoot, 'terminal/demo/test_data/playback_fixtures/gps_valid_video_02_tartu.mp4');
  assertIncludes(html, pathToFileURL(fixturePath).href, `viewer fixture url for ${key}`);
  if (expectsFullscreen) assertIncludes(html, 'requestFullscreen', `fullscreen script for ${key}`);
  if (!expectsFullscreen) assertNotIncludes(html, 'requestFullscreen', `no fullscreen script for ${key}`);
  if (expectsOverlay) assertIncludes(html, 'Fixture address overlay', `address overlay for ${key}`);
  if (!expectsOverlay) assertNotIncludes(html, 'Fixture address overlay', `no address overlay for ${key}`);
}

const events = readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
if (events.length !== buttons.length) throw new Error(`expected ${buttons.length} events, found ${events.length}`);
for (const [key, label, mediaType, mode] of buttons) {
  const event = events.find((candidate) => candidate.buttonKey === key);
  if (!event) throw new Error(`missing event for button ${key}`);
  if (event.view !== '6') throw new Error(`wrong view for ${key}`);
  if (event.button !== label) throw new Error(`wrong button label for ${key}`);
  if (event.action !== 'view6_fixture_playback_real') throw new Error(`wrong action for ${key}`);
  if (event.branchFeature !== 'view6_fixture_playback') throw new Error(`wrong branchFeature for ${key}`);
  if (event.status !== 'rendered') throw new Error(`wrong status for ${key}: ${event.status}`);
  if (event.result !== 'VIEW6_FIXTURE_PLAYBACK_READY') throw new Error(`wrong result for ${key}: ${event.result}`);
  if (event.mediaType !== mediaType) throw new Error(`wrong media type for ${key}`);
  if (event.playbackMode !== mode) throw new Error(`wrong playback mode for ${key}`);
  if (event.noCron !== true) throw new Error(`noCron not true for ${key}`);
  if (event.viewerWritten !== true) throw new Error(`viewerWritten not true for ${key}`);
  if (event.queueBacked !== false || event.dbWrites !== false || event.workers !== false || event.auth !== false) {
    throw new Error(`side-effect flags wrong for ${key}`);
  }
}

console.log('terminal_demo_view6_real_fixture_playback: PASS');
console.log('verified: all six View 6 fixture buttons generate browser-renderable HTML playback artifacts with JSONL evidence');
