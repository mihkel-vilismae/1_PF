/** Raspberry iCloudPD discovery/preflight proof scaffold. */
import process from 'node:process';
import { existsSync } from 'node:fs';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

export const ICLOUDPD_PREFLIGHT_REQUIRED_ENV_KEYS = Object.freeze(['user', 'pw', 'ICLOUDPD_COOKIE_DIR']);
export const ICLOUDPD_COMMAND_CANDIDATES = Object.freeze([
  { command: 'icloudpd', args: ['--version'] },
  { command: 'python3', args: ['-m', 'icloudpd', '--version'] },
  { command: 'python', args: ['-m', 'icloudpd', '--version'] },
]);

export function summarizeConfigPresence(env = process.env) {
  return ICLOUDPD_PREFLIGHT_REQUIRED_ENV_KEYS.map((key) => ({
    key,
    present: typeof env[key] === 'string' && env[key].trim().length > 0,
    kind: key === 'pw' ? 'secret' : key === 'user' ? 'account_identifier' : 'path',
  }));
}

export async function runIcloudpdVersionCandidates({ commandRunner = runCommand, cwd = process.cwd() } = {}) {
  const attempts = [];
  for (const candidate of ICLOUDPD_COMMAND_CANDIDATES) {
    const result = await commandRunner(candidate.command, candidate.args, { cwd, timeoutMs: 15000, detached: false });
    attempts.push({
      command: candidate.command,
      args: candidate.args,
      exit_code: result.exitCode,
      timed_out: result.timedOut,
      stdout_tail: String(result.stdout ?? '').slice(-500),
      stderr_tail: String(result.stderr ?? '').slice(-500),
      usable: result.exitCode === 0 && !result.timedOut,
    });
    if (result.exitCode === 0 && !result.timedOut) break;
  }
  return attempts;
}

export function evaluateIcloudpdPreflight({ target, config, attempts }) {
  const blockReasons = [];
  const failedReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (target.explicit_override_used) blockReasons.push('Raspberry target detection used explicit override; override runs cannot produce PASS');
  const missingConfig = config.filter((entry) => !entry.present).map((entry) => entry.key);
  if (missingConfig.length) blockReasons.push(`missing required iCloudPD config keys: ${missingConfig.join(', ')}`);
  const usableAttempt = attempts.find((attempt) => attempt.usable);
  if (!usableAttempt) blockReasons.push('no usable icloudpd command/version check was observed');
  const timedOut = attempts.some((attempt) => attempt.timed_out);
  if (timedOut) failedReasons.push('at least one iCloudPD version command timed out');
  if (failedReasons.length) return { proofStatus: 'FAILED', blockReasons, failedReasons, missingConfig, usable_command: usableAttempt ?? null };
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, failedReasons, missingConfig, usable_command: usableAttempt ?? null };
  return { proofStatus: 'PASSED', blockReasons, failedReasons, missingConfig: [], usable_command: usableAttempt };
}

export async function buildRaspberryIcloudpdPreflightProof({ metadata, env = process.env, commandRunner = runCommand, cwd = process.cwd() } = {}) {
  const target = detectRaspberryTarget({ env });
  const config = summarizeConfigPresence(env);
  const attempts = await runIcloudpdVersionCandidates({ commandRunner, cwd });
  const evaluation = evaluateIcloudpdPreflight({ target, config, attempts });
  return createProofEnvelope({
    proofKind: 'raspberry_icloudpd_preflight',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: 'raspberry_icloudpd_discovery_preflight',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      config_presence: config,
      cookie_dir_exists: typeof env.ICLOUDPD_COOKIE_DIR === 'string' ? existsSync(env.ICLOUDPD_COOKIE_DIR) : false,
      version_attempts: attempts,
      evaluation,
      manual_2fa_allowed: true,
      pass_criteria: 'PASSED only on non-override Raspberry target with required config present and a usable icloudpd version command.',
      non_claims: ['does not perform iCloud login', 'does not automate 2FA', 'does not download media', 'does not prove real iCloud continuation'],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED' ? ['This proves local iCloudPD preflight only, not media download.'] : ['Inspect evaluation.blockReasons for setup still needed.'],
  });
}
