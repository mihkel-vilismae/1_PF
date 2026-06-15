#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { writeProofArtifact } from './proof-utils.mjs';
import { buildLinuxFedoraToolCheckerProof } from './linux-fedora-proof-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  let gitCommit = 'unknown';
  try { gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  return { version, gitCommit };
}

const envelope = await buildLinuxFedoraToolCheckerProof({ metadata: await metadata(), env: process.env });
const outputPath = await writeProofArtifact('linux_fedora_tool_checker', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, mode: envelope.runtime_mode, outputPath }, null, 2));
process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
