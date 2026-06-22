#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const repoRoot = process.cwd();
const css = fs.readFileSync(path.join(repoRoot, 'dashboard/styles.css'), 'utf8');
const openspec = fs.readFileSync(path.join(repoRoot, 'docs/20_architecture_and_specs/openspec/debug_page_style_proof_contract_openspec.md'), 'utf8');
const errors = [];
function addError(message) { errors.push(message); }
for (const required of [
  '.debug-visual-toolbar',
  '.debug-page--schema-1',
  '.debug-page--schema-2',
  '.debug-page--schema-3',
  '.debug-page--visual-2',
  '.debug-page--visual-3',
  '@media (max-width: 780px)',
  ':focus-visible',
  '.debug-status-chip--pass',
  '.debug-status-chip--blocked',
  '.debug-status-chip--fail',
  '.debug-element-marker',
  '.debug-element-modal'
]) {
  if (!css.includes(required)) addError(`CSS missing Debug style contract marker: ${required}`);
}
for (const required of ['Source-level checks', 'Screenshot/browser checks', 'does not prove final visual appearance']) {
  if (!openspec.includes(required)) addError(`style OpenSpec missing: ${required}`);
}
const result = { proof_kind: 'debug_page_style_contract', proof_status: errors.length === 0 ? 'PASSED' : 'FAILED', errors, non_claims: ['This is a source-level style contract proof, not a browser screenshot proof.'] };
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
