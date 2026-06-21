import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLauncherProgressContract } from '../tools/proofrunner-launcher-progress-contract-lib.mjs';

test('launcher progress contract requires colors, heartbeat elapsed time, and ETA fallback text', () => {
  const good = analyzeLauncherProgressContract({
    bashSource: `C_GREEN=1; C_YELLOW=1; C_BLUE=1; C_RED=1
info() { :; }
pass() { :; }
warn() { :; }
fail() { :; }
format_duration() { :; }
estimate_for_proof() { echo "previous data unavailable"; }
while kill -0 "$pid" 2>/dev/null; do info "still running proof elapsed=$(format_duration 1) eta=$(estimate_for_proof proof:a)"; done`,
    powershellSource: `function Write-Status { param([string]$Level,[string]$Message,[string]$Color='Cyan') Write-Host $Message -ForegroundColor $Color }
function Format-Duration { param([int]$Seconds) return "$Seconds sec" }
function Get-ProofEtaText { return 'previous data unavailable' }
$job = Start-Job -ScriptBlock { }
Write-Status 'INFO' "still running proof elapsed=$(Format-Duration 1) eta=$(Get-ProofEtaText 'proof:a')" 'Green'`,
  });
  assert.equal(good.passed, true);
});

test('launcher progress contract rejects silent/no-ETA launchers', () => {
  const bad = analyzeLauncherProgressContract({ bashSource: 'npm run proof:a > log 2>&1', powershellSource: '& npm run $proof *> $log' });
  assert.equal(bad.passed, false);
});
