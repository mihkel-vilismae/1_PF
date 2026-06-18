/** Raspberry dashboard status view proof helper. */
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { buildRuntimeStatusProjectionFromState, projectionHasRuntimeSuccessClaim } from '../dashboard/services/runtimeStatusProjection.ts';
import { renderRunningProcessView } from '../dashboard/views/runningProcessView.ts';

export function buildRaspberryDashboardStatusViewEvidence() {
  const state = createInitialState();
  const projection = buildRuntimeStatusProjectionFromState(state);
  const markup = renderRunningProcessView(state);
  const checks = [
    { name: 'projection_is_read_only', passed: projection.readOnly === true },
    { name: 'projection_forbids_mutation', passed: projection.mutationAllowed === false },
    { name: 'projection_has_non_claim_boundary', passed: /does not start\/stop workers/.test(projection.nonClaim) && /prove Raspberry hardware/.test(projection.nonClaim) },
    { name: 'view_renders_projection_source', passed: /data-runtime-status-projection-source=/.test(markup) },
    { name: 'view_renders_projection_status', passed: /data-runtime-status-projection-status=/.test(markup) },
    { name: 'view_avoids_simulated_success_copy', passed: !/Simulated runtime preview is now active/.test(markup) },
    { name: 'projection_helper_confirms_read_only_contract', passed: projectionHasRuntimeSuccessClaim(projection) === true },
  ];
  return { projection, checks, passed: checks.every((check) => check.passed), non_claims: ['does not start or stop workers', 'does not mutate crontab', 'does not write production media/database', 'does not prove real Raspberry provider or hardware behavior'] };
}

export function buildRaspberryDashboardStatusViewProof({ metadata }) {
  const evidence = buildRaspberryDashboardStatusViewEvidence();
  return createProofEnvelope({
    proofKind: 'raspberry_dashboard_status_view',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evidence.passed ? 'PASSED' : 'FAILED',
    runtimeMode: 'raspberry_dashboard_status_view_read_only_prepass',
    evidence: sanitizeEvidence({ environment: getProofEnvironment(), ...evidence }),
    knownLimitations: evidence.passed
      ? ['This proves the dashboard status view has a read-only proof-backed projection surface; it does not prove real providers or hardware.']
      : ['One or more read-only dashboard status view checks failed.'],
  });
}
