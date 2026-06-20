import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOperatorStatusRealDownload } from '../tools/operator-status-real-download-lib.mjs';
test('operator status exposes blocked real download sections', () => { const result = evaluateOperatorStatusRealDownload({}, { cwd: process.cwd() }); assert.equal(result.proofStatus, 'PASSED'); assert.ok(result.visible_states.some((entry) => entry.status === 'BLOCKED')); });
