#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import {
  analyzeHandoffModeSurfaceText,
  analyzeProofrunnerModeNormalization,
  buildAcceptedBashModeSelectionSnippet,
  buildAcceptedPowerShellModeSelectionSnippet,
  buildProofrunnerModeReadmeSection,
  analyzeGeneratedProofrunnerIdentitySurface,
  buildAcceptedGeneratedHandoffIdentityText,
} from './proofrunner-handoff-mode-contract-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const surface = analyzeHandoffModeSurfaceText({
  readmeText: buildProofrunnerModeReadmeSection(),
  bashText: buildAcceptedBashModeSelectionSnippet(),
  powershellText: buildAcceptedPowerShellModeSelectionSnippet(),
});
const normalization = analyzeProofrunnerModeNormalization();
const meta = await metadata();
const identity = analyzeGeneratedProofrunnerIdentitySurface({
  texts: [buildAcceptedGeneratedHandoffIdentityText({ version: meta.version, head: meta.gitCommit, sha256: 'contract-placeholder-sha256' })],
  expectedVersion: meta.version,
  expectedHead: meta.gitCommit,
});
const checks = [
  { name: 'handoff_mode_surface', passed: surface.status === 'PASSED', detail: surface.checks },
  { name: 'launcher_mode_normalization', passed: normalization.status === 'PASSED', detail: normalization.checks },
  { name: 'generated_handoff_identity_surface', passed: identity.status === 'PASSED', detail: identity.checks },
];
const envelope = createProofEnvelope({
  proofKind: 'proofrunner_handoff_mode_contract',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED',
  runtimeMode: 'local_handoff_mode_contract_validation',
  evidence: { checks },
  knownLimitations: ['Static contract only; it does not execute Windows or Raspberry handoff launchers.'],
});
const outputPath = await writeProofArtifact('proofrunner_handoff_mode_contract', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
