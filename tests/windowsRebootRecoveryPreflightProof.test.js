/**
 * Verifies the Windows reboot/restart recovery preflight proof.
 * The proof must stay preflight-only and must not reboot Windows.
 * Windows Task Scheduler is intentionally out of PF_login scope.
 * The test protects project-owned recovery boundaries before target proof work.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildWindowsRebootRecoveryNonClaims,
  buildWindowsRebootRecoveryPreflightPlan,
  buildWindowsRebootRecoveryPreflightProof,
} from '../tools/windows-reboot-recovery-preflight-proof-lib.mjs';

const repoRoot = process.cwd();
const metadata = { version: '0.8.30', gitCommit: 'test' };

/** Reads a UTF-8 repository file for documentation assertions. */
async function read(path) {
  return readFile(path, 'utf8');
}

test('preflight plan is manual and does not reboot or use Task Scheduler', () => {
  const plan = buildWindowsRebootRecoveryPreflightPlan().join('\n');
  assert.match(plan, /operator manually restarts Windows/);
  assert.doesNotMatch(plan, /schtasks\.exe/i);
  assert.doesNotMatch(plan, /Windows Task Scheduler service/i);
});

test('preflight non-claims keep Windows Task Scheduler and Raspberry out of scope', () => {
  const nonClaims = buildWindowsRebootRecoveryNonClaims().join('\n');
  assert.match(nonClaims, /does not reboot Windows/);
  assert.match(nonClaims, /Windows Task Scheduler is not part of PF_login project scope/);
  assert.match(nonClaims, /does not use schtasks\.exe/);
  assert.match(nonClaims, /Raspberry cron/);
  assert.match(nonClaims, /tools\/mpv\//);
  assert.match(nonClaims, /tools\/ffmpeg\//);
});

test('preflight proof passes with current project-owned launcher and local-tool boundaries', async () => {
  const envelope = await buildWindowsRebootRecoveryPreflightProof({ repoRoot, metadata });
  assert.equal(envelope.proof_kind, 'windows_reboot_recovery_preflight');
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.runtime_mode, 'documentation_preflight_no_reboot');
  assert.equal(envelope.evidence.localToolBoundaries.toolsMpvIgnored, true);
  assert.equal(envelope.evidence.localToolBoundaries.toolsFfmpegIgnored, true);
  assert.equal(envelope.evidence.trackedLocalTools.passed, true);
  assert.deepEqual(envelope.evidence.trackedLocalTools.unexpectedTrackedEntries, []);
  assert.ok(envelope.evidence.trackedLocalTools.allowedTrackedEntries.includes('tools/mpv/windows/README.md'));
});

test('docs expose preflight command and preserve non-claims', async () => {
  const docs = [
    await read('docs/proofs/windows_reboot_recovery_preflight.md'),
    await read('docs/proofs/README.md'),
    await read('HOW_TO_RUN.md'),
    await read('README.md'),
  ].join('\n');
  assert.match(docs, /proof:windows-reboot-recovery-preflight/);
  assert.match(docs, /Windows Task Scheduler is not part of PF_login project scope/);
  assert.match(docs, /does not reboot Windows/);
  assert.match(docs, /manual target-machine proof/);
});
