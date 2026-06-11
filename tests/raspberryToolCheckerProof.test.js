/**
 * Raspberry local tool checker proof guard.
 * Ensures the first Raspberry implementation slice remains a preflight only and
 * cannot claim Raspberry playback/recovery from source code or non-target runs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  REQUIRED_RASPBERRY_TOOLS,
  detectRaspberryTarget,
  determineRaspberryToolCheckerStatus,
} from '../tools/raspberry-tool-checker-lib.mjs';

const openSpecPath = 'docs/20_architecture_and_specs/openspec/raspberry_local_tool_checker_openspec.md';
const proofDocPath = 'docs/proofs/raspberry_tool_checker_proof.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('Raspberry tool checker docs and runner are wired', () => {
  assert.equal(existsSync(openSpecPath), true);
  assert.equal(existsSync(proofDocPath), true);
  assert.equal(existsSync('tools/raspberry-tool-checker-lib.mjs'), true);
  assert.equal(existsSync('tools/run-raspberry-tool-checker-proof.mjs'), true);
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts['proof:raspberry-tool-checker'], 'node tools/run-raspberry-tool-checker-proof.mjs');
  assert.match(read('docs/proofs/README.md'), /npm run proof:raspberry-tool-checker/);
});

test('Raspberry target detection records explicit test override', () => {
  const detected = detectRaspberryTarget({
    env: { PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET: 'true' },
    platform: 'win32',
    arch: 'x64',
  });
  assert.equal(detected.raspberry_like, true);
  assert.equal(detected.explicit_override_used, true);
});

test('tool checker status only passes on Raspberry-like target with all tools available', () => {
  const availableTools = REQUIRED_RASPBERRY_TOOLS.map((tool) => ({ name: tool.name, available: true }));
  const missingTools = REQUIRED_RASPBERRY_TOOLS.map((tool, index) => ({ name: tool.name, available: index !== 0 }));

  assert.equal(determineRaspberryToolCheckerStatus({ target: { raspberry_like: true }, tools: availableTools }).proofStatus, 'PASSED');
  assert.equal(determineRaspberryToolCheckerStatus({ target: { raspberry_like: false }, tools: availableTools }).proofStatus, 'BLOCKED');
  assert.equal(determineRaspberryToolCheckerStatus({ target: { raspberry_like: true }, tools: missingTools }).proofStatus, 'BLOCKED');
});

test('Raspberry tool checker OpenSpec preserves non-claims and install boundary', () => {
  const text = read(openSpecPath);
  assert.match(text, /preflight only/);
  assert.match(text, /does not install `mpv`, `ffmpeg`, or `ffprobe`/);
  assert.match(text, /Do not vendor Raspberry binaries into Git/);
  assert.match(text, /do not prove:[\s\S]*Raspberry native image playback/);
  assert.match(text, /do not prove:[\s\S]*power-loss recovery/);
});
