#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const keybookPath = path.join(repoRoot, 'docs/40_backlog_and_tasks/debug_page_keybook.json');
const packagePath = path.join(repoRoot, 'package.json');
const keybook = JSON.parse(fs.readFileSync(keybookPath, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const scripts = pkg.scripts || {};
const errors = [];
const warnings = [];

function exists(rel) {
  if (rel.startsWith('planned:')) return true;
  return fs.existsSync(path.join(repoRoot, rel));
}
function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}
function addError(message) { errors.push(message); }
function addWarning(message) { warnings.push(message); }

if (!Array.isArray(keybook.entries) || keybook.entries.length === 0) {
  addError('debug_page_keybook.json must contain entries.');
}

const ids = new Set();
for (const entry of keybook.entries || []) {
  if (!entry.id || typeof entry.id !== 'string') addError('entry missing string id');
  if (ids.has(entry.id)) addError(`duplicate id: ${entry.id}`);
  ids.add(entry.id);
  if (!entry.id.startsWith('pf.debug.')) addError(`id must start with pf.debug.: ${entry.id}`);
  if (!entry.type) addError(`entry missing type: ${entry.id}`);
  if (!entry.label) addError(`entry missing label: ${entry.id}`);
  if (!entry.reality) addError(`entry missing reality: ${entry.id}`);
  if (!entry.non_claim) addError(`entry missing non_claim: ${entry.id}`);
  for (const rel of [entry.source_file, entry.model_file].filter(Boolean)) {
    if (!exists(rel)) addError(`missing source/model file for ${entry.id}: ${rel}`);
  }
  for (const rel of entry.docs || []) {
    if (!exists(rel)) addError(`missing doc for ${entry.id}: ${rel}`);
  }
  for (const rel of entry.tests || []) {
    if (!exists(rel)) addError(`missing test for ${entry.id}: ${rel}`);
  }
  for (const proof of entry.proofs || []) {
    if (proof.startsWith('planned:')) continue;
    if (!scripts[proof]) addError(`missing proof script for ${entry.id}: ${proof}`);
  }
  if (entry.marker && !entry.marker.startsWith('planned:') && entry.source_file) {
    const sourceText = read(entry.source_file);
    const markerText = entry.current_marker_value ? `${entry.marker}="${entry.current_marker_value}"` : entry.marker;
    if (!sourceText.includes(markerText)) {
      addError(`source marker not found for ${entry.id}: ${markerText} in ${entry.source_file}`);
    }
  }
  if (entry.implemented_id === true && entry.source_file) {
    const sourceText = read(entry.source_file);
    if (!sourceText.includes(`data-ui-element-id="${entry.id}"`)) {
      addError(`implemented_id true but data-ui-element-id missing for ${entry.id}`);
    }
  }
  if (entry.implemented_id === false) {
    addWarning(`stable UI id is seeded/planned, not rendered yet: ${entry.id}`);
  }
}

const requiredDocs = [
  'docs/10_runbooks/debug_page_runbook.md',
  'docs/20_architecture_and_specs/openspec/debug_page_openspec.md',
  'docs/40_backlog_and_tasks/debug_page_goal_registry.md',
  '.codex/skills/debug-page-keybook/SKILL.md',
];
for (const rel of requiredDocs) {
  if (!exists(rel)) addError(`required keybook reference missing: ${rel}`);
}

const result = {
  proof_kind: 'debug_page_keybook',
  proof_status: errors.length === 0 ? 'PASSED' : 'FAILED',
  entry_count: (keybook.entries || []).length,
  unique_id_count: ids.size,
  warnings,
  errors,
  non_claims: [
    'This proof validates the repo-local Debug page keybook seed and references.',
    'It does not prove data-ui-element-id attributes are rendered until implemented_id is true for entries.',
    'It does not prove real backend/provider/crontab/worker/database/media/Raspberry behavior.'
  ]
};
console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exit(1);
