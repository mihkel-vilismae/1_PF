/*
 * Contains one logical group of inspect-mode guide copy.
 * Values are split from the former monolithic guideCopy.json file.
 */
export const INSPECT_EYEBROWS = {
  "control": "Control guide",
  "value": "Value source",
  "reality": "Implementation truth",
  "backend": "Backend status",
  "fallback": "Guide"
} as const;

export const FALLBACK_INSPECT_DESCRIPTION = "Interactive control in the dashboard. Hover in explain-controls mode to identify what it does before you click it." as const;

export const ACTION_INSPECT_COPY = {
  "toggle-inspect-mode": {
    "label": "Explain controls mode",
    "description": "Highlights every interactive control and shows a tooltip that explains what it does when you hover or focus it."
  },
  "toggle-value-inspect-mode": {
    "label": "Explain values mode",
    "description": "Highlights live values and shows a tooltip that explains where each value comes from."
  },
  "toggle-reality-inspect-mode": {
    "label": "Show real vs mock mode",
    "description": "Highlights the current view by implementation truth so real wiring, mock behavior, and mixed areas are easy to spot."
  },
  "toggle-backend-status-inspect-mode": {
    "label": "Show backend status mode",
    "description": "Highlights whether a section is backed by a real backend, frontend-only mock behavior, or missing backend support."
  },
  "clear-history": {
    "label": "Clear event history",
    "description": "Removes the sidebar event history list and replaces it with a fresh \"History cleared\" entry."
  },
  "copy-history": {
    "label": "Copy event history",
    "description": "Copies the current sidebar event history state to the clipboard as formatted JSON."
  },
  "verify-env": {
    "label": "Verify .env",
    "description": "Calls the init endpoint that checks whether the required environment variables and config keys are present."
  },
  "check-db": {
    "label": "Check database status",
    "description": "Requests a database health/status summary without modifying the SQLite file."
  },
  "inspect-db": {
    "label": "Inspect database",
    "description": "Fetches a deeper inspection payload for the configured SQLite database so the operator can review its current state."
  },
  "delete-db": {
    "label": "Delete database",
    "description": "Deletes the configured SQLite database and related sidecar files after a confirmation prompt."
  },
  "recreate-db": {
    "label": "Recreate database",
    "description": "Deletes the current SQLite file if needed, recreates it, and bootstraps canonical schema tables from schema.sql after confirmation."
  },
  "select-scheduler-target-windows": {
    "label": "Select Windows scheduler target",
    "description": "Selects the Windows CronEmulator target and disables the Raspberry crontab controls."
  },
  "select-scheduler-target-raspberry": {
    "label": "Select Raspberry scheduler target",
    "description": "Selects the Raspberry real-crontab target and disables the Windows CronEmulator controls."
  },
  "install-cron": {
    "label": "Install scheduler",
    "description": "Installs or updates the platform scheduler target used by the repo-local scheduler host."
  },
  "check-cron": {
    "label": "Check scheduler",
    "description": "Reads scheduler status so the operator can verify whether the scheduled job is present and healthy."
  },
  "print-cron": {
    "label": "Print scheduler",
    "description": "Prints the scheduler/task definition details returned by the backend for inspection."
  },
  "verify-db-viewer": {
    "label": "Verify database",
    "description": "Checks whether the configured SQLite file exists and whether the documented required-table baseline is present."
  },
  "connect-db-viewer": {
    "label": "Connect to database",
    "description": "Calls the logical backend connect gate used by View E before catalog and row reads are enabled."
  },
  "show-db-tables": {
    "label": "Show tables",
    "description": "Loads the current list of non-system tables and views from the SQLite helper backend."
  },
  "start-db-logging": {
    "label": "Start DB logging",
    "description": "Starts a bounded backend logging session that captures repo-local DB actions observed by this app."
  },
  "stop-db-logging": {
    "label": "Stop DB logging",
    "description": "Stops the current bounded DB logging session and reveals the captured backend activity entries."
  },
  "run-b1": {
    "label": "Run login flow",
    "description": "Calls the backend auth preflight endpoints for status, run, reset, 2FA submit, and logout while rendering only the safe public auth projection."
  },
  "test-b1-login-download-one": {
    "label": "Test login download",
    "description": "Calls the backend auth test endpoint that uses icloudpd and .env credentials to download one recent item into runtime_data/tmp when authentication is already usable."
  },
  "run-b2": {
    "label": "Run download test action",
    "description": "Calls the backend download endpoint and reports the response in the B2 log."
  },
  "run-b3-auto": {
    "label": "Run all pipeline stages",
    "description": "Calls the backend orchestration endpoint for the B3 auto-run path while leaving individual stage buttons separate."
  },
  "run-b3-1": {
    "label": "Run download stage",
    "description": "Calls the backend download stage endpoint from the pipeline view."
  },
  "run-b3-2": {
    "label": "Run index stage",
    "description": "Calls the backend index stage endpoint from the pipeline view."
  },
  "run-b3-3": {
    "label": "Run GPS parsing",
    "description": "Simulates GPS extraction for indexed media in the staged pipeline."
  },
  "run-b3-4": {
    "label": "Run geocode stage",
    "description": "Calls the backend geocode stage. The geocoder here is a deterministic placeholder implementation that converts coordinates into a pseudo‑location string; this is not a real geocoding provider."
  },
  "run-b3-5": {
    "label": "Prepare playback queue",
    "description": "Calls the backend queue-prepare endpoint so playback selection can use real queue rows."
  },
  "detect-pipeline-issues": {
    "label": "Detect pipeline issues",
    "description": "Calls the backend pipeline diagnostic endpoint and currently reports stale persisted pipeline locks only."
  },
  "clear-stale-pipeline-locks": {
    "label": "Clear stale pipeline locks",
    "description": "Calls the backend stale-lock cleanup endpoint, which clears only stale persisted pipeline locks and leaves fresh active locks unchanged."
  },
  "run-b4": {
    "label": "Select current playback item",
    "description": "Calls the backend playback-selection endpoint and updates the operator preview with the selected item."
  },
  "resume-last-run": {
    "label": "Resume from saved state",
    "description": "Triggers the placeholder recovery action that stands in for a future resume-from-checkpoint flow."
  },
  "refresh-last-run": {
    "label": "Refresh last run",
    "description": "Calls the backend orchestration last-run endpoint and updates the read-only View C summary."
  },
  "start-real-run": {
    "label": "Start simulated runtime preview",
    "description": "Activates the D-view worker preview so the pipeline, playback, and screen monitor cards begin updating."
  }
} as const;

export const LAST_RUN_MODE_INSPECT_COPY = {
  "none": {
    "label": "Show no-run demo",
    "description": "Switches the recovery panel to the empty state where no saved run is available."
  },
  "error": {
    "label": "Show error demo",
    "description": "Switches the recovery panel to an error state that mimics a failed source-of-truth read."
  },
  "ready": {
    "label": "Show ready demo",
    "description": "Loads the seeded last-run demo so the recovery layout shows realistic saved-run data."
  }
} as const;

export const CURRENT_TRUTH_VALUE_SOURCES = {
  "Source of truth": "state.truth.sourceOfTruth, seeded from conf/runtime-truth.json and then kept in sync to that file during runtime truth updates.",
  "Queue length": "state.truth.queueLength, updated by queue-stage actions and demo-state seeding.",
  "Current media": "state.truth.currentMedia, populated when media is queued or demo state is loaded.",
  "Playback status": "state.truth.playbackStatus, updated by playback runs, screen simulation, and demo seeding.",
  "Screen state": "state.truth.screenState, updated by screen-simulation toggles and runtime preview state changes.",
  "Last activity": "state.truth.lastActivitySource, derived from the currently enabled simulated activity inputs.",
  "Timeout": "state.truth.inactivityTimeoutSeconds, updated from the B5 inactivity timeout input.",
  "Last checkpoint": "state.truth.lastCheckpoint, updated by playback and screen checkpoint events.",
  "Last stage": "state.truth.lastStageCompleted, updated when pipeline stages complete.",
  "Stage lock": "state.truth.stageLock, updated when pipeline lock ownership changes.",
  "Playback lock": "state.truth.playbackLock, updated when playback emulation or runtime preview acquires the worker lock.",
  "Screen lock": "state.truth.screenLock, updated when the simulated runtime preview acquires the screen worker lock."
} as const;

export const INSPECT_COPY = {
  "logEntry": {
    "label": "Open log entry details",
    "description": "Opens the selected log entry so you can inspect its timestamps, action metadata, and any captured request/response payloads."
  },
  "historyEntry": {
    "label": "Open history event details",
    "description": "Opens the selected history item so you can inspect its timeline and any captured context fields."
  },
  "inactivityTimeout": {
    "label": "Set inactivity timeout",
    "description": "Changes how many seconds of inactivity B5 waits before the screen simulation flips to OFF and updates the checkpoint state."
  },
  "dbTableDescription": "Loads the selected table from the live database viewer backend and shows its bounded rows in E3.",
  "dbPageDescriptions": {
    "previous": "Requests another backend-owned page of rows for the currently selected database object.",
    "next": "Requests another backend-owned page of rows for the currently selected database object."
  },
  "simulationControls": {
    "execution-mode": {
      "auto": {
        "label": "Execution mode: auto pipeline",
        "description": "B3 runs the full pipeline sequence automatically when you trigger the main auto-run control."
      },
      "manual": {
        "label": "Execution mode: manual pipeline",
        "description": "B3 is configured for one-stage-at-a-time operation so each stage can be triggered individually."
      }
    },
    "input-mode": {
      "single": {
        "label": "Mock input mode: one file at a time",
        "description": "Runs the mock download flow in a single-file mode so stage outputs are easier to inspect step by step."
      },
      "all": {
        "label": "Mock input mode: all files",
        "description": "Represents a future all-files mode. It stays disabled in the current prototype."
      }
    },
    "pirEnabled": {
      "label": "Toggle PIR sensor activity",
      "description": "Controls whether the motion-sensor activity source counts as active in the backend-owned B5 screen simulation."
    },
    "mouseEnabled": {
      "label": "Toggle mouse activity",
      "description": "Controls whether mouse movement counts as an activity source that keeps the backend-owned simulated screen awake."
    },
    "keyboardEnabled": {
      "label": "Toggle keyboard activity",
      "description": "Controls whether keyboard activity counts as a wake/keep-awake signal in the backend-owned B5 simulation."
    },
    "simulateAllEnabled": {
      "label": "Toggle all activity sources",
      "description": "Turns the major simulated activity sources on or off together so the screen state can be tested quickly."
    }
  }
} as const;
