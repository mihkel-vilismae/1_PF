#!/usr/bin/env node
// Aggregates View 6 fixture contract and real fixture playback after Codex handoff completion.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const proofScripts = [
  'run-terminal-demo-view6-fixture-playback-contract-proof.mjs',
  'run-terminal-demo-view6-codex-placeholder-proof.mjs',
  'run-terminal-demo-view6-real-fixture-playback-proof.mjs'
];
for (const script of proofScripts) {
  execFileSync(process.execPath, [join(repoRoot, 'tools', script)], {
    cwd: repoRoot,
    env: { ...process.env, NO_COLOR: '1', TERMINAL_DEMO_COLUMNS: '240' },
    stdio: 'inherit'
  });
}

const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
for (const script of [
  'proof:terminal-demo-view6-fixture-playback-contract',
  'proof:terminal-demo-view6-codex-placeholder',
  'proof:terminal-demo-view6-real-fixture-playback'
]) {
  if (!packageJson.scripts?.[script]) throw new Error(`missing package script ${script}`);
}

const source = [
  'terminal/demo/src/playback/View6PlaybackContract.ts',
  'terminal/demo/src/playback/View6FixturePlayback.ts',
  'terminal/demo/src/ui/renderViewSixPlayback.ts'
].map((relativePath) => readFileSync(join(repoRoot, relativePath), 'utf8')).join('\n');
for (const marker of [
  'runView6FixturePlayback',
  'VIEW6_FIXTURE_PLAYBACK_READY',
  'view6_fixture_playback_real',
  'viewerWritten',
  'queueBacked: false'
]) {
  if (!source.includes(marker)) throw new Error(`View 6 real playback source missing marker: ${marker}`);
}

console.log('terminal_demo_view6_codex_placeholder_complete: PASS');
console.log('verified: View 6 Codex handoff is complete and superseded by real fixture playback');
