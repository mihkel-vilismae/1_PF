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


export function parseProofSummaryTable(text) {
  const normalized = String(text ?? '').trim();
  if (!normalized) return [];
  const lines = normalized.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map((header) => header.trim());
  const requiredHeaders = ['name', 'status', 'exit_code'];
  if (!requiredHeaders.every((header) => headers.includes(header))) return [];
  return lines.slice(1).map((line) => {
    const cells = line.split(delimiter);
    const row = {};
    headers.forEach((header, index) => { row[header] = cells[index] ?? ''; });
    return {
      name: row.name,
      status: row.status,
      exit_code: Number.parseInt(row.exit_code, 10),
      log_file: row.log_file ?? '',
    };
  });
}

export function summarizeProofSummaryRows(rows = []) {
  const total = rows.length;
  const failedRows = rows.filter((row) => Number(row.exit_code) !== 0 || row.status === 'FAIL' || row.status === 'FAILED');
  const passedRows = rows.filter((row) => Number(row.exit_code) === 0 && !['FAIL', 'FAILED'].includes(row.status));
  return {
    provided: rows.length > 0,
    total,
    passed_exit_zero_count: passedRows.length,
    failed_exit_nonzero_count: failedRows.length,
    failed_rows: failedRows.map((row) => ({ name: row.name, status: row.status, exit_code: row.exit_code, log_file: row.log_file })),
  };
}

export function buildFinalProofRunnerSummary({ artifacts = [], shellSummaryRows = [] } = {}) {
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
  const readinessProofStatus = hasReadiness && readinessAfterObservedInputs ? 'PASSED' : 'BLOCKED';
  const shell_summary = summarizeProofSummaryRows(shellSummaryRows);
  const proofStatus = shell_summary.failed_exit_nonzero_count > 0 ? 'FAILED' : readinessProofStatus;
  return {
    proof_status: proofStatus,
    readiness_proof_status: readinessProofStatus,
    shell_summary,
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
    next_steps: shell_summary.failed_exit_nonzero_count > 0
      ? ['Fix failed shell-level proof scripts before treating the proof run as green.', 'Inspect shell_summary.failed_rows for the exact failed commands.']
      : hasReadiness
        ? ['Inspect latest_readiness.summary and blocking_gate_ids for remaining v1 blockers.']
        : ['Run proof:raspberry-v1-readiness after all other proof-producing commands in the proof-runner queue.'],
  };
}
