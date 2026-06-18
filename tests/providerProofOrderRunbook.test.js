import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const RUNBOOK = 'docs/10_runbooks/provider_proof_order_runbook.md';
const REQUIRED_COMMANDS = [
  'npm run proof:auth-checkpoint-state',
  'npm run proof:real-icloudpd-readiness',
  'npm run proof:raspberry-icloudpd-preflight',
  'npm run proof:real-icloudpd',
  'npm run proof:real-download-readiness',
  'npm run proof:real-download-continuation',
  'npm run proof:real-geocode-provider-readiness',
  'npm run proof:real-geocode-provider-chain',
  'npm run proof:raspberry-v1-readiness',
  'npm run proof:proof-report-blocker-summary',
  'npm run proof:proof-runner-final-summary',
];

test('provider proof order runbook lists provider commands in safe order', () => {
  const text = readFileSync(RUNBOOK, 'utf8');
  const orderedTableCommands = text
    .split('\n')
    .filter((line) => line.startsWith('|') && line.includes('`npm run proof:'))
    .map((line) => line.match(/`(npm run proof:[^`]+)`/)?.[1])
    .filter(Boolean);
  assert.deepEqual(orderedTableCommands.slice(0, REQUIRED_COMMANDS.length), REQUIRED_COMMANDS);
});

test('provider proof order runbook preserves secret and mock boundaries', () => {
  const text = readFileSync(RUNBOOK, 'utf8');
  assert.match(text, /must not include Apple IDs, passwords, 2FA codes, cookies, API keys, provider tokens, raw `.env` values/);
  assert.match(text, /Do not substitute mock download endpoints/);
  assert.match(text, /readiness preflights only prove local inputs and route plans/);
});
