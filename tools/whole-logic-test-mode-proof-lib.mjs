/*
 * Builds the deterministic Test Mode whole-logic controller proof artifact.
 * The proof exercises the service boundary directly and records semantic state
 * transitions without starting real cron, native playback, or OS processes.
 */
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  buildWholeLogicTestModeControlResult,
  buildWholeLogicTestModeStartResult,
} from '../server/testing_wholeLogicTestModeService.ts';
import { WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT } from '../shared/testModeWholeLogicContract.ts';
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';

// Runs the deterministic whole-logic Test Mode controller proof.
export async function runWholeLogicTestModeProof({ metadata }) {

  const tempRoot = await mkdtemp(path.join(tmpdir(), 'pf-whole-logic-proof-'));
  try {
    const controllerStateFilePath = path.join(tempRoot, 'scheduler', 'whole-logic-controller.json');
    const configFilePath = path.join(tempRoot, 'scheduler', 'whole-logic-config.json');
    const crontabFilePath = path.join(tempRoot, 'cron', 'crontab_emulated.txt');

    const start = await buildWholeLogicTestModeStartResult({
      runtimeMode: 'test',
      platform: 'win32',
      configFilePath,
      crontabFilePath,
      controllerStateFilePath,
      now: new Date('2026-06-02T02:00:00.000Z'),
    });
    const q = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath, key: 'q', now: new Date('2026-06-02T02:00:01.000Z') });
    const w = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath, key: 'w', now: new Date('2026-06-02T02:00:02.000Z') });
    const e = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath, key: 'e', now: new Date('2026-06-02T02:00:03.000Z') });
    const r = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath, key: 'r', now: new Date('2026-06-02T02:00:04.000Z') });
    const powerOff = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath, key: 't', now: new Date('2026-06-02T02:00:05.000Z') });
    const powerOn = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath, key: 't', now: new Date('2026-06-02T02:00:06.000Z') });
    const realBlocked = await buildWholeLogicTestModeControlResult({ runtimeMode: 'real', controllerStateFilePath, key: 'q', now: new Date('2026-06-02T02:00:07.000Z') });

    const crontabText = await readFile(crontabFilePath, 'utf8');
    const assertions = buildAssertions({ start, q, w, e, r, powerOff, powerOn, realBlocked, crontabText });
    const proofStatus = assertions.every((assertion) => assertion.passed) ? 'PASSED' : 'FAILED';

    return createProofEnvelope({
      proofKind: 'test_mode_whole_logic_emulator',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus,
      runtimeMode: 'test',
      evidence: {
        environment: getProofEnvironment(),
        stageLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
        start: summarizeStart(start),
        controls: {
          q: summarizeWorker(q, 'regularStage'),
          w: summarizeWorker(w, 'playback'),
          e: summarizeWorker(e, 'screenOnOff'),
          r: { cronjobsEnabled: r.controllerState.cronjobsEnabled, cronState: r.controllerState.cronState },
          powerOff: {
            powerState: powerOff.controllerState.powerState,
            cronjobsEnabled: powerOff.controllerState.cronjobsEnabled,
            databaseState: powerOff.controllerState.databaseState,
            playbackState: powerOff.controllerState.playbackState,
          },
          powerOn: {
            powerState: powerOn.controllerState.powerState,
            cronjobsEnabled: powerOn.controllerState.cronjobsEnabled,
            regularWorkerState: powerOn.controllerState.workers.regularStage.processState,
          },
        },
        blockedOutsideTestMode: realBlocked.status === 'blocked',
        crontabRows: crontabText.split('\n').filter((line) => line.trim() && !line.startsWith('#')),
        safetyBoundary: powerOff.controllerState.safeTerminationBoundary,
        assertions,
      },
      knownLimitations: [
        'This proof exercises the deterministic Test Mode controller state, not a real Raspberry crontab.',
        'This proof does not start real native fullscreen playback or kill arbitrary OS processes.',
        'The controller intentionally owns only records/processes spawned or tracked by this Test Mode flow.',
      ],
    });
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

// Builds semantic assertions for the proof artifact.
function buildAssertions({ start, q, w, e, r, powerOff, powerOn, realBlocked, crontabText }) {
  return [
    { name: 'start_configures_test_mode_only_controller', passed: start.status === 'ok' && start.loginRequired === false },
    { name: 'stage_limit_is_five', passed: start.workerStageItemLimit === WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT },
    { name: 'requested_cadences_are_recorded', passed: start.config.workers.regularStage.cadenceSeconds === 60 && start.config.workers.playback.cadenceSeconds === 30 && start.config.workers.screenOnOff.cadenceSeconds === 120 },
    { name: 'cron_rows_include_three_workers', passed: /regular_stage_worker\.ps1/.test(crontabText) && /playback_worker\.ps1/.test(crontabText) && /screen_on_off_worker\.ps1/.test(crontabText) },
    { name: 'q_terminates_regular_worker_only', passed: q.controllerState.workers.regularStage.processState === 'terminated' && q.controllerState.workers.playback.processState === 'running' },
    { name: 'w_terminates_playback_worker', passed: w.controllerState.workers.playback.processState === 'terminated' },
    { name: 'e_terminates_screen_worker', passed: e.controllerState.workers.screenOnOff.processState === 'terminated' },
    { name: 'r_stops_cronjobs_without_powering_off', passed: r.controllerState.cronjobsEnabled === false && r.controllerState.powerState === 'on' },
    { name: 't_poweroff_interrupts_app_state_and_stops_cronjobs', passed: powerOff.controllerState.powerState === 'off' && powerOff.controllerState.cronjobsEnabled === false && powerOff.controllerState.databaseState === 'abruptly_interrupted' },
    { name: 't_again_powers_on_and_reenables_cronjobs', passed: powerOn.controllerState.powerState === 'on' && powerOn.controllerState.cronjobsEnabled === true },
    { name: 'controls_blocked_outside_test_mode', passed: realBlocked.status === 'blocked' },
    { name: 'safety_boundary_preserves_dashboard_and_system_processes', passed: powerOff.controllerState.safeTerminationBoundary.includes('Do not kill the dashboard process.') && powerOff.controllerState.safeTerminationBoundary.includes('Do not kill arbitrary Node/Python/SQLite/system processes.') },
  ];
}

// Summarizes the start result without storing full noisy response state.
function summarizeStart(start) {
  return {
    status: start.status,
    schedulerTarget: start.schedulerTarget,
    workerStageItemLimit: start.workerStageItemLimit,
    controllerPowerState: start.controllerState.powerState,
    cronjobsEnabled: start.controllerState.cronjobsEnabled,
  };
}

// Summarizes one worker control outcome for proof readability.
function summarizeWorker(result, workerKey) {
  const worker = result.controllerState.workers[workerKey];
  return {
    key: result.key,
    workerId: worker.id,
    processState: worker.processState,
    lastSignal: worker.lastSignal,
    ownedByController: worker.ownedByController,
    osPid: worker.osPid,
  };
}
