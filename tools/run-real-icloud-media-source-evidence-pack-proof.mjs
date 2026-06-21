#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import {
  evaluateRealIcloudMediaSourceEvidencePack,
  writeRealIcloudMediaSourceEvidencePack,
} from './real-icloud-media-source-evidence-pack-lib.mjs';

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

const metadata = await readProjectMetadata();
const evaluation = evaluateRealIcloudMediaSourceEvidencePack(process.env, { cwd: process.cwd() });
const written = await writeRealIcloudMediaSourceEvidencePack(evaluation);
const envelope = createProofEnvelope({
  proofKind: 'real_icloud_media_source_evidence_pack',
  baselineVersion: metadata.version,
  gitCommit: metadata.gitCommit,
  proofStatus: evaluation.proofStatus,
  runtimeMode: 'real_icloud_media_source_operator_evidence_pack_preflight',
  evidence: {
    environment: getProofEnvironment(),
    evaluation,
    generated_files: written.relative,
    latest_env_lines: written.envLines,
    non_claims: evaluation.non_claims,
  },
  knownLimitations: evaluation.proofStatus === 'PASSED'
    ? ['Evidence pack inputs are present and safe. This does not itself call iCloudPD or download media.']
    : ['Evidence templates were generated, but operator evidence is still missing or incomplete.'],
});
const outputPath = await writeProofArtifact('real_icloud_media_source_evidence_pack', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, latestEnv: written.relative.latestEnvPath, nextSteps: written.relative.nextStepsPath, missing: evaluation.missing_for_real_icloud_media_source }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
