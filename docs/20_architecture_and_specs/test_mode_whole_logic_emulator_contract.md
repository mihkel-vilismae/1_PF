# Test Mode whole-logic emulator contract

This document defines the staged contract for the Test Mode control surface named **RUN whole logic without logging in**.

## v0.7.48 Group 3 scope

Group 3 adds the owned Test Mode controller state and q/w/e/r/t control actions. The controller is intentionally bounded: it controls only records/processes spawned and tracked by this Test Mode controller. It must not kill the dashboard process and must not kill arbitrary Node, Python, SQLite, or system processes.

## UI behavior

View A renders the section only in Test Mode. The primary button configures the no-login whole-logic emulator boundary. The control buttons and immediate keyboard keys map to:

| Key | Meaning |
|---|---|
| `q` | Shut down the regular worker process record. |
| `w` | Shut down the playback worker process record. |
| `e` | Shut down the screen-on-off worker process record. |
| `r` | Stop cronjobs so worker processes do not autorun. |
| `t` | Toggle power-off/power-on simulation for app-owned runtime state. |

The exact operator text remains visible in the UI, including the requested native fullscreen instructions.

## Backend behavior

The backend exposes:

| Endpoint | Purpose |
|---|---|
| `POST /api/testing/whole-logic-emulator/start` | Creates the Test Mode runtime config, CronEmulator rows, and owned controller state. |
| `GET /api/testing/whole-logic-emulator/status` | Reads the owned controller state. |
| `POST /api/testing/whole-logic-emulator/control` | Applies one q/w/e/r/t control action to the owned controller state. |

All endpoints are blocked outside Test Mode. They do not require real iCloudPD login and they do not enable production network providers.

## Cadence and limits

The contract records:

| Worker | Requested cadence | Item limit |
|---|---:|---:|
| regular stage worker | 60 seconds | 5 |
| playback worker | 30 seconds | 5 |
| screen on-off worker | 120 seconds | 5 |

The regular stage worker includes the mock-download limit in the max-5 worker-stage contract.

## Honest limitations

This deterministic controller proof is not a Raspberry cron proof. It is not a real Windows Task Scheduler proof. It is not real native fullscreen runtime proof. It does not launch or kill arbitrary OS processes.

The five-field CronEmulator rows still have minute-granularity limits. The 30-second playback cadence is preserved in the controller config/proof model and needs a future real runtime scheduler loop before it can be claimed as actual sub-minute OS execution.
