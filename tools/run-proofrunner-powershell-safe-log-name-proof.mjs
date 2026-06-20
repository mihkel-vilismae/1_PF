#!/usr/bin/env node
import { analyzePowerShellSafeLogNameText, buildAcceptedPowerShellSafeLogNameSnippet, buildAcceptedPowerShellWorkDirSnippet } from './proofrunner-powershell-safe-log-name-lib.mjs';
const good = analyzePowerShellSafeLogNameText(`${buildAcceptedPowerShellSafeLogNameSnippet()}; ${buildAcceptedPowerShellWorkDirSnippet()}`);
const badRegex = analyzePowerShellSafeLogNameText("$safe=$proof -replace '[:/\\]','_'; $log=Join-Path $LogDir ('{0:d3}_{1}.log' -f $Idx,$safe)");
const badWorkDir = analyzePowerShellSafeLogNameText('$WorkDir = Join-Path $RootDir "_pf_2proofrunner_work\\run_${RunId}_win"'.replace('\\r', '\r'));
const result = { status: good.status === 'PASSED' && badRegex.status === 'FAILED' && badWorkDir.status === 'FAILED' ? 'PASSED' : 'FAILED', good, badRegex, badWorkDir };
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === 'PASSED' ? 0 : 1);
