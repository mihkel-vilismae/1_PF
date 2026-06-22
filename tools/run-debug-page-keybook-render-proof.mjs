#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const debugView = fs.readFileSync(path.join(repoRoot, 'dashboard/views/debugView.ts'), 'utf8');
const app = fs.readFileSync(path.join(repoRoot, 'dashboard/app.ts'), 'utf8');
const keybook = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/40_backlog_and_tasks/debug_page_keybook.json'), 'utf8'));
const errors = [];
function addError(message) { errors.push(message); }

const implemented = keybook.entries.filter((entry) => entry.implemented_id === true);
for (const entry of implemented) {
  if (!debugView.includes(entry.id)) addError(`Debug view source missing implemented id literal: ${entry.id}`);
}
for (const required of [
  'pf.debug.help.pane',
  'pf.debug.stack_status.pane',
  'pf.debug.elements_list.pane',
  'pf.debug.behavior_registry.pane',
  'pf.debug.proof_input.pane',
  'pf.debug.auth_session.pane',
  'pf.debug.visuals.toolbar',
  'pf.debug.visuals.color_schema_button',
  'pf.debug.visuals.major_visual_button',
  'data-debug-color-schema',
  'data-debug-visual-mode',
  'data-debug-element-marker',
  'data-debug-element-modal',
  'data-debug-behavior-registry',
  'data-debug-proof-input',
  'TOGGLE VISUALS',
  'CLICK TO CHANGE COLOR SCHEMA [1,2,3]',
  'CLICK TO IMPROVE LOOK BY MAKING MAJOR VISUAL CHANGES [1,2,3]',
  'PASS',
  'BLOCKED',
  'FAILED'
]) {
  if (!debugView.includes(required)) addError(`Debug view source missing required render contract text: ${required}`);
}
if (!app.includes('event.stopPropagation()') || !app.includes('underlyingActionTriggered: false')) {
  addError('Debug marker app handler must stop propagation and record underlyingActionTriggered:false.');
}
const result = {
  proof_kind: 'debug_page_keybook_render',
  proof_status: errors.length === 0 ? 'PASSED' : 'FAILED',
  implemented_entry_count: implemented.length,
  errors,
  non_claims: [
    'This is a source-level render contract proof, not a browser screenshot proof.',
    'It does not prove real auth/provider/crontab/worker/database/media/Raspberry/recovery behavior.'
  ]
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
