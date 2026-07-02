#!/usr/bin/env node
// Historical compatibility proof for the superseded View 6 Codex placeholder boundary.
// v2.0.18 replaces CODEX_DEFERRED with real fixture playback artifact generation.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const handoff = readFileSync(join(repoRoot, 'docs/20_architecture_and_specs/openspec/terminal_demo_view6_codex_playback_handoff.md'), 'utf8');
for (const marker of [
  'This handoff is complete in v2.0.18.',
  'CODEX_DEFERRED',
  'superseded by real fixture playback artifact generation',
  'action=view6_fixture_playback_real',
  'npm run proof:terminal-demo-view6-real-fixture-playback'
]) {
  if (!handoff.includes(marker)) throw new Error(`superseded handoff missing marker: ${marker}`);
}

execFileSync(process.execPath, [join(repoRoot, 'tools', 'run-terminal-demo-view6-real-fixture-playback-proof.mjs')], {
  cwd: repoRoot,
  env: { ...process.env, NO_COLOR: '1', TERMINAL_DEMO_COLUMNS: '240' },
  stdio: 'inherit'
});

console.log('terminal_demo_view6_codex_placeholder: PASS');
console.log('verified: historical Codex placeholder boundary is superseded by real fixture playback proof');
