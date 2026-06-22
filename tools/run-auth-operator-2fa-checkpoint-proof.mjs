#!/usr/bin/env node
import process from 'node:process';
import { readFile } from 'node:fs/promises';
import { buildLocalTsxTestCommand, createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence, writeProofArtifact } from './proof-utils.mjs';

async function readMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return {
    version,
    packageVersion: packageJson.version,
    gitCommit: String(git.stdout ?? '').trim() || 'UNKNOWN',
  };
}

const metadata = await readMetadata();
const testCommand = buildLocalTsxTestCommand(['tests/authOperatorTwoFactorCheckpoint.test.js']);
const result = await runCommand(testCommand.command, testCommand.args, { timeoutMs: 120000 });
const passed = result.exitCode === 0 && !result.timedOut;

const proof = createProofEnvelope({
  proofKind: 'auth_operator_2fa_checkpoint',
  baselineVersion: metadata.version,
  gitCommit: metadata.gitCommit,
  proofStatus: passed ? 'PASSED' : 'FAILED',
  runtimeMode: 'local_secret_safe_auth_operator_checkpoint',
  evidence: sanitizeEvidence({
    environment: getProofEnvironment(),
    package_version: metadata.packageVersion,
    test_command: {
      command: testCommand.command,
      args: testCommand.args,
      exit_code: result.exitCode,
      timed_out: result.timedOut,
      duration_ms: result.durationMs,
    },
    proven_behavior: [
      'interactive NEW AUTH login emits operator_2fa_checkpoint when provider asks for 2FA/SMS input',
      'checkpoint event contains AUTH_OPERATOR_CHECKPOINT marker and pending_2fa state',
      '2FA response, password, Apple ID, and session path are not exposed in serialized evidence',
      'existing login and 2FA state flow remains active and reaches authenticated in mocked lifecycle',
    ],
    non_claims: [
      'does not perform real Apple/iCloud login',
      'does not automate SMS/2FA entry',
      'does not collect credentials or 2FA codes in artifacts',
      'does not prove real iCloud media listing or Raspberry v1 readiness',
    ],
    stdout: result.stdout,
    stderr: result.stderr,
  }),
  knownLimitations: passed
    ? ['Local mocked lifecycle proof only; real provider proof still requires operator-approved credentials and manual 2FA.']
    : ['Inspect auth operator checkpoint test output and keep real credentials out of artifacts.'],
});

const outputPath = await writeProofArtifact('auth_operator_2fa_checkpoint', proof);
console.log(JSON.stringify({ status: proof.proof_status, outputPath, proven_behavior: proof.evidence.proven_behavior, non_claims: proof.evidence.non_claims }, null, 2));
process.exit(passed ? 0 : 1);
