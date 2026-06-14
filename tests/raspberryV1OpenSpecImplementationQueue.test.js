import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const QUEUE_DOC = 'docs/40_backlog_and_tasks/raspberry_v1_openspec_implementation_queue.md';
const queueIds = ['OSQ-APP-001', 'OSQ-ICL-001', 'OSQ-REG-001', 'OSQ-GEO-001', 'OSQ-PLAY-001', 'OSQ-OVL-001', 'OSQ-DASH-001', 'OSQ-SCR-001', 'OSQ-DOC-001'];

test('OpenSpec implementation queue covers all current v1 workstreams', async () => {
  const doc = await readFile(QUEUE_DOC, 'utf8');
  for (const id of queueIds) assert.match(doc, new RegExp(id));
  assert.match(doc, /OpenSpec implementation rule/);
  assert.match(doc, /Non-claims/);
});

test('OpenSpec implementation queue separates Raspberry and non-Raspberry next work', async () => {
  const doc = await readFile(QUEUE_DOC, 'utf8');
  assert.match(doc, /With Raspberry access/);
  assert.match(doc, /Without Raspberry access/);
  assert.match(doc, /proof:raspberry-app-running-target-pack/);
  assert.match(doc, /proof:openspec-v1-audit/);
});
