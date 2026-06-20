import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePowerShellSafeLogNameText, buildAcceptedPowerShellSafeLogNameSnippet, buildAcceptedPowerShellWorkDirSnippet } from '../tools/proofrunner-powershell-safe-log-name-lib.mjs';

test('PowerShell proofrunner safe log name contract rejects invalid regex char class', () => {
  const bad = "$safe=$proof -replace '[:/\\]','_'; $log=Join-Path $LogDir ('{0:d3}_{1}.log' -f $Idx,$safe)";
  assert.equal(analyzePowerShellSafeLogNameText(bad).status, 'FAILED');
});

test('PowerShell proofrunner safe log name contract accepts literal Replace chain', () => {
  const result = analyzePowerShellSafeLogNameText(buildAcceptedPowerShellSafeLogNameSnippet());
  assert.equal(result.status, 'PASSED');
});


test('PowerShell proofrunner path contract rejects accidental carriage return in workdir string', () => {
  const bad = '$WorkDir = Join-Path $RootDir "_pf_2proofrunner_work' + '\r' + 'un_${RunId}_win"';
  const result = analyzePowerShellSafeLogNameText(bad);
  assert.equal(result.status, 'FAILED');
  assert.ok(result.checks.some((check) => check.name === 'no_control_characters_in_launcher_paths' && !check.passed));
});

test('PowerShell proofrunner path contract accepts nested Join-Path workdir construction', () => {
  const result = analyzePowerShellSafeLogNameText(`${buildAcceptedPowerShellSafeLogNameSnippet()}; ${buildAcceptedPowerShellWorkDirSnippet()}`);
  assert.equal(result.status, 'PASSED');
});
