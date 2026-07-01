#!/usr/bin/env node
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  recordAcrUsage,
  summarizeAcrUsage,
  normalizeAcrCommand,
  KNOWN_ACR_COMMANDS
} from './acr-usage-ledger.mjs';

const repoRoot = process.cwd();
const tempRoot = mkdtempSync(path.join(tmpdir(), 'pf-acr-usage-'));
const ledger = path.join(tempRoot, 'acr-command-usage.jsonl');

recordAcrUsage({
  command: 'XACR',
  source: 'user_called',
  scope: 'acr_usage_tracking_analysis',
  project: 'PF_login',
  baselineVersion: '2.0.8',
  notes: 'user requested XACR analysis for ACR usage counting',
  timestamp: '2026-07-01T18:07:04.000Z'
}, { ledgerPath: ledger });

recordAcrUsage({
  command: '3XACR',
  source: 'assistant_automatic',
  scope: 'batch_refinement',
  project: 'PF_login',
  baselineVersion: '2.0.8',
  notes: 'assistant workflow refinement pass',
  timestamp: '2026-07-01T18:08:00.000Z'
}, { ledgerPath: ledger });

recordAcrUsage({
  command: '2x2acr',
  source: 'user_called',
  scope: 'alias_normalization',
  project: 'PF_login',
  baselineVersion: '2.0.8',
  notes: 'case-insensitive command normalization proof',
  timestamp: '2026-07-01T18:09:00.000Z'
}, { ledgerPath: ledger });

const summary = summarizeAcrUsage({ ledgerPath: ledger });
const rows = Object.fromEntries(summary.rows.map((row) => [row.command, row]));
const ledgerLines = readFileSync(ledger, 'utf8').trim().split(/\r?\n/);
const docsText = [
  'docs/10_runbooks/acr_usage_tracking.md',
  'docs/20_architecture_and_specs/openspec/acr_usage_ledger_openspec.md',
  'docs/proofs/acr_usage_ledger_proof.md',
  'CHANGELOG.md',
  'package.json'
].map(read).join('\n');

const assertions = {
  known_commands_registered: ['ACR', '2XACR', '3XACR', 'XACR', '2x2ACR', '3X2ACR'].every((command) => KNOWN_ACR_COMMANDS.includes(command)),
  ledger_writes_jsonl_lines: ledgerLines.length === 3 && ledgerLines.every((line) => JSON.parse(line).project === 'PF_login'),
  user_called_xacr_counted: rows.XACR.user_called === 1 && rows.XACR.assistant_automatic === 0,
  assistant_automatic_3xacr_counted: rows['3XACR'].assistant_automatic === 1,
  mixed_case_2x2acr_normalized: normalizeAcrCommand('2x2acr') === '2x2ACR' && rows['2x2ACR'].user_called === 1,
  empty_commands_remain_visible: rows.ACR.total === 0 && rows['3X2ACR'].total === 0,
  totals_are_correct: summary.eventsCount === 3 && summary.rows.reduce((total, row) => total + row.total, 0) === 3,
  docs_cover_sources: hasAll(docsText, ['user_called', 'assistant_automatic', 'runtime_data/workflow/acr-command-usage.jsonl']),
  package_scripts_registered: hasAll(docsText, ['workflow:acr:record', 'workflow:acr:summary', 'proof:workflow-acr-usage-ledger'])
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({
  proof: 'workflow-acr-usage-ledger',
  status: passed ? 'PASSED' : 'BLOCKED',
  decision: passed ? 'ACR_USAGE_LEDGER_READY' : 'ACR_USAGE_LEDGER_BLOCKED',
  assertions,
  summary
}, null, 2));
if (!passed) process.exit(1);

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function hasAll(value, needles) {
  return needles.every((needle) => value.includes(needle));
}
