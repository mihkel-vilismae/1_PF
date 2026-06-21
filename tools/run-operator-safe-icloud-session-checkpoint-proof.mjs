#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildOperatorSafeIcloudSessionCheckpointContract } from './operator-safe-icloud-session-checkpoint-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const envelope = buildOperatorSafeIcloudSessionCheckpointContract({ metadata: await metadata() });
const outputPath = await writeProofArtifact('operator_safe_icloud_session_checkpoint', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
