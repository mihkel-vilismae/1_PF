/** Durable runtime-state checkpoint contract for worker continuation and future recovery. */
export const CHECKPOINT_STAGES = Object.freeze(['download', 'index', 'gps_extract', 'geocode', 'queue', 'playback', 'display_overlay']);
export const DISABLED_RECOVERY_CLAIMS = Object.freeze(['power_loss_recovery', 'database_recovery', 'automatic_replay_after_crash']);

export function buildRuntimeStateCheckpoint({ stage = 'download', cursor = null, lastSuccessfulStage = null, queuePosition = null, dbIntegritySummary = { status: 'not_checked' } } = {}) {
  if (!CHECKPOINT_STAGES.includes(stage)) throw new Error(`Invalid checkpoint stage: ${stage}`);
  return {
    checkpoint_kind: 'runtime_state_durable_checkpoint',
    stage,
    cursor,
    last_successful_stage: lastSuccessfulStage,
    queue_position: queuePosition,
    db_integrity_summary: dbIntegritySummary,
    continuation: {
      can_continue_if_clean_boot: Boolean(cursor || lastSuccessfulStage || queuePosition !== null),
      recovery_enabled: false,
      disabled_recovery_claims: [...DISABLED_RECOVERY_CLAIMS],
    },
    secret_policy: { contains_credentials: false, contains_session_contents: false, contains_exact_private_address: false },
  };
}

export function validateRuntimeStateCheckpoint(checkpoint) {
  const checks = [
    { name: 'kind', passed: checkpoint?.checkpoint_kind === 'runtime_state_durable_checkpoint' },
    { name: 'valid_stage', passed: CHECKPOINT_STAGES.includes(checkpoint?.stage) },
    { name: 'recovery_disabled', passed: checkpoint?.continuation?.recovery_enabled === false },
    { name: 'secret_policy_clean', passed: checkpoint?.secret_policy?.contains_credentials === false && checkpoint?.secret_policy?.contains_session_contents === false },
    { name: 'disabled_claims_listed', passed: DISABLED_RECOVERY_CLAIMS.every((claim) => checkpoint?.continuation?.disabled_recovery_claims?.includes(claim)) },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}

export function buildCheckpointSchemaSummary() {
  return {
    required_fields: ['checkpoint_kind', 'stage', 'cursor', 'last_successful_stage', 'queue_position', 'db_integrity_summary', 'continuation', 'secret_policy'],
    supported_stages: [...CHECKPOINT_STAGES],
    recovery_status: 'disabled_by_contract_until_real_reboot_power_loss_proof',
  };
}
