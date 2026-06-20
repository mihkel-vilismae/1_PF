#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildSampleAuthSessionUsableEvidence, validateAuthSessionUsableEvidence } from './auth-session-usable-evidence-lib.mjs';

async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const sample = buildSampleAuthSessionUsableEvidence();
const validation = validateAuthSessionUsableEvidence(sample);
const proofStatus = validation.status;
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: 'auth_session_usable_evidence',
  baselineVersion: version,
  gitCommit,
  proofStatus,
  runtimeMode: 'local_contract',
  evidence: { sample, validation },
  knownLimitations: ['This validates the evidence contract only; it does not perform live iCloud login or inspect real session files.'],
});
const outputPath = await writeProofArtifact('auth_session_usable_evidence', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, validation }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
