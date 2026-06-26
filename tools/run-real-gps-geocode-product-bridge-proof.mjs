#!/usr/bin/env node
/**
 * Runs the GPS/geocode-to-worker product evidence bridge.
 * Requires worker runtime product evidence and sanitized provider inputs.
 * Writes proof artifacts without claiming device display visibility.
 */
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, writeProofArtifact } from './proof-utils.mjs';
import {
  evaluateRealGpsGeocodeProductBridge,
  writeRealGpsGeocodeProductBridgeEvidence,
} from './real-gps-geocode-product-bridge-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  let gitCommit = 'unknown';
  try { gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  return { version, gitCommit };
}

const result = evaluateRealGpsGeocodeProductBridge(process.env);
let written = null;
if (result.proofStatus === 'PASSED') {
  written = await writeRealGpsGeocodeProductBridgeEvidence(result.product_pipeline_evidence);
}
const meta = await metadata();
const envelope = createProofEnvelope({
  proofKind: 'real_gps_geocode_product_bridge',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus: result.proofStatus,
  runtimeMode: 'real_gps_geocode_product_bridge',
  evidence: {
    environment: getProofEnvironment(),
    requirements: result.requirements,
    source_kind: result.source_kind,
    worker_runtime_evidence: result.worker_runtime_evidence,
    gps_evidence: result.gps_evidence,
    address_validation: result.address_validation,
    resolved_input: result.resolved_input,
    structured_evaluation: result.structured_evaluation,
    generated_evidence_file: written?.outputPath ?? null,
    latest_evidence_file: written?.latestEvidencePath ?? null,
    latest_env_file: written?.latestEnvPath ?? null,
    env_line: written?.envLine ?? null,
    non_claims: result.non_claims,
  },
  knownLimitations: result.proofStatus === 'PASSED'
    ? ['Generated product evidence enriched with accepted GPS/geocode address. This does not prove real iCloud authentication or device overlay visibility.']
    : ['Set bridge opt-in, product-capable regular worker runtime evidence, an accepted GPS source, and normalized geocode address evidence.'],
});
const outputPath = await writeProofArtifact('real_gps_geocode_product_bridge', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, generatedEvidenceFile: written?.outputPath ?? null, env: written?.envLine ?? null, block_reasons: result.block_reasons }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
