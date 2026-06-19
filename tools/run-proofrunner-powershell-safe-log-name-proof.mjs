#!/usr/bin/env node
import { analyzePowerShellSafeLogNameText, buildAcceptedPowerShellSafeLogNameSnippet } from './proofrunner-powershell-safe-log-name-lib.mjs';
const good = analyzePowerShellSafeLogNameText(buildAcceptedPowerShellSafeLogNameSnippet());
const bad = analyzePowerShellSafeLogNameText("$safe=$proof -replace '[:/\\]','_'; $log=Join-Path $LogDir ('{0:d3}_{1}.log' -f $Idx,$safe)");
const result = { status: good.status === 'PASSED' && bad.status === 'FAILED' ? 'PASSED' : 'FAILED', good, bad };
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === 'PASSED' ? 0 : 1);
