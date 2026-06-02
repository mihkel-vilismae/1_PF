/**
 * End-to-end local photo frame proof library for PF_login.
 * Reuses the existing Wave E success path and address-display contract tests.
 * Proves the deterministic local photo-frame pipeline without real providers.
 * Writes sanitized proof envelopes through shared proof artifact helpers.
 * Keeps iCloud, network geocode, and Raspberry claims out of this local proof.
 */
import { access, readFile } from 'node:fs/promises';
import { buildLocalTsxTestCommand, createProofEnvelope, getProofEnvironment, runCommand } from './proof-utils.mjs';

export const E2E_LOCAL_PHOTO_FRAME_TARGETED_TESTS = Object.freeze([
  'tests/waveE.step5.test.js',
  'tests/addressDisplayProof.test.js',
]);

const REQUIRED_FIXTURES = Object.freeze([
  'generated_test_data/manifest.json',
  'generated_test_data/gps_valid/gps_valid_01.jpg',
]);

const VERIFIED_PRODUCT_STORY = Object.freeze([
  'Wave E orchestrator copies mock/local source media into an isolated runtime directory',
  'downloaded media is indexed into canonical media and variant tables',
  'GPS processing marks GPS-found and no-GPS assets honestly',
  'geocode processing writes address text and address cache evidence for GPS assets',
  'queue preparation inserts playable/address-ready media into the slideshow queue',
  'playback selection commits the current display item and preserves current/last orchestration state',
  'address-display proof verifies the selected media/address reaches the display-facing contract',
]);

/** Builds the serialized test command used by the local photo-frame proof. */
export function buildE2eLocalPhotoFrameProofCommand() {
  return buildLocalTsxTestCommand([...E2E_LOCAL_PHOTO_FRAME_TARGETED_TESTS], [
    '--test-concurrency=1',
    '--test-name-pattern=Wave E orchestrator success run|address display proof passes with deterministic local sidecar input',
  ]);
}

/** Inspects deterministic fixtures required by the local proof without reading secrets. */
export async function inspectE2eLocalPhotoFrameFixtures() {
  const fixtures = [];
  for (const fixturePath of REQUIRED_FIXTURES) {
    try {
      await access(fixturePath);
      fixtures.push({ path: fixturePath, exists: true });
    } catch (error) {
      fixtures.push({
        path: fixturePath,
        exists: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const manifestPath = 'generated_test_data/manifest.json';
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    return {
      ready: fixtures.every((fixture) => fixture.exists),
      fixtures,
      manifest: {
        path: manifestPath,
        groupNames: Object.keys(manifest.groups ?? manifest ?? {}).slice(0, 20),
      },
    };
  } catch (error) {
    return {
      ready: false,
      fixtures,
      manifest: {
        path: manifestPath,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/** Converts command and fixture evidence into a proof envelope. */
export function buildE2eLocalPhotoFrameProofEnvelope({ metadata, fixtureReadiness, testCommand, testResult }) {
  const proofPassed = fixtureReadiness.ready === true && testResult.exitCode === 0;
  return createProofEnvelope({
    proofKind: 'e2e_local_photo_frame',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: proofPassed ? 'PASSED' : (testResult.timedOut ? 'TIMED_OUT' : 'FAILED'),
    runtimeMode: 'deterministic_local',
    evidence: {
      environment: getProofEnvironment(),
      fixture_readiness: fixtureReadiness,
      targeted_tests: E2E_LOCAL_PHOTO_FRAME_TARGETED_TESTS,
      command: testCommand,
      command_result: testResult,
      verified_product_story: VERIFIED_PRODUCT_STORY,
    },
    knownLimitations: proofPassed
      ? [
          'This proof uses deterministic local/mock input and does not call real iCloudPD.',
          'This proof does not call network geocode providers or prove Raspberry hardware recovery.',
          'This proof verifies display-facing contract evidence, not a photographed physical screen.',
        ]
      : ['The deterministic local photo-frame proof did not complete successfully.'],
  });
}

/** Runs the deterministic local photo-frame proof and returns a sanitized envelope. */
export async function runE2eLocalPhotoFrameProof({ metadata, cwd = process.cwd() }) {
  const testCommand = buildE2eLocalPhotoFrameProofCommand();
  const fixtureReadiness = await inspectE2eLocalPhotoFrameFixtures();
  const testResult = await runCommand(testCommand.command, testCommand.args, {
    cwd,
    timeoutMs: 240000,
    forceKillGraceMs: 5000,
  });

  return buildE2eLocalPhotoFrameProofEnvelope({
    metadata,
    fixtureReadiness,
    testCommand,
    testResult,
  });
}
