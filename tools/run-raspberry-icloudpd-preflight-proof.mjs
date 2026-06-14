#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryIcloudpdPreflightProof } from './raspberry-icloudpd-preflight-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const envelope = await buildRaspberryIcloudpdPreflightProof({ metadata: await metadata(), env: process.env, cwd: process.cwd() });
const outputPath = await writeProofArtifact('raspberry_icloudpd_preflight', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, blockReasons: envelope.evidence.evaluation.blockReasons }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
