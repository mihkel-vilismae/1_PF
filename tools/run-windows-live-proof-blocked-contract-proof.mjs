#!/usr/bin/env node
import { analyzeWindowsLiveProofBlockedContract } from './windows-live-proof-blocked-contract-lib.mjs';
const result = analyzeWindowsLiveProofBlockedContract();
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === 'PASSED' ? 0 : 1);
