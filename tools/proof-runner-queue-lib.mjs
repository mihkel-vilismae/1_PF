/**
 * Proof-runner queue ordering helpers for 2proofrunner handoffs.
 * Keeps release-readiness summary proofs after proof-producing commands so the
 * uploaded report represents the final state of that run rather than an early snapshot.
 */

export const FINAL_SUMMARY_PROOFS = Object.freeze([
  'proof:raspberry-v1-readiness',
  'proof:proof-report-blocker-summary',
  'proof:proof-runner-final-summary',
]);

export const WINDOWS_ONLY_SUFFIX = ':windows';


export const MINIMUM_PROOF_RUNNER_PROOFS = Object.freeze([
  'proof:docs-reconciliation-audit',
  'proof:full-test',
  'proof:openspec-v1-audit',
  'proof:overall-project-completeness-registry',
  'proof:proof-runner-queue',
  'proof:proofrunner-windows-launcher-contract',
  'proof:raspberry-v1-readiness',
  'proof:proof-report-blocker-summary',
  'proof:proof-runner-final-summary',
]);

export function discoverProofScriptsFromPackage(pkg, { includeWindowsAliases = true } = {}) {
  const scripts = Object.keys(pkg?.scripts ?? {}).filter((name) => name.startsWith('proof:'));
  return scripts.filter((name) => includeWindowsAliases || !name.endsWith(WINDOWS_ONLY_SUFFIX)).sort();
}

export function orderProofScriptsForEvidenceRun(proofScripts, { includeWindowsAliases = true } = {}) {
  const uniqueScripts = [...new Set(proofScripts)]
    .filter((name) => includeWindowsAliases || !name.endsWith(WINDOWS_ONLY_SUFFIX));
  const finalSet = new Set(FINAL_SUMMARY_PROOFS);
  const regular = uniqueScripts.filter((name) => !finalSet.has(name)).sort();
  const finals = FINAL_SUMMARY_PROOFS.filter((name) => uniqueScripts.includes(name));
  return [...regular, ...finals];
}

export function buildProofRunnerQueuePlan(pkg, options = {}) {
  const discovered = discoverProofScriptsFromPackage(pkg, options);
  const ordered = orderProofScriptsForEvidenceRun(discovered, options);
  return {
    discovered_count: discovered.length,
    ordered_count: ordered.length,
    include_windows_aliases: options.includeWindowsAliases !== false,
    final_summary_proofs: FINAL_SUMMARY_PROOFS.filter((name) => ordered.includes(name)),
    ordered_proofs: ordered,
    skipped_windows_aliases: options.includeWindowsAliases === false
      ? discoverProofScriptsFromPackage(pkg, { includeWindowsAliases: true }).filter((name) => name.endsWith(WINDOWS_ONLY_SUFFIX))
      : [],
  };
}

export function assertFinalSummaryProofsRunLast(orderedProofs) {
  const presentFinals = FINAL_SUMMARY_PROOFS.filter((name) => orderedProofs.includes(name));
  if (presentFinals.length === 0) return { passed: true, reason: 'No final summary proof scripts are present.' };
  const firstFinalIndex = Math.min(...presentFinals.map((name) => orderedProofs.indexOf(name)));
  const nonFinalAfter = orderedProofs.slice(firstFinalIndex).filter((name) => !FINAL_SUMMARY_PROOFS.includes(name));
  return {
    passed: nonFinalAfter.length === 0,
    first_final_index: firstFinalIndex,
    final_summary_proofs_present: presentFinals,
    non_final_proofs_after_summary: nonFinalAfter,
  };
}


export function buildMinimumProofRunnerQueuePlan(pkg, options = {}) {
  const fullPlan = buildProofRunnerQueuePlan(pkg, options);
  const available = new Set(fullPlan.ordered_proofs);
  const selected = MINIMUM_PROOF_RUNNER_PROOFS.filter((name) => available.has(name));
  const ordered = orderProofScriptsForEvidenceRun(selected, options);
  return {
    ...fullPlan,
    run_mode: 'minimum',
    minimum_required_proofs: MINIMUM_PROOF_RUNNER_PROOFS,
    ordered_count: ordered.length,
    ordered_proofs: ordered,
    missing_minimum_proofs: MINIMUM_PROOF_RUNNER_PROOFS.filter((name) => !available.has(name)),
    full_discovered_count: fullPlan.discovered_count,
    full_ordered_count: fullPlan.ordered_count,
  };
}

export function buildProofRunnerQueuePlanForMode(pkg, { runMode = 'all', ...options } = {}) {
  return runMode === 'minimum'
    ? buildMinimumProofRunnerQueuePlan(pkg, options)
    : { ...buildProofRunnerQueuePlan(pkg, options), run_mode: 'all' };
}
