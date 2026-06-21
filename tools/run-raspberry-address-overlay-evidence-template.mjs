#!/usr/bin/env node
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import process from 'node:process';
import { buildAddressOverlayEvidenceTemplate, buildRaspberryAddressOverlayTemplateProof, readAddressOverlayProofInput } from './address-overlay-proof-marker-lib.mjs';
import { writeProofArtifact } from './proof-utils.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  let gitCommit = 'unknown';
  try { gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  return { version, gitCommit };
}

const markerInput = readAddressOverlayProofInput(process.env);
const templatePath = join(process.cwd(), 'runtime_data', 'operator_evidence', 'address_overlay_evidence_template.json');
await mkdir(join(templatePath, '..'), { recursive: true });
await writeFile(templatePath, `${JSON.stringify(buildAddressOverlayEvidenceTemplate(markerInput), null, 2)}\n`, 'utf8');
const envelope = await buildRaspberryAddressOverlayTemplateProof({ metadata: await metadata(), env: process.env });
const outputPath = await writeProofArtifact('raspberry_address_overlay_template', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, evidenceTemplatePath: templatePath, marker: markerInput.marker }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
