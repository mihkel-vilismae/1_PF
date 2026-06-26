#!/usr/bin/env node
/**
 * Generates the safe GPS/geocode bridge evidence pack.
 * Exports worker runtime status paths without manual product confirmation.
 * Keeps incomplete evidence as an honest BLOCKED proof artifact.
 */
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, writeProofArtifact } from './proof-utils.mjs';
import {
  evaluateRealGpsGeocodeProductBridgeEvidencePack,
  writeRealGpsGeocodeEvidencePack,
} from './real-gps-geocode-product-bridge-evidence-pack-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  let gitCommit = 'unknown';
  try { gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  return { version, gitCommit };
}

const result = evaluateRealGpsGeocodeProductBridgeEvidencePack(process.env);
const written = await writeRealGpsGeocodeEvidencePack(result);
const meta = await metadata();
const envelope = createProofEnvelope({
  proofKind: 'real_gps_geocode_product_bridge_evidence_pack',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus: result.proofStatus,
  runtimeMode: 'real_gps_geocode_product_bridge_evidence_pack',
  evidence: {
    environment: getProofEnvironment(),
    requirements: result.requirements,
    configured_paths: result.configured_paths,
    parsed: result.parsed,
    worker_runtime_evidence: result.worker_runtime_evidence,
    missing_for_bridge: result.missing_for_bridge,
    next_steps: result.next_steps,
    written_templates: written.relative,
    latest_env_lines: written.envLines,
    non_claims: result.non_claims,
  },
  knownLimitations: result.proofStatus === 'PASSED'
    ? ['Evidence pack inputs are present and consistent. Run proof:real-gps-geocode-product-bridge with the generated latest.env to create enriched product evidence.']
    : ['Evidence pack templates were generated, but operator evidence is still missing or incomplete.'],
});
const outputPath = await writeProofArtifact('real_gps_geocode_product_bridge_evidence_pack', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, latestEnv: written.relative.latestEnvPath, nextSteps: written.relative.nextStepsPath, missing: result.missing_for_bridge }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
