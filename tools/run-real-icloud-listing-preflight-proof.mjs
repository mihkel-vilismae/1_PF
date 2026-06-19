#!/usr/bin/env node
import { runRealIcloudListingPreflight } from './real-icloud-listing-preflight-lib.mjs';
const result = runRealIcloudListingPreflight();
console.log(JSON.stringify(result, null, 2));
process.exit(result.proof_status === 'FAILED' ? 1 : 0);
