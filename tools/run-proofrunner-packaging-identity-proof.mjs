#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { analyzeArchiveRootNames, expectedRepoArchiveRoot } from './proofrunner-packaging-identity-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, packageVersion: pkg.version, packageLockVersion: lock.version, packageLockRootVersion: lock.packages?.['']?.version, gitCommit: git.stdout.trim() || 'unknown' };
}

const meta = await metadata();
const expectedRoot = expectedRepoArchiveRoot({ version: meta.version });
const analysis = analyzeArchiveRootNames([expectedRoot], { version: meta.version });
const versionChecks = [
  { name: 'version_matches_package_json', passed: meta.version === meta.packageVersion, detail: `${meta.version} === ${meta.packageVersion}` },
  { name: 'version_matches_package_lock', passed: meta.version === meta.packageLockVersion && meta.version === meta.packageLockRootVersion, detail: `${meta.version} === ${meta.packageLockVersion} === ${meta.packageLockRootVersion}` },
];
const checks = [...versionChecks, ...analysis.checks];
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const envelope = createProofEnvelope({
  proofKind: 'proofrunner_packaging_identity',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus,
  runtimeMode: 'local_packaging_identity_contract',
  evidence: { environment: getProofEnvironment(), expected_repo_archive_root: expectedRoot, checks },
  knownLimitations: ['This validates package identity rules before packaging; external ZIP extraction is validated separately by the final handoff build.'],
});
const outputPath = await writeProofArtifact('proofrunner_packaging_identity', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, expectedRoot, checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
