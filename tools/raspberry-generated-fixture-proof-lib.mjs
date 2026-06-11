/**
 * Raspberry generated fixture proof library.
 *
 * Validates the committed generated_test_data fixture set on a Raspberry-like
 * target using the existing verifier. Missing target/tool prerequisites are
 * BLOCKED; verifier content failures on target are FAILED.
 */
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { checkTool, detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

export const RASPBERRY_GENERATED_FIXTURE_REQUIRED_TOOLS = Object.freeze([
  { name: 'python3', args: ['--version'], purpose: 'run generated fixture validator on Raspberry OS' },
  { name: 'ffprobe', args: ['-version'], purpose: 'inspect generated video fixture streams and metadata' },
]);

export function determineRaspberryGeneratedFixtureProofStatus({ target, requiredTools, validatorResult }) {
  const missingTools = requiredTools.filter((tool) => !tool.available).map((tool) => tool.name);
  const blockReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (missingTools.length > 0) blockReasons.push(`missing or unavailable tools: ${missingTools.join(', ')}`);

  if (blockReasons.length > 0) {
    return { proofStatus: 'BLOCKED', missingTools, blockReasons };
  }

  if (!validatorResult) {
    return { proofStatus: 'FAILED', missingTools, blockReasons: ['validator result was not produced'] };
  }

  if (validatorResult.exitCode === 0 && !validatorResult.timedOut) {
    return { proofStatus: 'PASSED', missingTools, blockReasons };
  }

  return {
    proofStatus: 'FAILED',
    missingTools,
    blockReasons: validatorResult.timedOut
      ? ['generated fixture validator timed out']
      : ['generated fixture validator returned non-zero on Raspberry target'],
  };
}

export async function buildRaspberryGeneratedFixtureProof({ metadata, env = process.env, runValidator = runGeneratedFixtureValidator } = {}) {
  const target = detectRaspberryTarget({ env });
  const requiredTools = [];
  for (const tool of RASPBERRY_GENERATED_FIXTURE_REQUIRED_TOOLS) requiredTools.push(await checkTool(tool));

  const canRunValidator = target.raspberry_like && requiredTools.every((tool) => tool.available);
  const validatorResult = canRunValidator ? await runValidator() : null;
  const { proofStatus, missingTools, blockReasons } = determineRaspberryGeneratedFixtureProofStatus({ target, requiredTools, validatorResult });

  return createProofEnvelope({
    proofKind: 'raspberry_generated_fixture_validation',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'raspberry_generated_fixture_preflight',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      required_tools: RASPBERRY_GENERATED_FIXTURE_REQUIRED_TOOLS.map(({ name, purpose }) => ({ name, purpose })),
      tool_results: requiredTools,
      validator: validatorResult ? summarizeValidatorResult(validatorResult) : { executed: false, reason: 'target/tool prerequisites not satisfied' },
      missing_tools: missingTools,
      block_reasons: blockReasons,
      pass_criteria: 'PASSED only on a Raspberry-like target when python3 and ffprobe are available and tools/verify_generated_test_data.py returns exit 0.',
      non_claims: [
        'does not prove Raspberry native playback',
        'does not start mpv',
        'does not prove scheduler behavior',
        'does not prove reboot or power-loss recovery',
        'does not prove production iCloud continuation',
      ],
    }),
    knownLimitations: proofStatus === 'PASSED'
      ? ['This proves generated fixture validation on the target only; it does not prove native playback, display focus, scheduler behavior, or recovery.']
      : ['Run on the Raspberry target after ensuring python3 and ffprobe are available and the generated_test_data directory is present.'],
  });
}

export async function runGeneratedFixtureValidator() {
  return runCommand('python3', ['tools/verify_generated_test_data.py'], { timeoutMs: 120000, detached: false });
}

function summarizeValidatorResult(result) {
  return {
    executed: true,
    command: result.command,
    args: result.args,
    exit_code: result.exitCode,
    signal: result.signal,
    timed_out: result.timedOut,
    duration_ms: result.durationMs,
    stdout_excerpt: lastNonEmptyLines(result.stdout, 20),
    stderr_excerpt: lastNonEmptyLines(result.stderr, 20),
  };
}

function lastNonEmptyLines(text, count) {
  return String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(-count).join('\n');
}
