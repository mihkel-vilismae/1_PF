#!/usr/bin/env node
import { validateIcloudpdSessionPathConfig } from './icloudpd-session-path-validator-lib.mjs';
const result = validateIcloudpdSessionPathConfig();
console.log(JSON.stringify(result, null, 2));
process.exit(result.proof_status === 'FAILED' ? 1 : 0);
