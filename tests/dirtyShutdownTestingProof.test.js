/*
 * Tests the dirty-shutdown testing proof runner.
 * The proof must verify safety contracts without terminating processes.
 * It returns a standard proof envelope using the shared proof schema.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDirtyShutdownTestingProofCommand,
  runDirtyShutdownTestingProof,
} from '../tools/dirty-shutdown-testing-proof-lib.mjs';

test('dirty-shutdown testing proof command targets panel and service tests', () => {
  const command = buildDirtyShutdownTestingProofCommand();
  assert.equal(command.command, 'npx');
  assert.deepEqual(command.args.slice(0, 2), ['tsx', '--test']);
  assert.ok(command.args.includes('tests/viewCTestingPanel.test.js'));
  assert.ok(command.args.includes('tests/dirtyShutdownTestingService.test.js'));
});

test('dirty-shutdown testing proof passes deterministic safeguards', async () => {
  const envelope = await runDirtyShutdownTestingProof({ metadata: { version: '0.7.34', gitCommit: 'test' } });
  assert.equal(envelope.proof_status, 'PASSED', JSON.stringify(envelope.evidence.command_result, null, 2));
  assert.ok(envelope.evidence.verified_contracts.includes('View C TESTING panel renders only in Test Mode'));
  assert.match(envelope.known_limitations.join('\n'), /does not terminate backend or OS processes/);
});
