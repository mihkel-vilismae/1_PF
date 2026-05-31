#!/usr/bin/env node
/**
 * Windows CronEmulator proof runner.
 * Creates a deterministic proof artifact for the local Windows CronEmulator tool.
 * Keeps emulator evidence separate from Raspberry hardware power-loss claims.
 * Writes sanitized JSON evidence under runtime_data/proofs.
 * Exits non-zero only when deterministic emulator proof checks fail.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { buildWindowsCronEmulatorProof } from './windows-cronemulator-proof-lib.mjs';
import { writeProofArtifact } from './proof-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

/** Reads the canonical package version used in proof metadata. */
async function readVersion() {
  const pkg = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8'));
  return String(pkg.version ?? 'unknown');
}

/** Returns the current git commit or a stable fallback when git metadata is unavailable. */
function readGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

const envelope = await buildWindowsCronEmulatorProof({ repoRoot, metadata: { version: await readVersion(), gitCommit: readGitCommit() } });
const outputPath = await writeProofArtifact('windows_cronemulator', envelope);
console.log(JSON.stringify({ proof_status: envelope.proof_status, artifact_path: outputPath, runtime_mode: envelope.runtime_mode }, null, 2));
if (envelope.proof_status !== 'PASSED') process.exitCode = 1;
