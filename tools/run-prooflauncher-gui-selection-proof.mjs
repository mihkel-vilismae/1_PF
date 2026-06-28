#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import {
  INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS,
  buildProofRunnerQueuePlanForMode,
  normalizeProofRunnerLauncherSelection,
  assertFinalSummaryProofsRunLast,
} from './proof-runner-queue-lib.mjs';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const plans = Object.fromEntries(
  INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS.map((option) => [
    option.mode,
    buildProofRunnerQueuePlanForMode(pkg, { runMode: option.mode, includeWindowsAliases: true }),
  ]),
);
const changedPlan = buildProofRunnerQueuePlanForMode(pkg, {
  runMode: 'changed',
  includeWindowsAliases: true,
  changedProofs: ['proof:proofrunner-handoff-mode-contract'],
});
const checks = [
  {
    name: 'interactive_modes_are_all_selectable',
    passed: INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS.every((option) => plans[option.mode]?.run_mode === option.mode),
    detail: Object.fromEntries(Object.entries(plans).map(([mode, plan]) => [mode, plan.ordered_count])),
  },
  {
    name: 'numeric_menu_choices_normalize_to_expected_modes',
    passed: INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS.every((option) => normalizeProofRunnerLauncherSelection(option.choice) === option.mode),
    detail: INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS.map((option) => ({ choice: option.choice, mode: option.mode, actual: normalizeProofRunnerLauncherSelection(option.choice) })),
  },
  {
    name: 'legacy_all_maps_to_full',
    passed: normalizeProofRunnerLauncherSelection('all') === 'full' && plans.full.ordered_count > plans.minimum.ordered_count,
    detail: { full: plans.full.ordered_count, minimum: plans.minimum.ordered_count },
  },
  {
    name: 'quick_is_distinct_from_minimum',
    passed: normalizeProofRunnerLauncherSelection('quick') === 'quick' && plans.quick.ordered_count < plans.minimum.ordered_count,
    detail: { quick: plans.quick.ordered_count, minimum: plans.minimum.ordered_count },
  },
  {
    name: 'changed_mode_remains_available_for_automation',
    passed: changedPlan.run_mode === 'changed' && changedPlan.ordered_proofs.includes('proof:proofrunner-handoff-mode-contract'),
    detail: { changed_count: changedPlan.ordered_count, proofs: changedPlan.ordered_proofs },
  },
  {
    name: 'final_summary_last_when_present',
    passed: Object.values(plans).every((plan) => assertFinalSummaryProofsRunLast(plan.ordered_proofs).passed),
    detail: Object.fromEntries(Object.entries(plans).map(([mode, plan]) => [mode, plan.ordered_proofs.slice(-5)])),
  },
];
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const meta = await metadata();
const envelope = createProofEnvelope({
  proofKind: 'prooflauncher_gui_selection',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus,
  runtimeMode: 'local_launcher_gui_selection_contract',
  evidence: { checks, mode_counts: Object.fromEntries(Object.entries(plans).map(([mode, plan]) => [mode, plan.ordered_count])) },
  knownLimitations: ['This proves queue-selection happy paths only; it does not execute the selected queues.'],
});
const outputPath = await writeProofArtifact('prooflauncher_gui_selection', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
