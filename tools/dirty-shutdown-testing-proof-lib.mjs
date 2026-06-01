/**
 * Dirty-shutdown testing proof library for PF_login.
 * Runs deterministic tests for the View C testing panel and backend guard service.
 * Proves first-version safety boundaries without killing OS processes.
 * Writes sanitized proof envelopes through shared proof helpers.
 */
import { buildLocalTsxTestCommand, createProofEnvelope, getProofEnvironment, runCommand } from './proof-utils.mjs';

const TARGETED_TESTS = Object.freeze([
  'tests/viewCTestingPanel.test.js',
  'tests/dirtyShutdownTestingService.test.js',
]);

/** Returns the targeted command that proves dirty-shutdown testing safeguards. */
export function buildDirtyShutdownTestingProofCommand() {
  return buildLocalTsxTestCommand([...TARGETED_TESTS]);
}

/** Runs the deterministic dirty-shutdown testing proof and returns a proof envelope. */
export async function runDirtyShutdownTestingProof({ metadata, cwd = process.cwd() }) {
  const command = buildDirtyShutdownTestingProofCommand();
  const testResult = await runCommand(command.command, command.args, {
    cwd,
    timeoutMs: 180000,
    forceKillGraceMs: 5000,
  });
  const passed = testResult.exitCode === 0;

  return createProofEnvelope({
    proofKind: 'dirty_shutdown_testing',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: passed ? 'PASSED' : (testResult.timedOut ? 'TIMED_OUT' : 'FAILED'),
    runtimeMode: 'deterministic_local',
    evidence: {
      environment: getProofEnvironment(),
      targeted_tests: TARGETED_TESTS,
      command_result: testResult,
      verified_contracts: [
        'View C TESTING panel renders only in Test Mode',
        'Dirty-shutdown simulation is blocked by default',
        'Dirty-shutdown simulation requires PF_ENABLE_DIRTY_SHUTDOWN_TESTING=true and Test Mode',
        'Process targeting is scoped to app-owned process records',
        'Generic process-name targeting is rejected',
        'Backend self-kill is blocked in the first safe version',
        'No OS process termination is attempted by deterministic proof code',
      ],
    },
    knownLimitations: passed
      ? [
          'This proof is deterministic and local; it does not prove real power loss.',
          'The first safe version does not terminate backend or OS processes.',
          'A later opt-in live recovery slice is needed before real dirty-shutdown execution.',
        ]
      : ['The dirty-shutdown testing safeguard proof did not complete successfully.'],
  });
}
