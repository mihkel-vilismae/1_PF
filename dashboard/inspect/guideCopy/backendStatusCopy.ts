/*
 * Contains one logical group of inspect-mode guide copy.
 * Values are split from the former monolithic guideCopy.json file.
 */
export const ACTION_BACKEND_STATUS_COPY = {
  "toggle-inspect-mode": {
    "state": "unknown",
    "reason": "Local UI guide button; it does not represent backend wiring status."
  },
  "toggle-value-inspect-mode": {
    "state": "unknown",
    "reason": "Local UI guide button; it does not represent backend wiring status."
  },
  "toggle-reality-inspect-mode": {
    "state": "unknown",
    "reason": "Local UI guide button; it does not represent backend wiring status."
  },
  "toggle-backend-status-inspect-mode": {
    "state": "unknown",
    "reason": "Local UI guide button; it does not represent backend wiring status."
  },
  "toggle-marked-for-removal": {
    "state": "unknown",
    "reason": "Local UI visibility toggle for marked dashboard blocks; it does not represent backend wiring status."
  },
  "clear-history": {
    "state": "unknown",
    "reason": "Implemented local UI action; it is not a backend-backed operation."
  },
  "copy-history": {
    "state": "unknown",
    "reason": "Implemented local UI action that writes formatted event history JSON to the clipboard; it is not backend-backed."
  },
  "select-scheduler-target-windows": {
    "state": "real",
    "reason": "This action is backed by POST /api/init/cron/target and selects the Windows CronEmulator scheduler target."
  },
  "select-scheduler-target-raspberry": {
    "state": "real",
    "reason": "This action is backed by POST /api/init/cron/target and selects the Raspberry real-crontab scheduler target."
  },
  "verify-db-viewer": {
    "state": "real",
    "reason": "This action is backed by a repo-local `/api/database-viewer/verify` endpoint."
  },
  "connect-db-viewer": {
    "state": "real",
    "reason": "This action is backed by a repo-local `/api/database-viewer/connect` endpoint."
  },
  "show-db-tables": {
    "state": "real",
    "reason": "This action is backed by a repo-local `/api/database-viewer/tables` endpoint."
  },
  "start-db-logging": {
    "state": "real",
    "reason": "This action is backed by a repo-local `/api/database-viewer/logging/start` endpoint."
  },
  "stop-db-logging": {
    "state": "real",
    "reason": "This action is backed by a repo-local `/api/database-viewer/logging/stop` endpoint."
  },
  "run-b1": {
    "state": "real",
    "reason": "This button calls backend auth endpoints (/api/auth/status, /api/auth/run, /api/auth/reset, /api/auth/2fa/submit, /api/auth/logout) and never infers authenticated state locally."
  },
  "test-b1-login-download-one": {
    "state": "real",
    "reason": "This button calls POST /api/auth/test-login-download-one, which invokes icloudpd through the backend provider and reports 2FA-required state instead of faking a download."
  },
  "run-b2": {
    "state": "real",
    "reason": "This button calls the real POST /api/runtime/download/run endpoint."
  },
  "run-b2-real-download": {
    "state": "real",
    "reason": "This button calls POST /api/runtime/download/real-run and is gated by verified iCloudPD NEW AUTH session proof."
  },
  "run-b3-auto": {
    "state": "real",
    "reason": "This auto pipeline calls POST /api/runtime/orchestration/run while preserving the existing individual stage button endpoints."
  },
  "run-b3-1": {
    "state": "real",
    "reason": "This stage now calls the real POST /api/runtime/download/run endpoint."
  },
  "run-b3-2": {
    "state": "real",
    "reason": "This stage now calls the real POST /api/runtime/index/run endpoint."
  },
  "run-b3-3": {
    "state": "real",
    "reason": "This stage now calls the real POST /api/runtime/gps/run endpoint."
  },
  "run-b3-4": {
    "state": "mock",
    "reason": "This stage still calls the POST /api/runtime/geocode/run endpoint, but because the geocoder is a deterministic placeholder rather than a real provider, the backend support is considered simulation‑only."
  },
  "run-b3-5": {
    "state": "real",
    "reason": "This stage now calls the real POST /api/runtime/queue/prepare endpoint."
  },
  "detect-pipeline-issues": {
    "state": "real",
    "reason": "This action calls POST /api/runtime/pipeline/issues/detect and reports stale persisted pipeline locks."
  },
  "clear-stale-pipeline-locks": {
    "state": "real",
    "reason": "This action calls POST /api/runtime/pipeline/stale-locks/clear and only clears stale persisted pipeline locks."
  },
  "run-b4": {
    "state": "real",
    "reason": "This action now calls the real POST /api/runtime/playback/select-current endpoint."
  },
  "resume-last-run": {
    "state": "missing",
    "reason": "The UI exposes a placeholder restore action, but the real runtime restore backend is not implemented here."
  },
  "refresh-last-run": {
    "state": "real",
    "reason": "This action calls GET /api/runtime/orchestration/last for read-only backend last-run data."
  },
  "start-b5-activity-test": {
    "state": "mock",
    "reason": "This button runs a local View B activity-detection countdown. It does not call a backend endpoint and does not represent real PIR hardware telemetry."
  },
  "start-real-run": {
    "state": "missing",
    "reason": "This starts a simulated runtime preview because the real runtime backend/worker API is not implemented here."
  }
} as const;
