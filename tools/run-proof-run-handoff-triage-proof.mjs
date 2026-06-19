#!/usr/bin/env node
import { buildProofRunHandoffChecklist, summarizeProofRows } from './proof-run-handoff-triage-lib.mjs';
const sample = [
  { name: 'proof:a', exit_code: 0, proof_status: 'PASSED' },
  { name: 'proof:b', exit_code: 0, proof_status: 'BLOCKED' },
  { name: 'proof:c', exit_code: 1 },
];
const summary = summarizeProofRows(sample);
const checklist = buildProofRunHandoffChecklist();
const checks = [
  { name: 'separates_hard_failures', passed: summary.counts.HARD_FAIL === 1 },
  { name: 'separates_honest_blocked', passed: summary.counts.HONEST_BLOCKED === 1 },
  { name: 'requires_separate_layers', passed: checklist.required_analysis_layers.includes('shell_exit') && checklist.required_analysis_layers.includes('proof_json_status') },
];
const result = { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks, summary, checklist };
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === 'PASSED' ? 0 : 1);
