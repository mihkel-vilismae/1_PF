#!/usr/bin/env node
import { buildManualLoginSnapshotPair, validateAuthSessionSnapshot, AUTH_SESSION_STATES } from './auth-session-snapshot-contract-lib.mjs';
const pair = buildManualLoginSnapshotPair();
const validations = Object.fromEntries(Object.entries(pair).map(([key, snapshot]) => [key, validateAuthSessionSnapshot(snapshot)]));
const status = Object.values(validations).every((entry) => entry.status === 'PASSED') ? 'PASSED' : 'FAILED';
const result = { status, auth_session_states: AUTH_SESSION_STATES, pair, validations };
console.log(JSON.stringify(result, null, 2));
process.exit(status === 'PASSED' ? 0 : 1);
