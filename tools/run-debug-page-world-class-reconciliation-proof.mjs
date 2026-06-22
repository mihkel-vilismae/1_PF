#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const repoRoot = process.cwd();
const required = [
  'docs/20_architecture_and_specs/openspec/debug_page_world_class_openspec.md',
  'docs/40_backlog_and_tasks/debug_page_world_class_sliceplan.md',
  'docs/40_backlog_and_tasks/debug_page_world_class_sliceplan.json',
  'docs/40_backlog_and_tasks/debug_page_keybook.json',
  'docs/40_backlog_and_tasks/debug_page_behavior_contract.md',
  'docs/40_backlog_and_tasks/debug_page_proof_input_contract.md',
  'docs/20_architecture_and_specs/openspec/debug_page_style_proof_contract_openspec.md',
  'tools/run-debug-page-keybook-render-proof.mjs',
  'tools/run-debug-page-style-contract-proof.mjs'
];
const errors = [];
for (const rel of required) {
  if (!fs.existsSync(path.join(repoRoot, rel))) errors.push(`missing required reconciliation source: ${rel}`);
}
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
for (const script of ['proof:debug-page-keybook-render','proof:debug-page-style-contract','proof:debug-page-world-class-plan']) {
  if (!pkg.scripts?.[script]) errors.push(`missing package proof script: ${script}`);
}
const reconciliation = fs.readFileSync(path.join(repoRoot, 'docs/50_audits_and_migrations/DEBUG_PAGE_WORLD_CLASS_RECONCILIATION_20260619.md'), 'utf8');
for (const text of ['does not claim browser screenshot proof', 'real provider behavior', 'real recovery behavior']) {
  if (!reconciliation.includes(text)) errors.push(`reconciliation non-claim missing: ${text}`);
}
const result = { proof_kind: 'debug_page_world_class_reconciliation', proof_status: errors.length === 0 ? 'PASSED' : 'FAILED', checked_sources: required.length, errors };
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
