import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRegularWorkerConsumesDownloadManifest } from '../tools/regular-worker-consumes-download-manifest-lib.mjs';
test('worker manifest consumption is blocked without manifest evidence', () => { assert.equal(evaluateRegularWorkerConsumesDownloadManifest({}, { cwd: process.cwd() }).proofStatus, 'BLOCKED'); });
