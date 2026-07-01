#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const ansiPattern = /\u001b\[[0-9;]*m/g;

function runTerminal(args) {
  const output = execFileSync(npmCommand, ['run', '-s', 'demo:terminal:real', '--', ...args], {
    cwd: repoRoot,
    env: { ...process.env, TERMINAL_DEMO_COLUMNS: '240' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return output.replace(ansiPattern, '');
}

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) {
    throw new Error(`${label}: expected to include ${expected}`);
  }
}

function assertNotIncludes(text, unexpected, label) {
  if (text.includes(unexpected)) {
    throw new Error(`${label}: expected not to include ${unexpected}`);
  }
}

const baseline = runTerminal(['--real-demo-smoke']);
assertNotIncludes(baseline, 'L-3 ACTIONS', 'baseline header IDs hidden');
assertNotIncludes(baseline, 'C-2 PLAYBACK', 'baseline center header IDs hidden');
assertNotIncludes(baseline, 'R-1 RPI-STAGES', 'baseline right header IDs hidden');

const overlay = runTerminal(['--section-header-ids-smoke']);
for (const marker of [
  'L-1 PHOTOFRAME REAL DEMO TERMINAL',
  'L-2 GENERATED DEMO MEDIA',
  'L-3 ACTIONS',
  'L-4 ICLOUDPD AUTHORIZATION',
  'C-1 CURRENT RUN',
  'C-2 PLAYBACK',
  'C-3 SCREEN ON/OFF WORKER',
  'C-4 PLAYBACK_QUEUE',
  'R-1 RPI-STAGES',
  'R-2 RPI-WORKERS',
  'R-3 STORYBOARD / INSPECTOR',
  'R-4 AREA A REAL-TIME LOG'
]) {
  assertIncludes(overlay, marker, 'overlay visible marker');
}
assertIncludes(overlay, 'H pressed: section header IDs shown.', 'overlay status message');
assertIncludes(overlay, 'H toggles section header IDs', 'operator help copy');

const modalOverlay = runTerminal(['--start-stage-modal-section-ids-smoke']);
assertIncludes(modalOverlay, 'L-5 START STAGE MODAL', 'modal overlay marker');

const docs = [
  'terminal/demo/README.md',
  'docs/20_architecture_and_specs/openspec/terminal_demo_section_header_ids_openspec.md',
  'docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md',
  'docs/proofs/terminal_demo_section_header_ids_proof.md'
].map(read).join('\n');
for (const marker of [
  'Pane',
  'Section',
  'SectionHeader',
  'SectionBody',
  'section_header_id_overlay',
  'H',
  'L-3 ACTIONS',
  'L-4 ICLOUDPD AUTHORIZATION',
  'C-2 PLAYBACK',
  'R-1 RPI-STAGES'
]) {
  assertIncludes(docs, marker, 'docs coverage');
}

console.log('terminal_demo_section_header_ids: PASS');
console.log('verified: H toggles header prefixes, default view stays unprefixed, auth gets L-4, modal gets L-5, docs/default-settings coverage exists');
