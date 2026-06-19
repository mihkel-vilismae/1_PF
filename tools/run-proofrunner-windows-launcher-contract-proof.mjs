#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { analyzeContractDoc, analyzePowerShellLauncherText } from './proofrunner-windows-launcher-contract-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const safeLauncherExample = `
$PkgPath = Join-Path $RepoRoot "package.json"
if (-not (Test-Path $PkgPath)) { Write-Host "Could not read package.json from extracted repo root." -ForegroundColor Red; exit 4 }
try { $PkgValue = [string]((Get-Content $PkgPath -Raw | ConvertFrom-Json).version) } catch { Write-Host "Could not read package.json from extracted repo root." -ForegroundColor Red; exit 4 }
$HeadOutput = & git -C $RepoRoot rev-parse --short HEAD 2>$null
if ([string]::IsNullOrWhiteSpace([string]$HeadOutput)) { Write-Host "Git HEAD could not be read from extracted repo root." -ForegroundColor Red; exit 4 }
$HeadValue = ([string]$HeadOutput).Trim()
`;

const doc = analyzeContractDoc();
const launcher = analyzePowerShellLauncherText(safeLauncherExample);
const checks = [...doc.checks.map((check) => ({ ...check, area: 'doc' })), ...launcher.checks.map((check) => ({ ...check, area: 'launcher_contract' }))];
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const envelope = createProofEnvelope({
  proofKind: 'proofrunner_windows_launcher_contract',
  baselineVersion: (await metadata()).version,
  gitCommit: (await metadata()).gitCommit,
  proofStatus,
  runtimeMode: 'local_launcher_contract_validation',
  evidence: { checks },
  knownLimitations: ['This validates the launcher contract and safe pattern, not a live Windows proofrunner execution.'],
});
const outputPath = await writeProofArtifact('proofrunner_windows_launcher_contract', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
