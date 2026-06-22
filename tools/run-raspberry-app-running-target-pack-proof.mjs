#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { buildAppRunningTargetPackEvidenceBundle, buildRaspberryAppRunningTargetPackProof } from './raspberry-app-running-target-pack-lib.mjs';
import { writeProofArtifact } from './proof-utils.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  let gitCommit = 'unknown';
  try { gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  return { version, gitCommit };
}

const envelope = await buildRaspberryAppRunningTargetPackProof({ metadata: await metadata(), env: process.env, repoRoot: process.cwd() });
const outputPath = await writeProofArtifact('raspberry_app_running_target_pack', envelope);
const bundle = await buildAppRunningTargetPackEvidenceBundle({ repoRoot: process.cwd(), envelope, proofPath: outputPath });
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, bundleZipPath: bundle.zipPath, stepStatuses: envelope.evidence.step_results.map((step) => ({ id: step.id, reportedStatus: step.reported_status, exitCode: step.exit_code })) }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
