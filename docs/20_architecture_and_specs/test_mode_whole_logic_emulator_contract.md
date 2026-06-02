# Test Mode whole-logic emulator contract

This document defines the staged contract for the Test Mode control surface named **RUN whole logic without logging in — TEST MODE FAST EMULATOR**.

## v0.7.48.a Group A scope

Group A keeps the owned Test Mode controller state and adds the TEST MODE FAST EMULATOR wording, 6/3/12-second cadence model, blank status-circle panel contract, and focused UI log surface. The controller is intentionally bounded: it controls only records/processes spawned and tracked by this Test Mode controller. It must not kill the dashboard process and must not kill arbitrary Node, Python, SQLite, or system processes.

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
| regular stage worker | 6 seconds | 5 |
| playback worker | 3 seconds | 5 |
| screen on-off worker | 12 seconds | 5 |

The regular stage worker includes the mock-download limit in the max-5 worker-stage contract.

## Honest limitations

This deterministic controller proof is not a Raspberry cron proof. It is not a real Windows Task Scheduler proof. It is not real native fullscreen runtime proof. It does not launch or kill arbitrary OS processes.

The five-field CronEmulator rows still have minute-granularity limits. The 3-second playback cadence is preserved in the controller config/proof model and needs a future real runtime scheduler loop before it can be claimed as actual sub-minute OS execution.


## v0.8.0 manual cronjob buttons

The final baseline for this feature is `0.8.0` because the completed Test Mode fast-emulator control surface is a feature-level UI/controller change, not a small patch. The large start button remains the prerequisite for the owned controller run. The manual cronjob panel is disabled before that start boundary succeeds and enabled only after the backend state returns manual buttons with `enabled: true`.

| Button | Manual call | Enabled when | Notes |
|---|---|---|---|
| `1` | regular worker cronjob boundary | owned Test Mode controller run is active | Records the call in controller state and focused logs. |
| `2` | playback worker cronjob boundary | owned Test Mode controller run is active | Records the call in controller state and focused logs. |
| `3` | screen on-off worker cronjob boundary | owned Test Mode controller run is active | Records the call in controller state and focused logs. |

Each button has visible explanatory text beside it and a hover title with more detail. These manual buttons call the deterministic Test Mode controller boundary; they do not prove real OS cron firing.

## v0.7.49 Group B scope

Group B completes the fast-emulator controller evidence layer. After the large Test Mode button is clicked, the backend returns a controller state whose `startButton.disabled` flag is true. The UI renders that disabled state and duplicate backend starts are blocked while the owned controller run is active.

The controller writes a dedicated runtime log at `logs/end2end_test.log`. That file is runtime-generated, ignored by Git through the existing `*.log` rule, and should contain only relevant TEST MODE FAST EMULATOR entries. It must not contain secrets, raw provider output, unrelated dashboard logs, or arbitrary console noise.

Status rows remain semantic evidence only. `CRONTAB WORKING` and the three owned worker records may become green/passed after the deterministic start boundary verifies the owned controller records. Native playback and pipeline stages remain yellow/pending until real runtime execution proves them.

