import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRealIcloudDownloadReport } from '../tools/real-icloud-download-report-lib.mjs';
test('real iCloud download report stays blocked without real artifacts', () => { const result = evaluateRealIcloudDownloadReport({}, { cwd: process.cwd() }); assert.equal(result.proofStatus, 'BLOCKED'); assert.equal(result.sections.auth, 'BLOCKED'); });
