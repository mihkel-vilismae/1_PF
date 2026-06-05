#!/usr/bin/env node
/**
 * Windows Task Scheduler dry-run proof runner for PF_login.
 * Writes sanitized proof JSON for scheduled-task command shape and safety boundaries.
 * Does not call schtasks.exe, install persistent tasks, or run scheduled tasks.
 * Keeps the proof independent from local-only tools/mpv and tools/ffmpeg bundles.
 * Exits non-zero only when the dry-run contract is structurally invalid.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { getWindowsTaskSchedulerDryRunProofKind, runWindowsTaskSchedulerDryRunProof } from './windows-task-scheduler-dry-run-proof-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

/** Reads project version and short Git commit for the proof envelope. */
async function readProjectMetadata() {
  const version = (await readFile(join(repoRoot, 'VERSION'), 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs the dry-run proof and writes its sanitized artifact. */
async function main() {
  const envelope = runWindowsTaskSchedulerDryRunProof({ repoRoot, metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact(getWindowsTaskSchedulerDryRunProofKind(), envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
