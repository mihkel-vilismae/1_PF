import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRealDownloadError, evaluateRealDownloadErrorClassification } from '../tools/real-download-error-classification-lib.mjs';
test('real download error classification is deterministic', () => { assert.equal(classifyRealDownloadError({ auth: 'BLOCKED' }), 'AUTH_SESSION_MISSING_OR_INVALID'); assert.equal(evaluateRealDownloadErrorClassification({}, { cwd: process.cwd() }).proofStatus, 'PASSED'); });
