#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, writeProofArtifact } from './proof-utils.mjs';
import { evaluateRegularWorkerProductEvidenceProducer, writeRegularWorkerProductEvidence } from './regular-worker-product-evidence-producer-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  let gitCommit = 'unknown';
  try { gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  return { version, gitCommit };
}

const result = evaluateRegularWorkerProductEvidenceProducer(process.env);
let written = null;
if (result.proofStatus === 'PASSED') {
  written = await writeRegularWorkerProductEvidence(result.product_pipeline_evidence);
}
const meta = await metadata();
const envelope = createProofEnvelope({
  proofKind: 'regular_worker_product_evidence_producer',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus: result.proofStatus,
  runtimeMode: 'regular_worker_product_evidence_producer',
  evidence: {
    environment: getProofEnvironment(),
    requirements: result.requirements,
    source_kind: result.source_kind,
    resolved_input: result.resolved_input,
    structured_evaluation: result.structured_evaluation,
    generated_evidence_file: written?.outputPath ?? null,
    latest_evidence_file: written?.latestEvidencePath ?? null,
    latest_env_file: written?.latestEnvPath ?? null,
    env_line: written?.envLine ?? null,
    non_claims: ['does not prove iCloud auth', 'does not prove real GPS/geocode', 'does not prove address overlay visibility'],
  },
  knownLimitations: result.proofStatus === 'PASSED'
    ? ['Generated regular worker product evidence from accepted manifest plus explicit regular worker product-work confirmation.']
    : ['Set manifest path, opt-in, and product-work confirmation after regular_stage_worker has run.'],
});
const outputPath = await writeProofArtifact('regular_worker_product_evidence_producer', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, generatedEvidenceFile: written?.outputPath ?? null, env: written?.envLine ?? null, block_reasons: result.block_reasons }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
