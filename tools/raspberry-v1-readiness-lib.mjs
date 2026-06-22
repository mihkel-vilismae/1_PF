/**
 * Evaluates Raspberry v1 readiness from the latest local proof artifacts.
 * Keeps gate status separate from artifact baseline/commit identity reporting.
 * Produces sanitized evidence and exact follow-up proof commands.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';

export const RASPBERRY_V1_MATRIX_DECISIONS = Object.freeze([
  { id: 1, answer: 'A', decision: 'v1.0 means a Raspberry-focused production/runtime milestone, not only a mock/local demo.' },
  { id: 2, answer: 'A', decision: 'real iCloud media source is required for v1.0.' },
  { id: 3, answer: 'A', decision: 'real GPS/geocode evidence is required for v1.0.' },
  { id: 4, answer: 'C', decision: 'physical power-loss recovery is not a v1.0 blocker; queue later.' },
  { id: 5, answer: 'C', decision: 'manual reboot recovery is not a v1.0 blocker; queue around v1.2.' },
  { id: 6, answer: 'A', decision: 'the cron workflow must include all three worker lanes as non-blocking operational lanes.' },
  { id: 7, answer: 'C', decision: 'cron setup may be operator/manual; fully automatic cron install is useful but not required.' },
  { id: 8, answer: 'A', decision: '.env may be auto-created/bootstrapped from example.env when missing.' },
  { id: 9, answer: 'A', decision: 'native Raspberry image and video playback are required.' },
  { id: 10, answer: 'A', decision: 'address overlay on the Raspberry/device display is required.' },
  { id: 11, answer: 'B', decision: 'physical screen on/off control is not required for v1.0 beyond not blocking the system.' },
  { id: 12, answer: 'A', decision: 'regular_stage_worker must do real download/index/GPS/geocode/queue work for v1.0.' },
  { id: 13, answer: 'C', decision: 'iCloudPD is the first real production media source target.' },
  { id: 14, answer: 'A', decision: 'dashboard runtime/status view is required.' },
  { id: 15, answer: 'B', decision: 'single proof ZIP command is useful, but separate proof commands may be acceptable.' },
  { id: 16, answer: 'C', decision: 'automated JSON proof and operator observation may both count where appropriate.' },
  { id: 17, answer: 'A', decision: 'core target proofs should pass for v1.0; known non-v1.0 gaps must be explicit.' },
  { id: 18, answer: 'C', decision: 'Windows proof is preserved where possible, but Raspberry is the primary v1.0 target.' },
  { id: 19, answer: 'A', decision: 'documentation should be cleaned/reconciled before calling v1.0.' },
  { id: 20, answer: 'A', decision: 'highest priority is proving the full Raspberry cron workflow end-to-end.' },
]);

export const RASPBERRY_V1_RELEASE_GATES = Object.freeze([
  {
    id: 'raspberry_target_readiness',
    title: 'Raspberry target tooling and generated fixtures',
    requiredForV1: true,
    proofKinds: ['raspberry_tool_checker', 'raspberry_generated_fixture_validation'],
    passPolicy: 'all_passed',
  },
  {
    id: 'install_runtime_preflight',
    title: 'Install/runtime preflight: executable bits and .env',
    requiredForV1: true,
    proofKinds: ['raspberry_executable_permissions', 'raspberry_env_preflight'],
    passPolicy: 'all_passed',
  },
  {
    id: 'real_icloud_media_source',
    title: 'Real iCloud/iCloudPD media source',
    requiredForV1: true,
    proofKinds: ['real_icloudpd_pipeline', 'real_download_continuation'],
    passPolicy: 'all_passed',
  },
  {
    id: 'real_gps_geocode',
    title: 'Real GPS/geocode provider chain',
    requiredForV1: true,
    proofKinds: ['real_geocode_provider_chain'],
    passPolicy: 'all_passed',
  },
  {
    id: 'regular_worker_product_pipeline',
    title: 'regular_stage_worker real download/index/GPS/geocode/queue work',
    requiredForV1: true,
    proofKinds: ['raspberry_regular_stage_worker_product_pipeline'],
    passPolicy: 'all_passed',
    plannedProof: true,
  },
  {
    id: 'playback_native_display',
    title: 'Playback worker plus native image/video playback',
    requiredForV1: true,
    proofKinds: ['raspberry_native_image_playback', 'raspberry_native_video_playback'],
    passPolicy: 'all_passed',
  },
  {
    id: 'address_overlay_device_display',
    title: 'Address overlay on Raspberry/device display',
    requiredForV1: true,
    proofKinds: ['raspberry_address_overlay_device_display'],
    passPolicy: 'all_passed',
    plannedProof: true,
  },
  {
    id: 'cron_app_running',
    title: 'Full cron workflow app-running status',
    requiredForV1: true,
    proofKinds: ['raspberry_worker_startup_smoke', 'raspberry_cron_preflight', 'raspberry_worker_evidence_generator', 'raspberry_cron_worker_runtime', 'raspberry_app_running_status', 'raspberry_app_running_chain', 'raspberry_app_running_pass_harness'],
    passPolicy: 'all_passed',
  },
  {
    id: 'dashboard_status_view',
    title: 'Dashboard runtime/status view backed by proof data',
    requiredForV1: true,
    proofKinds: ['raspberry_dashboard_status_view'],
    passPolicy: 'all_passed',
    plannedProof: true,
  },
  {
    id: 'screen_worker_non_blocking',
    title: 'screen_on_off_worker does not block v1.0 runtime',
    requiredForV1: true,
    proofKinds: ['raspberry_screen_worker_non_blocking'],
    passPolicy: 'all_passed',
    plannedProof: true,
  },
  {
    id: 'docs_reconciled',
    title: 'v1.0 documentation/OpenSpec reconciliation',
    requiredForV1: true,
    proofKinds: ['raspberry_v1_docs_reconciliation'],
    passPolicy: 'all_passed',
    plannedProof: true,
  },
  {
    id: 'manual_reboot_recovery',
    title: 'Manual reboot recovery',
    requiredForV1: false,
    proofKinds: ['raspberry_reboot_recovery'],
    passPolicy: 'non_blocking',
  },
  {
    id: 'physical_power_loss_recovery',
    title: 'Physical power-loss recovery',
    requiredForV1: false,
    proofKinds: ['raspberry_power_loss_recovery_v2', 'raspberry_power_loss_recovery'],
    passPolicy: 'non_blocking',
  },
]);

/** Collects the newest readable artifact for each exact proof kind. */
export async function collectLatestProofArtifacts({ repoRoot = process.cwd() } = {}) {
  const proofDir = join(repoRoot, 'runtime_data', 'proofs');
  if (!existsSync(proofDir)) return { proofDir, latestByKind: {}, filesRead: 0, readErrors: [] };
  const latestByKind = {};
  const readErrors = [];
  let filesRead = 0;
  for (const fileName of await readdir(proofDir)) {
    if (!fileName.endsWith('.json')) continue;
    try {
      const filePath = join(proofDir, fileName);
      const parsed = JSON.parse(await readFile(filePath, 'utf8'));
      filesRead += 1;
      const kind = parsed.proof_kind;
      const timestamp = parsed.proof_timestamp ?? '';
      if (!kind) continue;
      const existing = latestByKind[kind];
      if (!existing || String(timestamp) > String(existing.proof_timestamp ?? '')) {
        latestByKind[kind] = {
          proof_kind: kind,
          proof_status: parsed.proof_status ?? 'UNKNOWN',
          proof_timestamp: timestamp,
          runtime_mode: parsed.runtime_mode ?? null,
          baseline_version: parsed.baseline_version ?? null,
          git_commit: parsed.git_commit ?? null,
          source_file: fileName,
        };
      }
    } catch (error) {
      readErrors.push({ fileName, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { proofDir, latestByKind, filesRead, readErrors };
}

/** Treats full and short Git hashes as the same identity when one prefixes the other. */
function gitCommitMatches(expectedCommit, actualCommit) {
  if (!expectedCommit || !actualCommit) return false;
  const expected = String(expectedCommit).trim().toLowerCase();
  const actual = String(actualCommit).trim().toLowerCase();
  return expected.startsWith(actual) || actual.startsWith(expected);
}

/** Returns missing and mismatched identity fields for one selected proof artifact. */
function compareProofIdentity(artifact, expectedBaselineVersion, expectedGitCommit) {
  const mismatchFields = [];
  const missingFields = [];
  if (!artifact.baseline_version) missingFields.push('baseline_version');
  else if (expectedBaselineVersion && artifact.baseline_version !== expectedBaselineVersion) mismatchFields.push('baseline_version');
  if (!artifact.git_commit) missingFields.push('git_commit');
  else if (expectedGitCommit && !gitCommitMatches(expectedGitCommit, artifact.git_commit)) mismatchFields.push('git_commit');
  return { mismatchFields, missingFields };
}

/** Reports selected proof artifacts whose baseline version or commit differs from the live repository. */
export function buildProofIdentityReport({ latestByKind = {}, expectedBaselineVersion = null, expectedGitCommit = null } = {}) {
  const mappedProofKinds = [...new Set(RASPBERRY_V1_RELEASE_GATES.flatMap((gate) => gate.proofKinds))].sort();
  const selectedArtifacts = mappedProofKinds.map((proofKind) => latestByKind[proofKind]).filter(Boolean);
  const mismatches = [];
  const missingIdentity = [];

  for (const artifact of selectedArtifacts) {
    const { mismatchFields, missingFields } = compareProofIdentity(artifact, expectedBaselineVersion, expectedGitCommit);

    const gateIds = RASPBERRY_V1_RELEASE_GATES
      .filter((gate) => gate.proofKinds.includes(artifact.proof_kind))
      .map((gate) => gate.id);
    const identityEvidence = {
      proof_kind: artifact.proof_kind,
      proof_status: artifact.proof_status,
      source_file: artifact.source_file,
      gate_ids: gateIds,
      expected_baseline_version: expectedBaselineVersion,
      actual_baseline_version: artifact.baseline_version,
      expected_git_commit: expectedGitCommit,
      actual_git_commit: artifact.git_commit,
    };
    if (mismatchFields.length > 0) mismatches.push({ ...identityEvidence, mismatch_fields: mismatchFields });
    if (missingFields.length > 0) missingIdentity.push({ ...identityEvidence, missing_fields: missingFields });
  }

  return {
    policy: 'report_only',
    gate_status_impact: 'none',
    identity_scope: 'selected_mapped_artifacts',
    expected_baseline_version: expectedBaselineVersion,
    expected_git_commit: expectedGitCommit,
    selected_artifact_count: selectedArtifacts.length,
    mismatch_count: mismatches.length,
    missing_identity_count: missingIdentity.length,
    identity_matches_current_baseline: selectedArtifacts.length > 0 && mismatches.length === 0 && missingIdentity.length === 0,
    mismatches,
    missing_identity: missingIdentity,
  };
}

/** Classifies required gates as current-baseline refreshed, passed-but-stale, or not passed. */
export function buildGateFormalRefreshReport({ readiness, expectedBaselineVersion = null, expectedGitCommit = null } = {}) {
  const requiredGates = readiness.gates.filter((gate) => gate.required_for_v1);
  const gates = requiredGates.map((gate) => {
    const identityIssues = gate.proofs.flatMap((proof) => {
      if (!proof.source_file) return [];
      const { mismatchFields, missingFields } = compareProofIdentity(proof, expectedBaselineVersion, expectedGitCommit);
      if (mismatchFields.length === 0 && missingFields.length === 0) return [];
      return [{
        proof_kind: proof.proof_kind,
        source_file: proof.source_file,
        mismatch_fields: mismatchFields,
        missing_fields: missingFields,
        actual_baseline_version: proof.baseline_version ?? null,
        actual_git_commit: proof.git_commit ?? null,
      }];
    });
    let formalRefreshStatus = 'NOT_PASSED';
    if (gate.gate_status === 'PASSED') {
      formalRefreshStatus = identityIssues.length === 0 ? 'FORMALLY_REFRESHED' : 'PASSED_NOT_FORMALLY_REFRESHED';
    }
    return {
      gate_id: gate.id,
      title: gate.title,
      gate_status: gate.gate_status,
      formal_refresh_status: formalRefreshStatus,
      expected_baseline_version: expectedBaselineVersion,
      expected_git_commit: expectedGitCommit,
      identity_issues: identityIssues,
      refresh_commands: formalRefreshStatus === 'PASSED_NOT_FORMALLY_REFRESHED'
        ? identityIssues.map((issue) => ({
          proof_kind: issue.proof_kind,
          command: RASPBERRY_V1_PROOF_COMMANDS[issue.proof_kind] ?? 'no command mapped',
        }))
        : [],
    };
  });
  const formallyRefreshed = gates.filter((gate) => gate.formal_refresh_status === 'FORMALLY_REFRESHED');
  const passedNotRefreshed = gates.filter((gate) => gate.formal_refresh_status === 'PASSED_NOT_FORMALLY_REFRESHED');
  const notPassed = gates.filter((gate) => gate.formal_refresh_status === 'NOT_PASSED');
  return {
    policy: 'passed_and_current_version_commit_required',
    gate_status_impact: 'none',
    expected_baseline_version: expectedBaselineVersion,
    expected_git_commit: expectedGitCommit,
    required_gate_count: gates.length,
    formally_refreshed_count: formallyRefreshed.length,
    passed_not_formally_refreshed_count: passedNotRefreshed.length,
    not_passed_count: notPassed.length,
    release_baseline_formally_refreshed: gates.length > 0 && formallyRefreshed.length === gates.length,
    formally_refreshed_gate_ids: formallyRefreshed.map((gate) => gate.gate_id),
    passed_not_formally_refreshed_gate_ids: passedNotRefreshed.map((gate) => gate.gate_id),
    not_passed_gate_ids: notPassed.map((gate) => gate.gate_id),
    gates,
  };
}

/** Evaluates one release gate from its exact mapped proof artifacts. */
export function evaluateReleaseGate(gate, latestByKind = {}) {
  const proofs = gate.proofKinds.map((kind) => latestByKind[kind] ?? {
    proof_kind: kind,
    proof_status: gate.plannedProof ? 'PLANNED' : 'MISSING',
    proof_timestamp: null,
    runtime_mode: null,
    source_file: null,
  });
  const statuses = proofs.map((proof) => proof.proof_status);
  const allPassed = statuses.every((status) => status === 'PASSED');
  const missing = proofs.filter((proof) => ['MISSING', 'PLANNED'].includes(proof.proof_status)).map((proof) => proof.proof_kind);
  const blocked = proofs.filter((proof) => ['BLOCKED', 'FAILED', 'PARTIAL', 'TIMED_OUT', 'UNKNOWN', 'MISSING', 'PLANNED'].includes(proof.proof_status)).map((proof) => proof.proof_kind);

  let gateStatus = 'BLOCKED';
  if (gate.passPolicy === 'non_blocking') gateStatus = allPassed ? 'PASSED' : 'NON_BLOCKING';
  else if (allPassed) gateStatus = 'PASSED';

  return {
    id: gate.id,
    title: gate.title,
    required_for_v1: gate.requiredForV1,
    pass_policy: gate.passPolicy,
    gate_status: gateStatus,
    proofs,
    missing_or_planned_proofs: missing,
    blocking_proofs: gate.requiredForV1 ? blocked : [],
  };
}

/** Evaluates all Raspberry v1 gates without changing proof-artifact status semantics. */
export function evaluateRaspberryV1Readiness({ latestByKind = {} } = {}) {
  const gates = RASPBERRY_V1_RELEASE_GATES.map((gate) => evaluateReleaseGate(gate, latestByKind));
  const required = gates.filter((gate) => gate.required_for_v1);
  const passedRequired = required.filter((gate) => gate.gate_status === 'PASSED');
  const blockingRequired = required.filter((gate) => gate.gate_status !== 'PASSED');
  return {
    proofStatus: blockingRequired.length === 0 ? 'PASSED' : 'BLOCKED',
    gates,
    summary: {
      required_gate_count: required.length,
      required_passed_count: passedRequired.length,
      required_blocked_count: blockingRequired.length,
      non_blocking_gate_count: gates.length - required.length,
      completion_percent: required.length ? Math.round((passedRequired.length / required.length) * 100) : 0,
    },
    blocking_gate_ids: blockingRequired.map((gate) => gate.id),
  };
}


export const RASPBERRY_V1_PROOF_COMMANDS = Object.freeze({
  raspberry_tool_checker: 'npm run proof:raspberry-tool-checker',
  raspberry_generated_fixture_validation: 'npm run proof:raspberry-generated-fixtures',
  raspberry_executable_permissions: 'npm run proof:raspberry-executable-permissions -- --repair',
  raspberry_env_preflight: 'npm run proof:raspberry-env-preflight -- --create',
  real_icloudpd_pipeline: 'npm run proof:real-icloudpd',
  real_download_continuation: 'npm run proof:real-download-continuation',
  real_geocode_provider_chain: 'npm run proof:real-geocode-provider-chain',
  raspberry_regular_stage_worker_product_pipeline: 'npm run proof:raspberry-regular-stage-worker-product-pipeline',
  raspberry_native_image_playback: 'npm run proof:raspberry-native-image-playback',
  raspberry_native_video_playback: 'npm run proof:raspberry-native-video-playback',
  raspberry_address_overlay_device_display: 'npm run proof:raspberry-address-overlay-device-display',
  raspberry_worker_startup_smoke: 'npm run proof:raspberry-worker-startup-smoke -- --prepare',
  raspberry_cron_preflight: 'npm run proof:raspberry-cron-preflight',
  raspberry_worker_evidence_generator: 'npm run proof:raspberry-worker-evidence',
  raspberry_cron_worker_runtime: 'npm run proof:raspberry-cron-worker-runtime',
  raspberry_app_running_status: 'npm run proof:raspberry-app-running-status',
  raspberry_app_running_chain: 'npm run proof:raspberry-app-running-chain',
  raspberry_app_running_pass_harness: 'npm run proof:raspberry-app-running-pass',
  raspberry_dashboard_status_view: 'npm run proof:raspberry-dashboard-status-view',
  raspberry_screen_worker_non_blocking: 'npm run proof:raspberry-screen-worker-non-blocking',
  raspberry_v1_docs_reconciliation: 'npm run proof:raspberry-v1-docs-reconciliation',
});

export function buildReadinessGapReport(readiness) {
  return readiness.gates.filter((gate) => gate.required_for_v1 && gate.gate_status !== 'PASSED').map((gate) => ({
    gate_id: gate.id,
    title: gate.title,
    gate_status: gate.gate_status,
    blocking_proofs: gate.blocking_proofs,
    next_commands: gate.blocking_proofs.map((proofKind) => ({ proof_kind: proofKind, command: RASPBERRY_V1_PROOF_COMMANDS[proofKind] ?? 'no command mapped' })),
  }));
}

/** Builds the readiness proof envelope and explicit artifact identity diagnostics. */
export async function buildRaspberryV1ReadinessProof({ metadata, repoRoot = process.cwd() } = {}) {
  const artifactIndex = await collectLatestProofArtifacts({ repoRoot });
  const readiness = evaluateRaspberryV1Readiness({ latestByKind: artifactIndex.latestByKind });
  const proofIdentityReport = buildProofIdentityReport({
    latestByKind: artifactIndex.latestByKind,
    expectedBaselineVersion: metadata.version,
    expectedGitCommit: metadata.gitCommit,
  });
  const gateFormalRefreshReport = buildGateFormalRefreshReport({
    readiness,
    expectedBaselineVersion: metadata.version,
    expectedGitCommit: metadata.gitCommit,
  });
  return createProofEnvelope({
    proofKind: 'raspberry_v1_readiness',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: readiness.proofStatus,
    runtimeMode: 'raspberry_v1_release_gate_readiness',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      repo_root: repoRoot,
      answered_question_matrix: RASPBERRY_V1_MATRIX_DECISIONS,
      release_gates: readiness.gates,
      summary: readiness.summary,
      blocking_gate_ids: readiness.blocking_gate_ids,
      readiness_gap_report: buildReadinessGapReport(readiness),
      proof_identity_report: proofIdentityReport,
      gate_formal_refresh_report: gateFormalRefreshReport,
      latest_proof_artifact_index: {
        proof_dir: artifactIndex.proofDir,
        files_read: artifactIndex.filesRead,
        read_errors: artifactIndex.readErrors,
        available_proof_kinds: Object.keys(artifactIndex.latestByKind).sort(),
      },
      non_v1_blockers: ['manual reboot recovery', 'physical power-loss recovery', 'Windows release target'],
      next_steps: readiness.proofStatus === 'PASSED'
        ? ['Package v1.0 release candidate evidence.']
        : buildReadinessGapReport(readiness).flatMap((gap) => gap.next_commands.map((entry) => entry.command)),
      non_claims: [
        'does not run missing proof commands by itself',
        'does not prove real iCloud/GPS/geocode without corresponding proof artifacts',
        'reports baseline/commit identity mismatches but does not change gate status from identity alone',
        'does not call a passed gate formally refreshed unless every mapped proof matches the current version and commit',
        'does not claim reboot or power-loss recovery for v1.0',
        'does not treat Windows proof as Raspberry v1.0 proof',
      ],
    }),
    knownLimitations: readiness.proofStatus === 'PASSED'
      ? ['All current v1.0-required gates have latest PASSED proof artifacts.']
      : ['Readiness is blocked until each required v1.0 gate has latest PASSED target evidence.'],
  });
}

/** Describes the exact live proof data required before readiness can pass. */
export function buildV1ReadinessLiveDataRequirements() {
  const requiredGates = RASPBERRY_V1_RELEASE_GATES.filter((gate) => gate.requiredForV1);
  const requiredProofKinds = [...new Set(requiredGates.flatMap((gate) => gate.proofKinds))].sort();
  return {
    live_data_status: 'NOT_ENOUGH_LIVE_PROOF_DATA',
    required_gate_count: requiredGates.length,
    required_proof_kinds: requiredProofKinds,
    proof_artifact_directory: 'runtime_data/proofs',
    proof_status_policy: 'Each required proof kind needs a latest PASSED artifact before v1 readiness may pass.',
    local_prepass_policy: 'Local/docs/mock pre-pass proofs may unblock implementation, but they do not replace Raspberry target proof artifacts.',
  };
}
