import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateGeneratedMediaRehearsal, inspectGeneratedMediaFixtures } from '../tools/local-generated-media-pipeline-rehearsal-lib.mjs';

test('generated media rehearsal blocks when generated media manifest is missing', () => {
  const evaluation = evaluateGeneratedMediaRehearsal({ manifestExists: false, manifestError: null, recordCount: 0, requiredDirectories: [{ name: 'videos_with_gps', exists: false }, { name: 'videos_no_gps', exists: false }] });
  assert.equal(evaluation.proofStatus, 'BLOCKED');
  assert.ok(evaluation.blockReasons.length >= 2);
});

test('generated media rehearsal passes with parseable manifest and required directories', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pf-generated-rehearsal-'));
  await mkdir(join(root, 'generated_test_data', 'videos_with_gps'), { recursive: true });
  await mkdir(join(root, 'generated_test_data', 'videos_no_gps'), { recursive: true });
  await writeFile(join(root, 'generated_test_data', 'manifest.json'), JSON.stringify({ records: [{ relativePath: 'videos_with_gps/a.mov', hasGps: true }] }));
  const inspect = inspectGeneratedMediaFixtures({ repoRoot: root });
  const evaluation = evaluateGeneratedMediaRehearsal(inspect);
  assert.equal(evaluation.proofStatus, 'PASSED');
  assert.equal(inspect.recordCount, 1);
});
