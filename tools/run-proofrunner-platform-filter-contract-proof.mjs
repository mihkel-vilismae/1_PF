#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { analyzePlatformProofQueuePlan, analyzeRaspberryHandoffLauncherText, buildAcceptedRaspberryLauncherSnippet } from './proofrunner-platform-filter-contract-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const raspberryPlan = analyzePlatformProofQueuePlan(pkg, { platformRunner: 'raspberryos_bash', runMode: 'all' });
const windowsPlan = analyzePlatformProofQueuePlan(pkg, { platformRunner: 'windows_powershell', runMode: 'all' });
const launcherSnippet = analyzeRaspberryHandoffLauncherText(buildAcceptedRaspberryLauncherSnippet());
const checks = [
  { name: 'raspberry_queue_platform_filter', passed: raspberryPlan.status === 'PASSED', detail: raspberryPlan.checks },
  { name: 'windows_queue_preserves_aliases', passed: windowsPlan.status === 'PASSED', detail: windowsPlan.checks },
  { name: 'raspberry_handoff_launcher_contract', passed: launcherSnippet.status === 'PASSED', detail: launcherSnippet.checks },
];
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const meta = await metadata();
const envelope = createProofEnvelope({
  proofKind: 'proofrunner_platform_filter_contract',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus,
  runtimeMode: 'local_handoff_platform_filter_validation',
  evidence: {
    environment: getProofEnvironment(),
    checks,
    raspberry_ordered_count: raspberryPlan.plan.ordered_count,
    raspberry_skipped_windows_aliases: raspberryPlan.plan.skipped_windows_aliases,
    windows_ordered_count: windowsPlan.plan.ordered_count,
    windows_aliases_included: windowsPlan.plan.ordered_proofs.filter((name) => name.endsWith(':windows')),
  },
  knownLimitations: [
    'Static/local queue contract proof only; live Raspberry and Windows proofrunner execution remains operator-supplied.',
    'Windows-only package scripts remain available for Windows proof launchers and are intentionally excluded only on non-Windows launchers.',
  ],
});
const outputPath = await writeProofArtifact('proofrunner_platform_filter_contract', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
