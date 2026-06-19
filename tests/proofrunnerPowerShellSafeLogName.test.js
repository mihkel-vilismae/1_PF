import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePowerShellSafeLogNameText, buildAcceptedPowerShellSafeLogNameSnippet } from '../tools/proofrunner-powershell-safe-log-name-lib.mjs';

test('PowerShell proofrunner safe log name contract rejects invalid regex char class', () => {
  const bad = "$safe=$proof -replace '[:/\\]','_'; $log=Join-Path $LogDir ('{0:d3}_{1}.log' -f $Idx,$safe)";
  assert.equal(analyzePowerShellSafeLogNameText(bad).status, 'FAILED');
});

test('PowerShell proofrunner safe log name contract accepts literal Replace chain', () => {
  const result = analyzePowerShellSafeLogNameText(buildAcceptedPowerShellSafeLogNameSnippet());
  assert.equal(result.status, 'PASSED');
});
