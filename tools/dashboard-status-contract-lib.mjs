/** Dashboard status data contract helpers for proof-backed v1 status view. */
export const DASHBOARD_STATUS_SECTIONS = Object.freeze([
  'worker_health',
  'current_playback',
  'v1_readiness_gates',
  'latest_proof_artifacts',
  'provider_status',
]);

export function buildDashboardStatusContract({ controlScope = 'status_only' } = {}) {
  return {
    contract_version: 1,
    controlScope,
    sections: DASHBOARD_STATUS_SECTIONS.map((name) => ({ name, required: true })),
    source_of_truth: 'backend/proof artifacts',
    forbidden_claims: ['do not claim provider success without proof artifact', 'do not claim device pixels without display evidence', 'do not expose dashboard controls unless explicitly scoped'],
  };
}

export function evaluateDashboardStatusSnapshot(snapshot = {}, contract = buildDashboardStatusContract()) {
  const missingSections = contract.sections.filter((section) => !Object.prototype.hasOwnProperty.call(snapshot, section.name)).map((section) => section.name);
  const invalidControlScope = snapshot.controlScope && snapshot.controlScope !== contract.controlScope;
  return {
    complete: missingSections.length === 0 && !invalidControlScope,
    missingSections,
    invalidControlScope: Boolean(invalidControlScope),
  };
}

export function buildEmptyDashboardStatusSnapshot() {
  return {
    controlScope: 'status_only',
    worker_health: [],
    current_playback: null,
    v1_readiness_gates: [],
    latest_proof_artifacts: [],
    provider_status: [],
  };
}
