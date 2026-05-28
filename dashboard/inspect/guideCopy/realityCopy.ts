/*
 * Contains one logical group of inspect-mode guide copy.
 * Values are split from the former monolithic guideCopy.json file.
 */
export const ACTION_REALITY_COPY = {
  "toggle-inspect-mode": {
    "state": "real",
    "reason": "Implemented dashboard-shell guide button that explains interactive controls."
  },
  "toggle-value-inspect-mode": {
    "state": "real",
    "reason": "Implemented dashboard-shell guide button that explains where live values come from."
  },
  "toggle-reality-inspect-mode": {
    "state": "real",
    "reason": "Implemented dashboard-shell guide button that classifies UI elements by implementation truth."
  },
  "toggle-backend-status-inspect-mode": {
    "state": "real",
    "reason": "Implemented dashboard-shell guide button that classifies UI elements by backend wiring status."
  },
  "toggle-live-updates": {
    "state": "real",
    "reason": "Implemented dashboard-shell inspection helper that pauses background polling and transit-triggered renders without changing backend behavior."
  },
  "toggle-marked-for-removal": {
    "state": "real",
    "reason": "Implemented dashboard-shell visibility toggle for UI blocks explicitly marked for future removal."
  },
  "clear-history": {
    "state": "real",
    "reason": "Implemented local UI action that really clears the sidebar history list."
  },
  "copy-history": {
    "state": "real",
    "reason": "Implemented local UI action that copies the current sidebar history state to the clipboard."
  },
  "verify-env": {
    "state": "real",
    "reason": "Calls the live `/api/init/verify-env` backend endpoint."
  },
  "check-db": {
    "state": "real",
    "reason": "Calls the live `/api/init/database/status` backend endpoint."
  },
  "inspect-db": {
    "state": "real",
    "reason": "Calls the live `/api/init/database/inspect` backend endpoint."
  },
  "delete-db": {
    "state": "real",
    "reason": "Calls the live destructive backend path for deleting the configured SQLite database."
  },
  "recreate-db": {
    "state": "real",
    "reason": "Calls the live backend path that recreates the SQLite database file and applies canonical schema tables."
  },
  "select-scheduler-target-windows": {
    "state": "real",
    "reason": "Calls the live scheduler target-selection endpoint and updates the active 3A target."
  },
  "select-scheduler-target-raspberry": {
    "state": "real",
    "reason": "Calls the live scheduler target-selection endpoint and updates the active 3A target."
  },
  "install-cron": {
    "state": "real",
    "reason": "Calls the live scheduler-install backend endpoint."
  },
  "check-cron": {
    "state": "real",
    "reason": "Calls the live scheduler-status backend endpoint."
  },
  "print-cron": {
    "state": "real",
    "reason": "Calls the live scheduler-print backend endpoint."
  },
  "verify-db-viewer": {
    "state": "real",
    "reason": "Calls the live `/api/database-viewer/verify` backend endpoint."
  },
  "connect-db-viewer": {
    "state": "real",
    "reason": "Calls the live `/api/database-viewer/connect` backend endpoint for the logical connect gate."
  },
  "show-db-tables": {
    "state": "real",
    "reason": "Calls the live `/api/database-viewer/tables` backend endpoint."
  },
  "start-db-logging": {
    "state": "real",
    "reason": "Calls the live `/api/database-viewer/logging/start` backend endpoint."
  },
  "stop-db-logging": {
    "state": "real",
    "reason": "Calls the live `/api/database-viewer/logging/stop` backend endpoint."
  },
  "run-b1": {
    "state": "real",
    "reason": "Calls the backend /api/auth/* auth preflight endpoints through the dashboard auth action boundary."
  },
  "test-b1-login-download-one": {
    "state": "real",
    "reason": "Calls the live POST /api/auth/test-login-download-one endpoint and uses the backend auth provider boundary."
  },
  "run-b2": {
    "state": "real",
    "reason": "Runs the real backend download test action."
  },
  "run-b2-real-download": {
    "state": "real",
    "reason": "Calls the dedicated authenticated real iCloudPD download backend route and does not use the mock download fixture."
  },
  "run-b3-1": {
    "state": "real",
    "reason": "Runs the real backend download stage."
  },
  "run-b3-2": {
    "state": "real",
    "reason": "Runs the real backend index stage."
  },
  "run-b3-3": {
    "state": "real",
    "reason": "Runs the real backend GPS parsing stage."
  },
  "run-b3-4": {
    "state": "mock",
    "reason": "Calls the backend geocode stage, but the underlying geocoder is a deterministic placeholder rather than a real geocoding provider, so this action remains simulation‑only."
  },
  "run-b3-5": {
    "state": "real",
    "reason": "Runs the real backend queue-prepare stage."
  },
  "run-b3-auto": {
    "state": "real",
    "reason": "Calls the backend orchestration endpoint for B3 auto-run. Stage 1 remains mock/generated-data backed and geocode remains deterministic placeholder behavior."
  },
  "detect-pipeline-issues": {
    "state": "real",
    "reason": "Calls a backend diagnostic endpoint that inspects persisted runtime-truth pipeline lock fields. It currently detects stale locks only."
  },
  "clear-stale-pipeline-locks": {
    "state": "real",
    "reason": "Calls a backend cleanup endpoint that clears only stale persisted pipeline locks and preserves non-stale active locks."
  },
  "run-b4": {
    "state": "real",
    "reason": "Runs the real backend playback-selection action and shows the selected item in the preview."
  },
  "resume-last-run": {
    "state": "mock",
    "reason": "Triggers a placeholder recovery action; no live runtime restore endpoint exists yet."
  },
  "refresh-last-run": {
    "state": "real",
    "reason": "Reads the live `/api/runtime/orchestration/last` endpoint for a backend orchestration summary."
  },
  "start-b5-activity-test": {
    "state": "mock",
    "reason": "Runs the frontend-owned View B activity detection test against selected browser/PIR simulation sources and does not prove real PIR hardware availability."
  },
  "start-real-run": {
    "state": "mock",
    "reason": "Starts a simulated runtime preview; it does not launch the real runtime workers."
  }
} as const;

export const VIEW_REALITY_COPY = {
  "A": {
    "state": "mixed",
    "reason": "The Init view has real backend wiring for its main actions, but it still lives inside a hybrid dashboard shell with local UI state."
  },
  "B": {
    "state": "mock",
    "reason": "The Test view is explicitly simulation-only in the current repo."
  },
  "C": {
    "state": "mixed",
    "reason": "The Last Run view reads backend orchestration last-run data, but restore remains placeholder behavior."
  },
  "D": {
    "state": "mock",
    "reason": "The Running Process view is a frontend-only runtime preview in the current repo."
  },
  "E": {
    "state": "mixed",
    "reason": "The Database Viewer uses live backend routes for verification, table reads, rows, and session logging, while still living inside the shared hybrid dashboard shell."
  }
} as const;
