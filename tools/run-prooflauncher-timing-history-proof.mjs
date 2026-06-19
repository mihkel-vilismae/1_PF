#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { TIMING_ESTIMATE_PRIORITY, buildTimingHistorySummary, estimateProofDuration } from './prooflauncher-timing-history-lib.mjs';

const doc = readFileSync('docs/10_runbooks/prooflauncher_gui_selection.md', 'utf8');
const observations = [
  { command: 'proof:real-icloudpd-readiness', category: 'provider', platform: 'win', duration_seconds: 12 },
  { command: 'proof:real-icloudpd-readiness', category: 'provider', platform: 'win', duration_seconds: 18 },
  { command: 'proof:docs-reconciliation-audit', category: 'docs', platform: 'raspberryos', duration_seconds: 3 },
];
const summary = buildTimingHistorySummary(observations);
const exact = estimateProofDuration({ commandName: 'proof:real-icloudpd-readiness', platform: 'win', historySummary: summary });
const category = estimateProofDuration({ commandName: 'proof:real-download-readiness', platform: 'win', historySummary: summary });
const platform = estimateProofDuration({ commandName: 'proof:unknown-command', platform: 'raspberryos', historySummary: summary });
const checks = [
  { name: 'priority_order', passed: TIMING_ESTIMATE_PRIORITY.join('>') === 'command_history>category_history>platform_average>global_average' },
  { name: 'doc_elapsed_time', passed: /elapsed time/i.test(doc) },
  { name: 'doc_estimated_finish_time', passed: /estimated finish time/i.test(doc) },
  { name: 'doc_estimated_time_remaining', passed: /estimated time remaining/i.test(doc) },
  { name: 'doc_final_timing_table', passed: /final timing table/i.test(doc) },
  { name: 'exact_command_history', passed: exact.estimate_source === 'command_history' && exact.estimate_seconds === 15 },
  { name: 'category_history', passed: category.estimate_source === 'category_history' },
  { name: 'platform_average', passed: platform.estimate_source === 'platform_average' },
];
const result = { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks, exact, category, platform, summary };
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === 'PASSED' ? 0 : 1);
