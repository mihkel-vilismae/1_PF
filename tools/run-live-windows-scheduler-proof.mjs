#!/usr/bin/env node
/**
 * Live Windows scheduler proof runner for PF_login.
 * Blocks by default and keeps CronEmulator/Task Scheduler claims explicit.
 * Uses deterministic CronEmulator checks as preflight, not as real OS scheduler proof.
 * Writes sanitized JSON under runtime_data/proofs.
 * Returns success for PASSED and BLOCKED so unconfigured machines stay safe.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runLiveWindowsSchedulerProof } from './live-windows-scheduler-proof-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

/** Reads project version and short Git commit for the proof envelope. */
async function readProjectMetadata() {
  const version = (await readFile(join(repoRoot, 'VERSION'), 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs the live Windows scheduler proof or writes a BLOCKED artifact when not enabled. */
async function main() {
  const envelope = await runLiveWindowsSchedulerProof({ repoRoot, metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('live_windows_scheduler', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' || envelope.proof_status === 'BLOCKED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
