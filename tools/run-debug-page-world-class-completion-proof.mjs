#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const repoRoot = process.cwd();
const report = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/40_backlog_and_tasks/debug_page_world_class_completion_report.json'), 'utf8'));
const md = fs.readFileSync(path.join(repoRoot, 'docs/40_backlog_and_tasks/debug_page_world_class_completion_report.md'), 'utf8');
const errors = [];
function addError(message) { errors.push(message); }
if (report.world_class_track.batches_completed !== 4) addError('Batch 4 must be complete.');
if (report.world_class_track.slices_completed !== 18) addError('All 18 planned world-class slices must be complete.');
if (report.world_class_track.openspec_score_estimate < 85) addError('OpenSpec estimate must be 85+.');
if (report.world_class_track.implementation_score_estimate < 85) addError('Implementation estimate must be 85+.');
if (!Array.isArray(report.next_batches) || report.next_batches.length !== 2) addError('Completion report must generate exactly two next batches.');
for (const text of ['DBG-WC-BATCH-5', 'DBG-WC-BATCH-6', 'Remaining non-claims', 'Debug View scope only']) {
  if (!md.includes(text)) addError(`completion report markdown missing: ${text}`);
}
const result = {
  proof_kind: 'debug_page_world_class_completion',
  proof_status: errors.length === 0 ? 'PASSED' : 'FAILED',
  openspec_score_estimate: report.world_class_track.openspec_score_estimate,
  implementation_score_estimate: report.world_class_track.implementation_score_estimate,
  next_batch_count: report.next_batches.length,
  errors,
  non_claims: report.remaining_non_claims
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
