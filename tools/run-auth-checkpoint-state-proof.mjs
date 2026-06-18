#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildAuthCheckpointStateProof } from './auth-checkpoint-state-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const envelope = buildAuthCheckpointStateProof({ metadata: await metadata(), env: process.env });
const outputPath = await writeProofArtifact('auth_checkpoint_state', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, blockReasons: envelope.evidence.evaluation.blockReasons }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
