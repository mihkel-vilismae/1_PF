/** Safe real iCloud listing preflight; no download by default. */
import { validateIcloudpdSessionPathConfig } from './icloudpd-session-path-validator-lib.mjs';

const ENABLE_FLAG = 'PF_PROOF_ENABLE_REAL_ICLOUD_LISTING_PREFLIGHT';
const ALLOW_DOWNLOAD_FLAG = 'PF_REAL_ICLOUD_LISTING_ALLOW_DOWNLOAD';

export function buildIcloudListingCommandPlan(env = process.env) {
  return {
    command_family: 'icloudpd',
    operation: 'list_or_dry_run_metadata_only',
    download_allowed: env[ALLOW_DOWNLOAD_FLAG] === '1' || env[ALLOW_DOWNLOAD_FLAG] === 'true',
    expected_output: ['media item count', 'provider exit code', 'redacted/sanitized stderr tail'],
    forbidden_output: ['Apple ID', 'password', '2FA code', 'cookie contents', 'session file contents', 'full private filenames by default'],
  };
}

export function runRealIcloudListingPreflight({ env = process.env, repoRoot = process.cwd(), envText = null } = {}) {
  const validator = validateIcloudpdSessionPathConfig({ repoRoot, envText });
  const enabled = env[ENABLE_FLAG] === '1' || env[ENABLE_FLAG] === 'true';
  const commandPlan = buildIcloudListingCommandPlan(env);
  const blockers = [];
  if (!enabled) blockers.push(`Set ${ENABLE_FLAG}=true to run real iCloud listing preflight.`);
  if (validator.proof_status !== 'PASSED') blockers.push('iCloudPD session path validator is not PASSED.');
  if (commandPlan.download_allowed) blockers.push(`${ALLOW_DOWNLOAD_FLAG} must remain false for listing-only preflight.`);
  const proofStatus = blockers.length ? 'BLOCKED' : 'PASSED';
  return {
    proof_status: proofStatus,
    enable_flag: ENABLE_FLAG,
    allow_download_flag: ALLOW_DOWNLOAD_FLAG,
    session_validator_status: validator.proof_status,
    blockers,
    command_plan: commandPlan,
    safety: {
      downloads_performed: false,
      secrets_collected: false,
      provider_session_contents_collected: false,
      listing_is_preflight_only: true,
    },
    next_step_when_passed: 'Run a separately opt-in bounded real provider listing command and store only sanitized counts/metadata.',
  };
}
