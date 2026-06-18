/** Proof-report blocker summary helpers. */
import { latestArtifactsByKind } from './proof-runner-final-summary-lib.mjs';

export const BLOCKER_CATEGORIES = Object.freeze({
  config_or_env: ['readiness inputs, opt-in flags, provider ids, config keys, or local paths are missing'],
  auth_or_session: ['auth checkpoint, session usable state, iCloud login, or cookie/session boundary is missing'],
  provider_or_network: ['real provider, geocode network, iCloud provider, or real download proof is blocked or failed'],
  product_evidence: ['regular worker product pipeline or staged product evidence is missing'],
  operator_evidence: ['operator/device/display/manual observation evidence is missing'],
  test_or_docs: ['tests, docs, queue, or reconciliation proof failed or blocked'],
  platform_optional: ['platform-specific proof is unavailable or not required on this target'],
});

const CATEGORY_RULES = Object.freeze([
  { category: 'auth_or_session', patterns: [/auth/i, /session/i, /icloudpd_preflight/i] },
  { category: 'provider_or_network', patterns: [/real_icloudpd/i, /real_download/i, /real_geocode/i, /geocode_provider/i] },
  { category: 'product_evidence', patterns: [/regular_stage_worker_product/i, /product_evidence/i, /regular_product/i] },
  { category: 'operator_evidence', patterns: [/address_overlay/i, /device_display/i, /reboot/i, /power_loss/i, /operator/i] },
  { category: 'test_or_docs', patterns: [/full_test/i, /docs/i, /reconciliation/i, /openspec/i, /queue/i, /final_summary/i] },
  { category: 'platform_optional', patterns: [/windows/i, /fedora/i, /linux_fedora/i] },
]);

function proofTimestampMs(artifact) {
  const parsed = Date.parse(artifact?.proof_timestamp ?? artifact?.timestamp ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

export function classifyBlocker(artifact) {
  const kind = artifact?.proof_kind ?? artifact?.proofKind ?? '';
  const status = artifact?.proof_status ?? artifact?.proofStatus ?? '';
  const reasonText = JSON.stringify(artifact?.evidence ?? {}).toLowerCase();
  const haystack = `${kind} ${status} ${reasonText}`;
  if (/missing|required|not set|opt-in|opt_in|configured|config|env|cookie_dir|download_dir|provider id/.test(haystack)) return 'config_or_env';
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) return rule.category;
  }
  return 'config_or_env';
}

export function summarizeProofReportBlockers({ artifacts = [] } = {}) {
  const latestByKind = latestArtifactsByKind(artifacts);
  const latestArtifacts = Object.values(latestByKind).sort((left, right) => (right.proof_timestamp ?? '').localeCompare(left.proof_timestamp ?? ''));
  const blockers = latestArtifacts
    .filter((artifact) => ['BLOCKED', 'FAILED', 'TIMED_OUT'].includes(artifact.proof_status))
    .map((artifact) => ({
      proof_kind: artifact.proof_kind,
      proof_status: artifact.proof_status,
      proof_timestamp: artifact.proof_timestamp,
      source_file: artifact.source_file ?? null,
      category: classifyBlocker(artifact),
      reason: artifact.evidence?.reason ?? artifact.evidence?.summary?.status ?? artifact.evidence?.blocking_reason ?? null,
    }));
  const categoryCounts = Object.fromEntries(Object.keys(BLOCKER_CATEGORIES).map((category) => [category, 0]));
  for (const blocker of blockers) categoryCounts[blocker.category] = (categoryCounts[blocker.category] ?? 0) + 1;
  const latestReadiness = latestByKind.raspberry_v1_readiness ?? null;
  const mostRecentArtifact = latestArtifacts[0] ?? null;
  const proofStatus = artifacts.length === 0 ? 'BLOCKED' : 'PASSED';
  return {
    proof_status: proofStatus,
    artifact_count: artifacts.length,
    latest_kind_count: Object.keys(latestByKind).length,
    blocker_count: blockers.length,
    category_counts: categoryCounts,
    blockers,
    latest_readiness: latestReadiness ? {
      proof_kind: latestReadiness.proof_kind,
      proof_status: latestReadiness.proof_status,
      proof_timestamp: latestReadiness.proof_timestamp,
      summary: latestReadiness.evidence?.summary ?? null,
      blocking_gate_ids: latestReadiness.evidence?.blocking_gate_ids ?? [],
    } : null,
    most_recent_artifact: mostRecentArtifact ? {
      proof_kind: mostRecentArtifact.proof_kind,
      proof_status: mostRecentArtifact.proof_status,
      proof_timestamp: mostRecentArtifact.proof_timestamp,
      source_file: mostRecentArtifact.source_file ?? null,
    } : null,
    next_priority: blockers[0]?.category ?? (artifacts.length === 0 ? 'run_proof_queue_first' : 'inspect_remaining_blockers'),
  };
}
