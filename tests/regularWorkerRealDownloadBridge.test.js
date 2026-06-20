import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRegularWorkerRealDownloadBridge } from '../tools/regular-worker-real-download-bridge-lib.mjs';
test('regular worker bridge is blocked until opt-in and no-loop evidence exist', () => { assert.equal(evaluateRegularWorkerRealDownloadBridge({}, { cwd: process.cwd() }).proofStatus, 'BLOCKED'); });
