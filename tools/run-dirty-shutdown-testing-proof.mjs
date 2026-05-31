#!/usr/bin/env node
/**
 * CLI runner for the dirty-shutdown testing proof artifact.
 * It records deterministic guard evidence under ignored runtime_data/proofs.
 * The runner never kills operating-system processes.
 * It exits non-zero if the deterministic safeguard tests fail.
 */
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { runDirtyShutdownTestingProof } from './dirty-shutdown-testing-proof-lib.mjs';
import { writeProofArtifact } from './proof-utils.mjs';

async function main() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  let gitCommit = 'unknown';
  try {
    gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {}
  const envelope = await runDirtyShutdownTestingProof({ metadata: { version, gitCommit } });
  const outputPath = await writeProofArtifact('dirty_shutdown_testing', envelope);
  console.log(JSON.stringify({ proof_status: envelope.proof_status, outputPath }, null, 2));
  if (envelope.proof_status !== 'PASSED') process.exitCode = 1;
}

void main();
