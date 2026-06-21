#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { buildRaspberryAddressOverlayDisplayCommandProof } from './address-overlay-proof-marker-lib.mjs';
import { writeProofArtifact } from './proof-utils.mjs';

async function readMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  let gitCommit = 'unknown';
  try { gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  return { version, gitCommit };
}

const envelope = await buildRaspberryAddressOverlayDisplayCommandProof({ metadata: await readMetadata(), env: process.env });
const outputPath = await writeProofArtifact('raspberry_address_overlay_display_command', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
