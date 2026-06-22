#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const planPath = path.join(repoRoot, 'docs/40_backlog_and_tasks/debug_page_world_class_sliceplan.json');
const planMdPath = path.join(repoRoot, 'docs/40_backlog_and_tasks/debug_page_world_class_sliceplan.md');
const openspecPath = path.join(repoRoot, 'docs/20_architecture_and_specs/openspec/debug_page_world_class_openspec.md');
const errors = [];
const warnings = [];

function read(relOrAbs) {
  return fs.readFileSync(path.isAbsolute(relOrAbs) ? relOrAbs : path.join(repoRoot, relOrAbs), 'utf8');
}
function exists(rel) { return fs.existsSync(path.join(repoRoot, rel)); }
function addError(message) { errors.push(message); }

if (!exists('docs/40_backlog_and_tasks/debug_page_world_class_sliceplan.json')) addError('missing JSON sliceplan');
if (!exists('docs/40_backlog_and_tasks/debug_page_world_class_sliceplan.md')) addError('missing Markdown sliceplan');
if (!exists('docs/20_architecture_and_specs/openspec/debug_page_world_class_openspec.md')) addError('missing world-class OpenSpec');

let plan = null;
if (fs.existsSync(planPath)) {
  plan = JSON.parse(read(planPath));
  if (plan.batch_count !== 4) addError(`expected 4 batches, got ${plan.batch_count}`);
  if (plan.slice_count !== 18) addError(`expected 18 slices, got ${plan.slice_count}`);
  if (!Array.isArray(plan.batches) || plan.batches.length !== 4) addError('plan must contain exactly 4 batches');
  const slices = (plan.batches || []).flatMap((batch) => batch.slices || []);
  if (slices.length !== 18) addError(`expected 18 slice records, got ${slices.length}`);
  const ids = slices.map((slice) => slice.slice_id);
  if (new Set(ids).size !== ids.length) addError('slice ids must be unique');
  for (const slice of slices) {
    if (typeof slice.difficulty !== 'number' || slice.difficulty < 1 || slice.difficulty > 10) addError(`invalid difficulty for ${slice.slice_id}`);
    if (typeof slice.importance !== 'number' || slice.importance < 1 || slice.importance > 10) addError(`invalid importance for ${slice.slice_id}`);
    if (slice.acr_required !== true) addError(`slice must require ACR: ${slice.slice_id}`);
    if (slice.proof_required !== true) addError(`slice must require proof: ${slice.slice_id}`);
  }
}

const md = fs.existsSync(planMdPath) ? read(planMdPath) : '';
const openspec = fs.existsSync(openspecPath) ? read(openspecPath) : '';
for (const required of [
  '3+2ACR generation result',
  '4 batches',
  '18',
  'TOGGLE VISUALS',
  'CLICK TO CHANGE COLOR SCHEMA [1,2,3]',
  'CLICK TO IMPROVE LOOK BY MAKING MAJOR VISUAL CHANGES [1,2,3]',
  'proof input',
  'PASS/BLOCKED/FAILED',
  'Non-claims',
]) {
  if (!(`${md}\n${openspec}`).includes(required)) addError(`required planning/OpenSpec text missing: ${required}`);
}

const result = {
  proof_kind: 'debug_page_world_class_plan',
  proof_status: errors.length === 0 ? 'PASSED' : 'FAILED',
  batch_count: plan?.batch_count ?? null,
  slice_count: plan?.slice_count ?? null,
  confidence: plan?.confidence ?? null,
  warnings,
  errors,
  non_claims: [
    'This proof validates the world-class Debug page plan/OpenSpec, not runtime implementation of all slices.',
    'Real provider, device, recovery, worker, media/database, and Raspberry behavior remain outside this plan proof.'
  ]
};
console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exit(1);
