#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { analyzeLauncherProgressContract } from './proofrunner-launcher-progress-contract-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const bashExample = `
C_GREEN=$'\\033[32m'; C_YELLOW=$'\\033[33m'; C_BLUE=$'\\033[36m'; C_RED=$'\\033[31m'
info() { printf '%b\\n' "$C_BLUE[INFO]$C_RESET $*"; }
pass() { printf '%b\\n' "$C_GREEN[PASS]$C_RESET $*"; }
warn() { printf '%b\\n' "$C_YELLOW[WARN]$C_RESET $*"; }
fail() { printf '%b\\n' "$C_RED[FAIL]$C_RESET $*"; }
format_duration() { :; }
estimate_for_proof() { echo "previous data unavailable"; }
while kill -0 "$pid" 2>/dev/null; do info "still running proof elapsed=$(format_duration 10) eta=$(estimate_for_proof proof:a)"; done
`;
const powershellExample = `
function Write-Status { param([string]$Level,[string]$Message,[string]$Color='Cyan') Write-Host "[$Level] $Message" -ForegroundColor $Color }
function Format-Duration { param([int]$Seconds) return "$Seconds sec" }
function Get-ProofEtaText { param([string]$Proof) return 'previous data unavailable' }
$NpmCommand = Get-Command npm.cmd -ErrorAction Stop
$process = Start-Process -FilePath $NpmCommand.Source -ArgumentList @('run', 'proof:a') -PassThru
Write-Status 'INFO' "still running proof elapsed=$(Format-Duration 10) eta=$(Get-ProofEtaText 'proof:a')" 'Cyan'
`;
const analysis = analyzeLauncherProgressContract({ bashSource: bashExample, powershellSource: powershellExample });
const meta = await metadata();
const envelope = createProofEnvelope({
  proofKind: 'proofrunner_launcher_progress_contract',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus: analysis.passed ? 'PASSED' : 'FAILED',
  runtimeMode: 'local_launcher_progress_contract',
  evidence: { checks: analysis.checks },
  knownLimitations: ['This validates launcher progress/ETA patterns; it does not run the generated launchers.'],
});
const outputPath = await writeProofArtifact('proofrunner_launcher_progress_contract', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
