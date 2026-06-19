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
  assert.ok(keybook.entries.length >= 30);
  const ids = keybook.entries.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const requiredId of [
    'pf.debug.page',
    'pf.debug.state.save_button',
    'pf.debug.crontab.install_button',
    'pf.debug.worker_regular.run_button',
    'pf.debug.elements_list.pane',
    'pf.debug.auth_session.pane',
    'pf.debug.help.pane',
    'pf.debug.stack_status.pane',
    'pf.debug.element_id_modal',
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


test('debug page keybook marks runtime IDs implemented after v0.8.200 slice', () => {
  const keybook = JSON.parse(fs.readFileSync(keybookPath, 'utf8'));
  assert.match(keybook.last_updated_version, /^0\.8\.(20[0-9]|21[0-9])$/);
  const unimplemented = keybook.entries.filter((entry) => entry.implemented_id !== true);
  assert.deepEqual(unimplemented.map((entry) => entry.id), []);
  for (const requiredId of [
    'pf.debug.help.pane',
    'pf.debug.stack_status.pane',
    'pf.debug.elements_list.pane',
    'pf.debug.auth_session.pane',
  ]) {
    const entry = keybook.entries.find((candidate) => candidate.id === requiredId);
    assert.equal(entry?.implemented_id, true);
  }
});
