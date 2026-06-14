#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildDocsReconciliationAuditProof } from './docs-reconciliation-audit-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const envelope = buildDocsReconciliationAuditProof({ metadata: await metadata(), repoRoot: process.cwd() });
const outputPath = await writeProofArtifact('docs_reconciliation_audit', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, blockReasons: envelope.evidence.evaluation.blockReasons }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
