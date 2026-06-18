import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('scheduler host boundary OpenSpec is explicit before implementation', () => {
  const doc = readFileSync('docs/20_architecture_and_specs/openspec/scheduler_host_boundary_openspec.md', 'utf8');
  for (const term of ['scheduler-host', 'regular-stage-worker', 'playback-worker', 'screen-on-off-worker', 'recovery-state']) {
    assert.match(doc, new RegExp(term));
  }
  assert.match(doc, /Mock status must never imply a real worker process was spawned/);
  assert.match(doc, /does not mutate crontab/);
  assert.match(doc, /does not prove Raspberry behavior/);
});
