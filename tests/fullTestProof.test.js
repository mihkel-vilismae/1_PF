/**
 * Tests the full test-suite stability proof helpers.
 * Verifies command construction, output parsing, and honest proof statuses.
 * Keeps the expensive full-suite execution inside the opt-in proof command.
 * Protects proof evidence from ambiguous timeout or failure reporting.
 */
import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';

import {
  buildFullTestProofCommand,
  buildFullTestProofEnvelope,
  classifyFullTestProofStatus,
  parseNodeTestCounts,
} from '../tools/full-test-proof-lib.mjs';

/** Verifies the proof command uses local tsx and serial test execution. */
test('full test proof command uses local tsx without shell-dependent npx lookup', () => {
  const command = buildFullTestProofCommand();

  assert.equal(command.command, process.execPath);
  assert.match(command.args[0], /tsx[/\\](?:dist[/\\])?cli\.mjs$/);
  assert.ok(command.args.includes('--test'));
  assert.ok(command.args.includes('--test-concurrency=1'));
  assert.ok(command.args.includes('--test-reporter=spec'));
});

/** Verifies Node summary parsing works for spec-style output. */
test('full test proof parses Node spec summary counts', () => {
  const counts = parseNodeTestCounts(`\nℹ tests 389\nℹ suites 0\nℹ pass 389\nℹ fail 0\nℹ cancelled 0\nℹ skipped 0\nℹ todo 0\nℹ duration_ms 12345.67\n`);

  assert.deepEqual(counts, {
    total: 389,
    suites: 0,
    passed: 389,
    failed: 0,
    skipped: 0,
    cancelled: 0,
    todo: 0,
    duration_ms_reported: 12345.67,
  });
});

/** Verifies pass, fail, and timeout statuses stay distinct. */
test('full test proof classifies pass fail and timeout distinctly', () => {
  assert.equal(classifyFullTestProofStatus({ exitCode: 0, timedOut: false }), 'PASSED');
  assert.equal(classifyFullTestProofStatus({ exitCode: 1, timedOut: false }), 'FAILED');
  assert.equal(classifyFullTestProofStatus({ exitCode: null, timedOut: true }), 'TIMED_OUT');
});

/** Verifies envelope evidence captures command, counts, and timeout status honestly. */
test('full test proof envelope records structured command evidence', () => {
  const testCommand = buildFullTestProofCommand();
  const envelope = buildFullTestProofEnvelope({
    metadata: { version: '0.7.45', gitCommit: 'abc123' },
    testCommand,
    timeoutMs: 600000,
    testResult: {
      exitCode: 0,
      signal: null,
      timedOut: false,
      durationMs: 321,
      stdout: 'ℹ tests 2\nℹ pass 2\nℹ fail 0\n',
      stderr: '',
    },
  });

  assert.equal(envelope.proof_kind, 'full_test_suite_stability');
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.timeout_ms, 600000);
  assert.equal(envelope.evidence.test_counts.total, 2);
  assert.equal(envelope.evidence.test_counts.passed, 2);
  assert.equal(envelope.evidence.test_counts.failed, 0);
  assert.equal(envelope.evidence.command_parts.executable, process.execPath);
});

/** Verifies timed-out evidence does not claim a full-suite pass. */
test('full test proof envelope reports timeout without claiming pass', () => {
  const testCommand = buildFullTestProofCommand();
  const envelope = buildFullTestProofEnvelope({
    metadata: { version: '0.7.45', gitCommit: 'abc123' },
    testCommand,
    timeoutMs: 1,
    testResult: {
      exitCode: null,
      signal: 'SIGTERM',
      timedOut: true,
      durationMs: 1000,
      stdout: 'partial output',
      stderr: '',
    },
  });

  assert.equal(envelope.proof_status, 'TIMED_OUT');
  assert.equal(envelope.evidence.timed_out, true);
  assert.match(envelope.known_limitations.join('\n'), /no full-suite pass is claimed/i);
});
