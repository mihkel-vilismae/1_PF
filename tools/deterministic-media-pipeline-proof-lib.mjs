/**
 * Deterministic media pipeline proof library for PF_login.
 * Uses existing repository tests to prove local pipeline contracts without iCloud.
 * Covers GPS/geocode provider contracts and playback worker selection semantics.
 * Writes sanitized proof envelopes through the shared proof artifact helpers.
 * Keeps real-provider and hardware proof claims out of this local proof.
 */
import { access, readFile } from 'node:fs/promises';
import { buildLocalTsxTestCommand, createProofEnvelope, getProofEnvironment, runCommand } from './proof-utils.mjs';

const TARGETED_TESTS = Object.freeze([
  'tests/mediaPipelineProviderContracts.test.js',
  'tests/playbackWorker.test.js',
]);

/** Returns the deterministic test command used by this proof. */
export function buildDeterministicMediaPipelineProofCommand() {
  return buildLocalTsxTestCommand([...TARGETED_TESTS]);
}

/** Checks fixture manifest presence used by the local media pipeline test corpus. */
export async function inspectGeneratedFixtureManifest() {
  const manifestPath = 'generated_test_data/manifest.json';
  try {
    await access(manifestPath);
    const payload = JSON.parse(await readFile(manifestPath, 'utf8'));
    return {
      path: manifestPath,
      exists: true,
      groups: Object.keys(payload.groups ?? payload ?? {}).slice(0, 20),
    };
  } catch (error) {
    return {
      path: manifestPath,
      exists: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Runs the deterministic pipeline proof and returns a sanitized proof envelope. */
export async function runDeterministicMediaPipelineProof({ metadata, cwd = process.cwd() }) {
  const testCommand = buildDeterministicMediaPipelineProofCommand();
  const fixtureManifest = await inspectGeneratedFixtureManifest();
  const testResult = await runCommand(testCommand.command, testCommand.args, {
    cwd,
    timeoutMs: 180000,
    forceKillGraceMs: 5000,
  });

  const proofPassed = testResult.exitCode === 0 && fixtureManifest.exists === true;
  return createProofEnvelope({
    proofKind: 'deterministic_media_pipeline',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: proofPassed ? 'PASSED' : (testResult.timedOut ? 'TIMED_OUT' : 'FAILED'),
    runtimeMode: 'deterministic_local',
    evidence: {
      environment: getProofEnvironment(),
      fixture_manifest: fixtureManifest,
      targeted_tests: TARGETED_TESTS,
      command_result: testResult,
      verified_contracts: [
        'GPS provider fallback chain',
        'reverse geocode cache-first/provider fallback chain',
        'sqlite admin EXIF/placeholder wrappers',
        'playback selection service payload semantics',
        'playback_worker READY item selection and concurrency lock behavior',
      ],
    },
    knownLimitations: proofPassed
      ? [
          'This proof does not call real iCloudPD or network geocode providers.',
          'This proof does not prove native/fullscreen rendering or Raspberry hardware recovery.',
        ]
      : ['The deterministic local media pipeline contract proof did not complete successfully.'],
  });
}
