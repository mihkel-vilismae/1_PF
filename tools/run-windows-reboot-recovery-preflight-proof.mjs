#!/usr/bin/env node
/**
 * Windows reboot/restart recovery preflight proof runner for PF_login.
 * Writes a sanitized proof artifact without rebooting Windows.
 * Verifies project-owned launchers, proof commands, ignored local tool boundaries, and non-claims.
 * Keeps Windows Task Scheduler out of project scope.
 * Exits non-zero only when preflight requirements are missing or contradicted.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { writeProofArtifact } from './proof-utils.mjs';
import { buildWindowsRebootRecoveryPreflightProof } from './windows-reboot-recovery-preflight-proof-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

/** Reads the package version used as proof metadata. */
async function readVersion() {
  const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8'));
  return String(packageJson.version ?? 'unknown');
}

/** Reads the current Git commit for proof metadata. */
function readGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/** Builds and writes the preflight proof artifact. */
async function main() {
  const envelope = await buildWindowsRebootRecoveryPreflightProof({ repoRoot, metadata: { version: await readVersion(), gitCommit: readGitCommit() } });
  const outputPath = await writeProofArtifact('windows_reboot_recovery_preflight', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
