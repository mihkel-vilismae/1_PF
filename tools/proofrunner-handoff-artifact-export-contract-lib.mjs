/** Proofrunner handoff artifact-export contract helpers. */

export function analyzeHandoffLauncherArtifactExportText(text = '') {
  const source = String(text ?? '');
  const checks = [
    {
      name: 'passes_summary_path_to_final_summary',
      passed: /PF_PROOF_SUMMARY_(PATH|FILE)/.test(source) && /proof:proof-runner-final-summary/.test(source),
      detail: 'Final summary must receive the shell proof_summary path so nonzero exits cannot be hidden.',
    },
    {
      name: 'exports_runtime_proof_artifacts',
      passed: /runtime_data[\\/]proofs|runtime_data\\proofs|runtime_data\/proofs/.test(source),
      detail: 'The handoff must package runtime_data/proofs JSON artifacts, including failed proof artifacts.',
    },
    {
      name: 'records_failed_exit_counts',
      passed: /proof_scripts_failed_exit_nonzero/.test(source),
      detail: 'repo_identity.json must expose failed shell-exit proof script counts.',
    },
    {
      name: 'keeps_packaging_after_failures',
      passed: /continue after failures|always package|package even when|failed_exit_nonzero/i.test(source),
      detail: 'Packaging must continue after failed proof commands so diagnostics are uploadable.',
    },
    {
      name: 'explicitly_collects_full_test_detail_artifacts',
      passed: /full_test_suite_stability_\*/.test(source) || /full_test_suite_stability_.*\.json/.test(source),
      detail: 'Launchers should explicitly collect full_test_suite_stability_*.json into packaged logs/runtime diagnostics, because failed full-test detail is needed for failed-last triage.',
    },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}

export function buildAcceptedArtifactExportSnippet() {
  return `# continue after failures; always package runtime_data/proofs diagnostics
PF_PROOF_SUMMARY_PATH="$SUMMARY" npm run proof:proof-runner-final-summary
proof_scripts_failed_exit_nonzero="$FAILED"
cp runtime_data/proofs/full_test_suite_stability_*.json logs/ 2>/dev/null || true
zip -r "$EVIDENCE_ZIP" logs repo_identity.json runtime_data/proofs`;
}
