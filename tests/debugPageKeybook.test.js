import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const keybookPath = path.join(repoRoot, 'docs/40_backlog_and_tasks/debug_page_keybook.json');

test('debug page keybook has unique stable ids and required planned entries', () => {
  const keybook = JSON.parse(fs.readFileSync(keybookPath, 'utf8'));
  assert.equal(keybook.project, 'PF_login / PhotoFrame');
  assert.ok(Array.isArray(keybook.entries));
  assert.ok(keybook.entries.length >= 20);
  const ids = keybook.entries.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const requiredId of [
    'pf.debug.page',
    'pf.debug.state.save_button',
    'pf.debug.crontab.install_button',
    'pf.debug.worker_regular.run_button',
    'pf.debug.elements_list.pane',
    'pf.debug.auth_session.pane',
  ]) {
    assert.ok(ids.includes(requiredId), `missing ${requiredId}`);
  }
});

test('debug page keybook proof passes', () => {
  const result = spawnSync(process.execPath, ['tools/run-debug-page-keybook-proof.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const proof = JSON.parse(result.stdout);
  assert.equal(proof.proof_status, 'PASSED');
  assert.ok(proof.entry_count >= 20);
});
