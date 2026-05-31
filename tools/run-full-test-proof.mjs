/**
 * Full test suite proof runner for PF_login.
 * Executes the project test command and writes a sanitized proof JSON artifact.
 * The wrapper does not change test semantics or hide failures.
 * Generated output lives under runtime_data/proofs and is ignored by Git.
 * Intended for local verification before claiming full-suite stability.
 */
import process from 'node:process';
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';

/** Reads project version and short commit. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Parses Node test summary counts when present. */
function parseNodeTestCounts(output) {
  const counts = { total: null, passed: null, failed: null, skipped: null, cancelled: null, todo: null };
  for (const [key, pattern] of [['total', /tests\s+(\d+)/], ['passed', /pass\s+(\d+)/], ['failed', /fail\s+(\d+)/], ['skipped', /skipped\s+(\d+)/], ['cancelled', /cancelled\s+(\d+)/], ['todo', /todo\s+(\d+)/]]) {
    const match = output.match(pattern);
    if (match) counts[key] = Number(match[1]);
  }
  return counts;
}

/** Runs tests and writes proof JSON. */
async function main() {
  const timeoutMs = Number(process.env.PF_FULL_TEST_PROOF_TIMEOUT_MS ?? '300000');
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['tsx', '--test', '--test-reporter=spec'];
  const metadata = await readProjectMetadata();
  const result = await runCommand(command, args, { timeoutMs });
  const combinedOutput = `${result.stdout}\n${result.stderr}`;
  const proofStatus = result.timedOut ? 'TIMED_OUT' : result.exitCode === 0 ? 'PASSED' : 'FAILED';
  const envelope = createProofEnvelope({ proofKind: 'full_test_suite_stability', baselineVersion: metadata.version, gitCommit: metadata.gitCommit, proofStatus, runtimeMode: 'test', evidence: { environment: getProofEnvironment(), command: `${command} ${args.join(' ')}`, timeout_ms: timeoutMs, exit_code: result.exitCode, signal: result.signal, timed_out: result.timedOut, duration_ms: result.durationMs, test_counts: parseNodeTestCounts(combinedOutput), stdout_tail: result.stdout.slice(-8000), stderr_tail: result.stderr.slice(-8000) }, knownLimitations: ['This proof only proves the local environment where it was run.', 'External iCloudPD, geocode-provider, and Raspberry hardware behavior are out of scope.'] });
  const outputPath = await writeProofArtifact('full_test_suite_stability', envelope);
  console.log(JSON.stringify({ status: proofStatus, outputPath, durationMs: result.durationMs }, null, 2));
  process.exit(result.exitCode === 0 && !result.timedOut ? 0 : 1);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
