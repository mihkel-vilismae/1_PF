import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeContractDoc, analyzePowerShellLauncherText } from '../tools/proofrunner-windows-launcher-contract-lib.mjs';

test('contract doc records null-safe Windows proofrunner launcher rules', () => {
  const result = analyzeContractDoc();
  assert.equal(result.passed, true, JSON.stringify(result.checks.filter((check) => !check.passed), null, 2));
});

test('launcher analyzer rejects Trim on node output from ambiguous cwd', () => {
  const bad = `$PkgValue=(& node -e "console.log(require('./package.json').version)" 2>$null).Trim()`;
  const result = analyzePowerShellLauncherText(bad);
  assert.equal(result.passed, false);
  assert.equal(result.checks.find((check) => check.name === 'no_trim_on_node_external_command_output').passed, false);
});

test('launcher analyzer accepts repo-root scoped package and git reads', () => {
  const good = `
  $PkgPath = Join-Path $RepoRoot "package.json"
  if (-not (Test-Path $PkgPath)) { Write-Host "Could not read package.json from extracted repo root." -ForegroundColor Red; exit 4 }
  $PkgValue = [string]((Get-Content $PkgPath -Raw | ConvertFrom-Json).version)
  $HeadOutput = & git -C $RepoRoot rev-parse --short HEAD 2>$null
  $HeadValue = ([string]$HeadOutput).Trim()
  `;
  const result = analyzePowerShellLauncherText(good);
  assert.equal(result.passed, true, JSON.stringify(result.checks.filter((check) => !check.passed), null, 2));
});
