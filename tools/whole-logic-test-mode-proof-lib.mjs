/*
 * Builds the deterministic Test Mode whole-logic controller proof artifact.
 * The proof exercises the service boundary directly and records semantic state
 * transitions without starting real cron, native playback, or OS processes.
 */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildWholeLogicTestModeControlResult,
  buildWholeLogicTestModeStartResult,
} from "../server/testing_wholeLogicTestModeService.ts";
import { WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT } from "../shared/testModeWholeLogicContract.ts";
import { createProofEnvelope, getProofEnvironment } from "./proof-utils.mjs";

// Runs the deterministic whole-logic Test Mode controller proof.
export async function runWholeLogicTestModeProof({ metadata }) {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "pf-whole-logic-proof-"));
  try {
    const controllerStateFilePath = path.join(
      tempRoot,
      "scheduler",
      "whole-logic-controller.json",
    );
    const configFilePath = path.join(
      tempRoot,
      "scheduler",
      "whole-logic-config.json",
    );
    const crontabFilePath = path.join(tempRoot, "cron", "crontab_emulated.txt");
    const end2endLogFilePath = path.join(tempRoot, "logs", "end2end_test.log");

    const start = await buildWholeLogicTestModeStartResult({
      runtimeMode: "test",
      platform: "win32",
      configFilePath,
      crontabFilePath,
      controllerStateFilePath,
      end2endLogFilePath,
      now: new Date("2026-06-02T02:00:00.000Z"),
    });
    const duplicateStart = await buildWholeLogicTestModeStartResult({
      runtimeMode: "test",
      controllerStateFilePath,
      end2endLogFilePath,
      now: new Date("2026-06-02T02:00:00.500Z"),
    });
    const manualRegular = await buildWholeLogicTestModeControlResult({
      runtimeMode: "test",
      controllerStateFilePath,
      end2endLogFilePath,
      key: "1",
      now: new Date("2026-06-02T02:00:00.600Z"),
    });
    const manualPlayback = await buildWholeLogicTestModeControlResult({
      runtimeMode: "test",
      controllerStateFilePath,
      end2endLogFilePath,
      key: "2",
      now: new Date("2026-06-02T02:00:00.700Z"),
    });
    const manualScreen = await buildWholeLogicTestModeControlResult({
      runtimeMode: "test",
      controllerStateFilePath,
      end2endLogFilePath,
      key: "3",
      now: new Date("2026-06-02T02:00:00.800Z"),
    });
    const q = await buildWholeLogicTestModeControlResult({
      runtimeMode: "test",
      controllerStateFilePath,
      end2endLogFilePath,
      key: "q",
      now: new Date("2026-06-02T02:00:01.000Z"),
    });
    const w = await buildWholeLogicTestModeControlResult({
      runtimeMode: "test",
      controllerStateFilePath,
      end2endLogFilePath,
      key: "w",
      now: new Date("2026-06-02T02:00:02.000Z"),
    });
    const e = await buildWholeLogicTestModeControlResult({
      runtimeMode: "test",
      controllerStateFilePath,
      end2endLogFilePath,
      key: "e",
      now: new Date("2026-06-02T02:00:03.000Z"),
    });
    const r = await buildWholeLogicTestModeControlResult({
      runtimeMode: "test",
      controllerStateFilePath,
      end2endLogFilePath,
      key: "r",
      now: new Date("2026-06-02T02:00:04.000Z"),
    });
    const powerOff = await buildWholeLogicTestModeControlResult({
      runtimeMode: "test",
      controllerStateFilePath,
      end2endLogFilePath,
      key: "t",
      now: new Date("2026-06-02T02:00:05.000Z"),
    });
    const powerOn = await buildWholeLogicTestModeControlResult({
      runtimeMode: "test",
      controllerStateFilePath,
      end2endLogFilePath,
      key: "t",
      now: new Date("2026-06-02T02:00:06.000Z"),
    });
    const realBlocked = await buildWholeLogicTestModeControlResult({
      runtimeMode: "real",
      controllerStateFilePath,
      key: "q",
      now: new Date("2026-06-02T02:00:07.000Z"),
    });

    const crontabText = await readFile(crontabFilePath, "utf8");
    const end2endLogText = await readFile(end2endLogFilePath, "utf8");
    const assertions = buildAssertions({
      start,
      duplicateStart,
      manualRegular,
      manualPlayback,
      manualScreen,
      q,
      w,
      e,
      r,
      powerOff,
      powerOn,
      realBlocked,
      crontabText,
      end2endLogText,
    });
    const proofStatus = assertions.every((assertion) => assertion.passed)
      ? "PASSED"
      : "FAILED";

    return createProofEnvelope({
      proofKind: "test_mode_whole_logic_emulator",
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus,
      runtimeMode: "test",
      evidence: {
        environment: getProofEnvironment(),
        stageLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
        cadenceSeconds: {
          regularStage: start.config.workers.regularStage.cadenceSeconds,
          playback: start.config.workers.playback.cadenceSeconds,
          screenOnOff: start.config.workers.screenOnOff.cadenceSeconds,
        },
        initialStatusRows: start.config.statusRows.map((row) => ({
          id: row.id,
          state: row.state,
          calledCount: row.calledCount,
        })),
        startedStatusRows: start.controllerState.statusRows.map((row) => ({
          id: row.id,
          state: row.state,
          calledCount: row.calledCount,
        })),
        focusedLog: start.controllerState.focusedLog,
        end2endLog: {
          relativePath: "logs/end2end_test.log",
          lineCount: end2endLogText.trim().split("\n").filter(Boolean).length,
          containsStartClick: end2endLogText.includes(
            "Large TEST MODE FAST EMULATOR start button clicked",
          ),
        },
        start: summarizeStart(start),
        duplicateStart: {
          status: duplicateStart.status,
          duplicateStartBlocked: duplicateStart.duplicateStartBlocked === true,
        },
        manualCronButtons: {
          initialEnabled: start.config.manualCronButtons.every(
            (button) => button.enabled === false,
          ),
          startedEnabled: start.controllerState.manualCronButtons.every(
            (button) => button.enabled === true,
          ),
          regularCalledCount:
            manualRegular.controllerState.statusRows.find(
              (row) => row.id === "regular_worker_called",
            )?.calledCount ?? null,
          playbackCalledCount:
            manualPlayback.controllerState.statusRows.find(
              (row) => row.id === "playback_worker_called",
            )?.calledCount ?? null,
          screenCalledCount:
            manualScreen.controllerState.statusRows.find(
              (row) => row.id === "screen_on_off_worker_called",
            )?.calledCount ?? null,
        },
        controls: {
          q: summarizeWorker(q, "regularStage"),
          w: summarizeWorker(w, "playback"),
          e: summarizeWorker(e, "screenOnOff"),
          r: {
            cronjobsEnabled: r.controllerState.cronjobsEnabled,
            cronState: r.controllerState.cronState,
          },
          powerOff: {
            powerState: powerOff.controllerState.powerState,
            cronjobsEnabled: powerOff.controllerState.cronjobsEnabled,
            databaseState: powerOff.controllerState.databaseState,
            playbackState: powerOff.controllerState.playbackState,
          },
          powerOn: {
            powerState: powerOn.controllerState.powerState,
            cronjobsEnabled: powerOn.controllerState.cronjobsEnabled,
            regularWorkerState:
              powerOn.controllerState.workers.regularStage.processState,
          },
        },
        blockedOutsideTestMode: realBlocked.status === "blocked",
        crontabRows: crontabText
          .split("\n")
          .filter((line) => line.trim() && !line.startsWith("#")),
        safetyBoundary: powerOff.controllerState.safeTerminationBoundary,
        assertions,
      },
      knownLimitations: [
        "This proof exercises the deterministic Test Mode controller state, not a real Raspberry crontab.",
        "This proof does not start real native fullscreen playback or kill arbitrary OS processes.",
        "The controller intentionally owns only records/processes spawned or tracked by this Test Mode flow.",
      ],
    });
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

// Builds semantic assertions for the proof artifact.
function buildAssertions({
  start,
  duplicateStart,
  manualRegular,
  manualPlayback,
  manualScreen,
  q,
  w,
  e,
  r,
  powerOff,
  powerOn,
  realBlocked,
  crontabText,
  end2endLogText,
}) {
  return [
    {
      name: "start_configures_test_mode_only_controller",
      passed: start.status === "ok" && start.loginRequired === false,
    },
    {
      name: "stage_limit_is_five",
      passed: start.workerStageItemLimit === WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    },
    {
      name: "requested_cadences_are_recorded",
      passed:
        start.config.workers.regularStage.cadenceSeconds === 6 &&
        start.config.workers.playback.cadenceSeconds === 3 &&
        start.config.workers.screenOnOff.cadenceSeconds === 12,
    },
    {
      name: "cron_rows_include_three_workers",
      passed:
        /regular_stage_worker\.ps1/.test(crontabText) &&
        /playback_worker\.ps1/.test(crontabText) &&
        /screen_on_off_worker\.ps1/.test(crontabText),
    },
    {
      name: "large_button_disabled_after_start",
      passed:
        start.controllerState.startButton.disabled === true &&
        start.controllerState.runActive === true,
    },
    {
      name: "status_rows_mark_start_effects",
      passed:
        start.controllerState.statusRows.some(
          (row) =>
            row.id === "crontab_working" &&
            row.state === "passed" &&
            row.calledCount === 1,
        ) &&
        start.controllerState.statusRows.some(
          (row) =>
            row.id === "native_playback_started" && row.state === "pending",
        ),
    },
    {
      name: "duplicate_start_blocked",
      passed:
        duplicateStart.status === "blocked" &&
        duplicateStart.duplicateStartBlocked === true,
    },
    {
      name: "manual_cron_buttons_disabled_before_start_and_enabled_after_start",
      passed:
        start.config.manualCronButtons.every(
          (button) => button.disabled === true,
        ) &&
        start.controllerState.manualCronButtons.every(
          (button) => button.enabled === true,
        ),
    },
    {
      name: "manual_cron_buttons_record_worker_calls",
      passed:
        manualRegular.controllerState.statusRows.some(
          (row) => row.id === "regular_worker_called" && row.calledCount === 2,
        ) &&
        manualPlayback.controllerState.statusRows.some(
          (row) => row.id === "playback_worker_called" && row.calledCount === 2,
        ) &&
        manualScreen.controllerState.statusRows.some(
          (row) =>
            row.id === "screen_on_off_worker_called" && row.calledCount === 2,
        ),
    },
    {
      name: "end2end_log_written_and_filtered",
      passed:
        /Large TEST MODE FAST EMULATOR start button clicked/.test(
          end2endLogText,
        ) &&
        /Manual button 1 called regular worker cronjob boundary/.test(
          end2endLogText,
        ) &&
        !/(password=|token=|secret=|cookie=)/i.test(end2endLogText),
    },
    {
      name: "q_terminates_regular_worker_only",
      passed:
        q.controllerState.workers.regularStage.processState === "terminated" &&
        q.controllerState.workers.playback.processState === "running",
    },
    {
      name: "w_terminates_playback_worker",
      passed: w.controllerState.workers.playback.processState === "terminated",
    },
    {
      name: "e_terminates_screen_worker",
      passed:
        e.controllerState.workers.screenOnOff.processState === "terminated",
    },
    {
      name: "r_stops_cronjobs_without_powering_off",
      passed:
        r.controllerState.cronjobsEnabled === false &&
        r.controllerState.powerState === "on",
    },
    {
      name: "t_poweroff_interrupts_app_state_and_stops_cronjobs",
      passed:
        powerOff.controllerState.powerState === "off" &&
        powerOff.controllerState.cronjobsEnabled === false &&
        powerOff.controllerState.databaseState === "abruptly_interrupted",
    },
    {
      name: "t_again_powers_on_and_reenables_cronjobs",
      passed:
        powerOn.controllerState.powerState === "on" &&
        powerOn.controllerState.cronjobsEnabled === true,
    },
    {
      name: "controls_blocked_outside_test_mode",
      passed: realBlocked.status === "blocked",
    },
    {
      name: "safety_boundary_preserves_dashboard_and_system_processes",
      passed:
        powerOff.controllerState.safeTerminationBoundary.includes(
          "Do not kill the dashboard process.",
        ) &&
        powerOff.controllerState.safeTerminationBoundary.includes(
          "Do not kill arbitrary Node/Python/SQLite/system processes.",
        ),
    },
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
    startButtonDisabled: start.controllerState.startButton.disabled,
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
