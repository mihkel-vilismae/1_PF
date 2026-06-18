#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryScreenWorkerNonBlockingProof } from './raspberry-screen-worker-non-blocking-proof-lib.mjs';

async function readMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const envelope = buildRaspberryScreenWorkerNonBlockingProof({ metadata: await readMetadata() });
const outputPath = await writeProofArtifact('raspberry_screen_worker_non_blocking', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
if (envelope.proof_status !== 'PASSED') process.exitCode = 1;
