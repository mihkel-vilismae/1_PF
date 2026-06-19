/** Proof-run handoff triage helpers for uploaded proof ZIP analysis. */
export const TRIAGE_LAYERS = Object.freeze(['baseline', 'launcher', 'install', 'shell_exit', 'proof_json_status', 'artifact_inventory', 'final_summary']);

export function classifyProofRow(row = {}) {
  const exitCode = Number(row.exit_code ?? row.exitCode ?? 0);
  const proofStatus = String(row.proof_status ?? row.proofStatus ?? '').toUpperCase() || null;
  if (exitCode !== 0) return { class: 'HARD_FAIL', reason: `shell exit ${exitCode}` };
  if (proofStatus === 'FAILED') return { class: 'PROOF_FAILED', reason: 'proof JSON FAILED' };
  if (proofStatus === 'BLOCKED') return { class: 'HONEST_BLOCKED', reason: 'proof JSON BLOCKED' };
  if (proofStatus === 'PASSED') return { class: 'PASS', reason: 'exit zero and proof JSON PASSED' };
  return { class: 'EXIT_ZERO_NO_JSON_STATUS', reason: 'exit zero without machine proof status' };
}

export function summarizeProofRows(rows = []) {
  const counts = {};
  const details = rows.map((row) => ({ ...row, triage: classifyProofRow(row) }));
  for (const row of details) counts[row.triage.class] = (counts[row.triage.class] ?? 0) + 1;
  return {
    rows_analyzed: details.length,
    counts,
    hard_failures: details.filter((row) => row.triage.class === 'HARD_FAIL' || row.triage.class === 'PROOF_FAILED'),
    honest_blocked: details.filter((row) => row.triage.class === 'HONEST_BLOCKED'),
    details,
  };
}

export function buildProofRunHandoffChecklist() {
  return {
    required_uploads: ['proof_results_zip_from_windows_or_raspberry', 'matching_repo_zip_or_baseline_identity'],
    required_analysis_layers: [...TRIAGE_LAYERS],
    required_summary_fields: ['platform', 'repo_version', 'repo_head', 'total_rows', 'exit_nonzero_count', 'proof_status_counts', 'blocked_reasons', 'hard_failures'],
    rule: 'Analyze shell exit status and proof JSON proof_status separately.',
  };
}
