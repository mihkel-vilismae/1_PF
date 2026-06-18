/** Final proof-runner summary helpers. */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const FINAL_READINESS_KIND = 'raspberry_v1_readiness';
export const FINAL_READINESS_INPUT_KINDS = Object.freeze([
  'real_icloudpd_pipeline',
  'real_download_continuation',
  'real_geocode_provider_chain',
  'raspberry_regular_stage_worker_product_pipeline',
  'raspberry_address_overlay_device_display',
  'raspberry_dashboard_status_view',
  'raspberry_screen_worker_non_blocking',
  'raspberry_v1_docs_reconciliation',
]);

function proofTimestampMs(artifact) {
  const parsed = Date.parse(artifact?.proof_timestamp ?? artifact?.timestamp ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function collectProofArtifactsFromDirectory(proofsDir) {
  let entries = [];
  try {
    entries = await readdir(proofsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const artifacts = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    try {
      const artifact = JSON.parse(await readFile(join(proofsDir, entry.name), 'utf8'));
      const proofKind = artifact.proof_kind ?? artifact.proofKind ?? null;
      if (!proofKind) continue;
      artifacts.push({ ...artifact, source_file: entry.name });
    } catch {
      // Ignore malformed files; other proofs own their own parse failure status.
    }
  }
  return artifacts;
}

export function latestArtifactsByKind(artifacts) {
  const latest = new Map();
  for (const artifact of artifacts) {
    const kind = artifact.proof_kind ?? artifact.proofKind;
    const current = latest.get(kind);
    if (!current || proofTimestampMs(artifact) >= proofTimestampMs(current)) latest.set(kind, artifact);
  }
  return Object.fromEntries(latest.entries());
}

export function buildFinalProofRunnerSummary({ artifacts = [] } = {}) {
  const latestByKind = latestArtifactsByKind(artifacts);
  const readiness = latestByKind[FINAL_READINESS_KIND] ?? null;
  const observedInputs = FINAL_READINESS_INPUT_KINDS
    .map((kind) => latestByKind[kind])
    .filter(Boolean);
  const missingInputs = FINAL_READINESS_INPUT_KINDS.filter((kind) => !latestByKind[kind]);
  const readinessTimestamp = proofTimestampMs(readiness);
  const staleInputs = observedInputs
    .filter((artifact) => readinessTimestamp > 0 && proofTimestampMs(artifact) > readinessTimestamp)
    .map((artifact) => ({ proof_kind: artifact.proof_kind, proof_timestamp: artifact.proof_timestamp, source_file: artifact.source_file }));
  const hasReadiness = Boolean(readiness);
  const readinessAfterObservedInputs = hasReadiness && staleInputs.length === 0;
  const proofStatus = hasReadiness && readinessAfterObservedInputs ? 'PASSED' : 'BLOCKED';
  return {
    proof_status: proofStatus,
    latest_readiness: readiness ? {
      proof_kind: readiness.proof_kind,
      proof_status: readiness.proof_status,
      proof_timestamp: readiness.proof_timestamp,
      source_file: readiness.source_file,
      summary: readiness.evidence?.summary ?? null,
      blocking_gate_ids: readiness.evidence?.blocking_gate_ids ?? [],
    } : null,
    observed_input_count: observedInputs.length,
    missing_input_kinds: missingInputs,
    stale_input_artifacts_after_readiness: staleInputs,
    readiness_after_observed_inputs: readinessAfterObservedInputs,
    next_steps: hasReadiness
      ? ['Inspect latest_readiness.summary and blocking_gate_ids for remaining v1 blockers.']
      : ['Run proof:raspberry-v1-readiness after all other proof-producing commands in the proof-runner queue.'],
  };
}
