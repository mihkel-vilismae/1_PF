/**
 * Raspberry generated fixture proof guard.
 * These tests do not require Raspberry hardware and do not run ffprobe over fixtures.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  determineRaspberryGeneratedFixtureProofStatus,
  RASPBERRY_GENERATED_FIXTURE_REQUIRED_TOOLS,
} from '../tools/raspberry-generated-fixture-proof-lib.mjs';

const openSpecPath = 'docs/20_architecture_and_specs/openspec/raspberry_generated_fixture_proof_openspec.md';
const proofDocPath = 'docs/proofs/raspberry_generated_fixture_proof.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

function tools(available = true) {
  return RASPBERRY_GENERATED_FIXTURE_REQUIRED_TOOLS.map((tool) => ({ name: tool.name, available }));
}

test('Raspberry generated fixture proof docs, package script, and runner are wired', () => {
  assert.equal(existsSync(openSpecPath), true);
  assert.equal(existsSync(proofDocPath), true);
  assert.equal(existsSync('tools/raspberry-generated-fixture-proof-lib.mjs'), true);
  assert.equal(existsSync('tools/run-raspberry-generated-fixture-proof.mjs'), true);
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts['proof:raspberry-generated-fixtures'], 'node tools/run-raspberry-generated-fixture-proof.mjs');
  assert.match(read('docs/proofs/README.md'), /npm run proof:raspberry-generated-fixtures/);
});

test('status contract blocks off-target and missing tools, passes only when validator succeeds on target', () => {
  assert.equal(determineRaspberryGeneratedFixtureProofStatus({
    target: { raspberry_like: false },
    requiredTools: tools(true),
    validatorResult: { exitCode: 0, timedOut: false },
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryGeneratedFixtureProofStatus({
    target: { raspberry_like: true },
    requiredTools: tools(false),
    validatorResult: null,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryGeneratedFixtureProofStatus({
    target: { raspberry_like: true },
    requiredTools: tools(true),
    validatorResult: { exitCode: 0, timedOut: false },
  }).proofStatus, 'PASSED');

  assert.equal(determineRaspberryGeneratedFixtureProofStatus({
    target: { raspberry_like: true },
    requiredTools: tools(true),
    validatorResult: { exitCode: 1, timedOut: false },
  }).proofStatus, 'FAILED');
});

test('OpenSpec keeps proof narrow and non-claims explicit', () => {
  const spec = read(openSpecPath);
  assert.match(spec, /Raspberry-like target detection/);
  assert.match(spec, /python3/);
  assert.match(spec, /ffprobe/);
  assert.match(spec, /generated_test_data/);
  assert.match(spec, /does not start native playback/);
  assert.match(spec, /do not prove:[\s\S]*Raspberry native image playback/i);
  assert.match(spec, /do not prove:[\s\S]*power-loss recovery/i);
});
