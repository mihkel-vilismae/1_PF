import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, stat, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { evaluateExecutablePermissionRows, inspectRaspberryExecutablePermissions, isExecutableMode } from '../tools/raspberry-executable-permissions-lib.mjs';

test('executable permission proof repairs known files when requested', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pf-exec-perm-'));
  try {
    await mkdir(path.join(root, 'scripts'), { recursive: true });
    const rel = 'scripts/run.sh';
    const absolute = path.join(root, rel);
    await writeFile(absolute, '#!/bin/sh\necho ok\n', 'utf8');
    await chmod(absolute, 0o644);
    let before = await stat(absolute);
    assert.equal(isExecutableMode(before.mode), false);
    const simulatedPlatform = process.platform === 'win32' ? 'win32' : 'linux';
    const rows = await inspectRaspberryExecutablePermissions({ repoRoot: root, files: [rel], repair: true, platform: simulatedPlatform });
    if (process.platform === 'win32') {
      assert.equal(rows[0].repaired, false);
      assert.equal(rows[0].repair_supported, false);
      assert.match(rows[0].repair_skipped_reason, /not supported on win32/);
      assert.equal(rows[0].executable_after, false);
      assert.equal(evaluateExecutablePermissionRows(rows).proofStatus, 'BLOCKED');
    } else {
      assert.equal(rows[0].repaired, true);
      assert.equal(rows[0].executable_after, true);
      assert.equal(evaluateExecutablePermissionRows(rows).proofStatus, 'PASSED');
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('executable permission evaluation blocks missing files', () => {
  const result = evaluateExecutablePermissionRows([{ relative_path: 'missing.sh', exists: false, executable_after: false }]);
  assert.equal(result.proofStatus, 'BLOCKED');
  assert.deepEqual(result.missing, ['missing.sh']);
});


test('executable permission proof records unsupported win32 repair without pretending success', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pf-exec-perm-win32-'));
  try {
    await mkdir(path.join(root, 'scripts'), { recursive: true });
    const rel = 'scripts/run.sh';
    const absolute = path.join(root, rel);
    await writeFile(absolute, '#!/bin/sh\necho ok\n', 'utf8');
    const rows = await inspectRaspberryExecutablePermissions({ repoRoot: root, files: [rel], repair: true, platform: 'win32' });
    assert.equal(rows[0].repair_supported, false);
    assert.match(rows[0].repair_skipped_reason, /win32/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
