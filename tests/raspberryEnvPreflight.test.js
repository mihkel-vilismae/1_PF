import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { evaluateRaspberryEnvPreflight, inspectRaspberryEnv, parseEnvText } from '../tools/raspberry-env-preflight-lib.mjs';

async function withTempRepo(fn) {
  const { mkdtemp } = await import('node:fs/promises');
  const root = await mkdtemp(path.join(os.tmpdir(), 'pf-env-preflight-'));
  try { await fn(root); } finally { await rm(root, { recursive: true, force: true }); }
}

test('env preflight can create .env from example.env', async () => {
  await withTempRepo(async (root) => {
    await writeFile(path.join(root, 'example.env'), [
      'DOWNLOAD_DIR=runtime_data/downloads',
      'DB_PATH=runtime_data/photo_frame.sqlite',
      'LOG_DIR=runtime_data/logs',
      'FULL_LOG=runtime_data/logs/full_log.log',
      'PLAYBACK_LEASE_SECONDS=45',
      'NATIVE_PLAYBACK_ENABLED=false',
      '',
    ].join('\n'), 'utf8');
    const inspection = await inspectRaspberryEnv({ repoRoot: root, createFromExample: true });
    assert.equal(inspection.created_from_example, true);
    assert.equal(inspection.after_exists, true);
    assert.deepEqual(inspection.missing_minimum_keys, []);
    assert.equal(evaluateRaspberryEnvPreflight(inspection).proofStatus, 'PASSED');
    assert.match(await readFile(path.join(root, '.env'), 'utf8'), /DOWNLOAD_DIR=/);
  });
});

test('env preflight blocks when .env is missing and create is not requested', async () => {
  await withTempRepo(async (root) => {
    const inspection = await inspectRaspberryEnv({ repoRoot: root, createFromExample: false });
    const evaluation = evaluateRaspberryEnvPreflight(inspection);
    assert.equal(evaluation.proofStatus, 'BLOCKED');
    assert.match(evaluation.blockReasons.join('\n'), /.env is missing/);
  });
});

test('parseEnvText records malformed runtime env lines', () => {
  const parsed = parseEnvText('GOOD=value\nnot-valid\n# comment\nEMPTY=\n');
  assert.equal(parsed.values.GOOD, 'value');
  assert.equal(parsed.values.EMPTY, '');
  assert.equal(parsed.malformedLines.length, 1);
});
