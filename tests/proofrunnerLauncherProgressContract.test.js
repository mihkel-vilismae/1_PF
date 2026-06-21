import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLauncherProgressContract } from '../tools/proofrunner-launcher-progress-contract-lib.mjs';

const goodBash = `C_GREEN=1; C_YELLOW=1; C_BLUE=1; C_RED=1
info() { :; }
pass() { :; }
warn() { :; }
fail() { :; }
format_duration() { :; }
estimate_for_proof() { echo "previous data unavailable"; }
while kill -0 "$pid" 2>/dev/null; do info "still running proof elapsed=$(format_duration 1) eta=$(estimate_for_proof proof:a)"; done`;

const goodPowerShell = `function Write-Status { param([string]$Level,[string]$Message,[string]$Color='Cyan') Write-Host $Message -ForegroundColor $Color }
function Format-Duration { param([int]$Seconds) return "$Seconds sec" }
function Get-ProofEtaText { return 'previous data unavailable' }
$NpmCommand = Get-Command npm.cmd -ErrorAction Stop
$process = Start-Process -FilePath $NpmCommand.Source -ArgumentList @('run', $Proof) -PassThru
Write-Status 'INFO' "still running proof elapsed=$(Format-Duration 1) eta=$(Get-ProofEtaText 'proof:a')" 'Green'`;

test('launcher progress contract requires colors, heartbeat elapsed time, ETA fallback text, and Win32-safe npm launch', () => {
  const good = analyzeLauncherProgressContract({ bashSource: goodBash, powershellSource: goodPowerShell });
  assert.equal(good.passed, true);
});

test('launcher progress contract rejects silent/no-ETA launchers', () => {
  const bad = analyzeLauncherProgressContract({ bashSource: 'npm run proof:a > log 2>&1', powershellSource: '& npm run $proof *> $log' });
  assert.equal(bad.passed, false);
});

test('launcher progress contract rejects bare Start-Process npm on Windows', () => {
  const bad = analyzeLauncherProgressContract({
    bashSource: goodBash,
    powershellSource: goodPowerShell.replace('$NpmCommand = Get-Command npm.cmd -ErrorAction Stop\n$process = Start-Process -FilePath $NpmCommand.Source', "$process = Start-Process -FilePath 'npm'"),
  });
  assert.equal(bad.passed, false);
  assert.equal(bad.checks.find((check) => check.name === 'windows_uses_win32_npm_executable').passed, false);
});
