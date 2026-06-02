/**
 * Full test-suite proof helpers for PF_login.
 * Builds a Windows-friendly local tsx command and structured proof envelope.
 * Keeps pass, fail, and timeout states explicit for regression evidence.
 * Sanitizes command output before any runtime proof artifact is written.
 * Contains no production backend behavior or dashboard runtime changes.
 */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import {
  buildLocalTsxTestCommand,
  createProofEnvelope,
  getProofEnvironment,
  runCommand,
} from './proof-utils.mjs';

export const FULL_TEST_PROOF_KIND = 'full_test_suite_stability';
export const DEFAULT_FULL_TEST_TIMEOUT_MS = 600000;
export const FULL_TEST_REPORTER = 'spec';

/** Reads the current version and Git commit for proof metadata. */
export async function readFullTestProjectMetadata({ runGitCommand = runCommand } = {}) {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runGitCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Builds the local Node/tsx full-suite test command without shell-dependent npx lookup. */
export function buildFullTestProofCommand({ reporter = FULL_TEST_REPORTER } = {}) {
  return buildLocalTsxTestCommand([], ['--test-concurrency=1', `--test-reporter=${reporter}`]);
}

/** Converts the local command into a sanitized display string for proof evidence. */
export function formatProofCommand(command, args) {
  return [command, ...args].join(' ');
}

/** Parses Node test-run summary counters from spec or tap-style output tails. */
export function parseNodeTestCounts(output) {
  const counts = {
    total: null,
    suites: null,
    passed: null,
    failed: null,
    skipped: null,
    cancelled: null,
    todo: null,
    duration_ms_reported: null,
  };
  const patterns = [
    ['total', [/^\s*[#ℹ]?\s*tests\s+(\d+)\s*$/im, /^\s*1\.\.(\d+)\s*$/m]],
    ['suites', [/^\s*[#ℹ]?\s*suites\s+(\d+)\s*$/im]],
    ['passed', [/^\s*[#ℹ]?\s*(?:pass|passed)\s+(\d+)\s*$/im]],
    ['failed', [/^\s*[#ℹ]?\s*(?:fail|failed)\s+(\d+)\s*$/im]],
    ['skipped', [/^\s*[#ℹ]?\s*skipped\s+(\d+)\s*$/im]],
    ['cancelled', [/^\s*[#ℹ]?\s*cancelled\s+(\d+)\s*$/im]],
    ['todo', [/^\s*[#ℹ]?\s*todo\s+(\d+)\s*$/im]],
    ['duration_ms_reported', [/^\s*[#ℹ]?\s*duration_ms\s+([0-9.]+)\s*$/im]],
  ];
  for (const [key, keyPatterns] of patterns) {
    for (const pattern of keyPatterns) {
      const match = String(output ?? '').match(pattern);
      if (match) {
        counts[key] = key === 'duration_ms_reported' ? Number(match[1]) : Number.parseInt(match[1], 10);
        break;
      }
    }
  }
  return counts;
}

/** Classifies the full-suite command outcome using explicit proof status vocabulary. */
export function classifyFullTestProofStatus(commandResult) {
  if (commandResult.timedOut) return 'TIMED_OUT';
  if (commandResult.exitCode === 0) return 'PASSED';
  return 'FAILED';
}

/** Builds a concise limitation list matching the command outcome. */
export function buildFullTestKnownLimitations({ proofStatus }) {
  const limitations = [
    'This proof only proves the local environment where it was run.',
    'External iCloudPD, live network geocode-provider, and Raspberry hardware behavior are out of scope.',
  ];
  if (proofStatus === 'TIMED_OUT') {
    limitations.push('The full test suite exceeded the configured timeout; no full-suite pass is claimed.');
  }
  if (proofStatus === 'FAILED') {
    limitations.push('The full test suite exited non-zero; inspect the sanitized stdout/stderr tails for the failing tests.');
  }
  return limitations;
}

/** Builds the full-suite proof envelope from one command execution result. */
export function buildFullTestProofEnvelope({ metadata, testCommand, testResult, timeoutMs }) {
  const combinedOutput = `${testResult.stdout ?? ''}\n${testResult.stderr ?? ''}`;
  const proofStatus = classifyFullTestProofStatus(testResult);
  return createProofEnvelope({
    proofKind: FULL_TEST_PROOF_KIND,
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'test',
    evidence: {
      environment: getProofEnvironment(),
      command: formatProofCommand(testCommand.command, testCommand.args),
      command_parts: {
        executable: testCommand.command,
        args: testCommand.args,
      },
      timeout_ms: timeoutMs,
      exit_code: testResult.exitCode,
      signal: testResult.signal,
      timed_out: testResult.timedOut,
      duration_ms: testResult.durationMs,
      test_counts: parseNodeTestCounts(combinedOutput),
      stdout_tail: String(testResult.stdout ?? '').slice(-8000),
      stderr_tail: String(testResult.stderr ?? '').slice(-8000),
    },
    knownLimitations: buildFullTestKnownLimitations({ proofStatus }),
  });
}

/** Runs the full suite once and returns a structured proof envelope. */
export async function runFullTestProof({ timeoutMs = DEFAULT_FULL_TEST_TIMEOUT_MS } = {}) {
  const metadata = await readFullTestProjectMetadata();
  const testCommand = buildFullTestProofCommand();
  const testResult = await runCommand(testCommand.command, testCommand.args, { timeoutMs, forceKillGraceMs: 5000 });
  return buildFullTestProofEnvelope({ metadata, testCommand, testResult, timeoutMs });
}
