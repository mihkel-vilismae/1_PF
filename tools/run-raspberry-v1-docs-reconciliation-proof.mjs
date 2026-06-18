#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryV1DocsReconciliationProof } from './raspberry-v1-docs-reconciliation-proof-lib.mjs';

async function readMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const envelope = buildRaspberryV1DocsReconciliationProof({ metadata: await readMetadata(), repoRoot: process.cwd() });
const outputPath = await writeProofArtifact('raspberry_v1_docs_reconciliation', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
if (!['PASSED', 'BLOCKED'].includes(envelope.proof_status)) process.exitCode = 1;
