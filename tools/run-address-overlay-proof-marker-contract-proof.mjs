#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { buildAddressOverlayProofMarkerContract } from './address-overlay-proof-marker-lib.mjs';
import { writeProofArtifact } from './proof-utils.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  let gitCommit = 'unknown';
  try { gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  return { version, gitCommit };
}

const envelope = await buildAddressOverlayProofMarkerContract({ metadata: await metadata(), env: process.env });
const outputPath = await writeProofArtifact('address_overlay_proof_marker_contract', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, marker: envelope.evidence.overlay.marker }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
