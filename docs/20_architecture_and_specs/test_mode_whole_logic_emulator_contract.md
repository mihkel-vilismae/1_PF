# Test Mode whole-logic emulator contract

## Scope

This document defines the staged contract for the Test Mode control surface named **RUN whole logic without logging in**. Group 2 adds a guarded backend/service boundary for configuring the scheduler/emulator plan, but it still does not terminate processes or claim real Raspberry/native-fullscreen runtime proof.

## Operator control

The Test Mode View A panel exposes this planned button text:

```text
INSTALL CRONTAB/EMULATOR, CALLING REGULAR WORKER EVERY 1 MINUTES, PLAYBACK WORKER EVERY 30sec, screen on-off worker EVERY 2 MINUTES, ADD LIMIT OF 5 ITEMS TO EACH WORKER STAGE (INCLUDING THE MOCK DOWNLOAD)
```

The button is enabled in Group 2 and calls `/api/testing/whole-logic-emulator/start`. The endpoint is blocked outside Test Mode. In Test Mode it records the requested worker-stage max item limit of 5, writes a runtime config, and writes Windows CronEmulator rows. The current five-field CronEmulator can only express minute-granularity rows, so the requested 30-second playback cadence is preserved in the controller config and must be executed by the Group 3 controller loop before it can be claimed as runtime cadence proof.

## Required runtime copy

When native fullscreen playback starts in later groups, the UI must show this operator copy:

```text
PRESS [q] to shut down regular worker process.
PRESS [w] to shut down playback worker process.
PRESS [e] to shut down screen-on-off worker process.
PRESS [r] to stop all cronjobs - so that the processes would not autorun
PRESS [t] to stop all running processes related to the photoframe app (but not the photoframe dashboard itself!) - the database, playaback, everything. this also stops cronjobs. kill them using a signal that imitates a sudden power-outage. they can leave unfisinshed state etc, it must imitate sudden poweroff
PRESS [t] again to imitate a power on and enable all the cronjobs
```

## Safety boundary

Any later process-stop implementation must obey these limits:

```text
Only stop/terminate worker processes spawned and tracked by this TEST mode controller.
Do not kill the dashboard process.
Do not kill arbitrary Node/Python/SQLite/system processes.
```

## Non-goals for Group 2

- No production backend behavior changes.
- No real iCloudPD authentication changes.
- No process termination or power-cycle key behavior yet.
- No real Raspberry cron proof.
- No Windows Task Scheduler proof.
- No real native fullscreen runtime proof.
- No process termination behavior.

## Evidence

Group 2 evidence includes deterministic UI rendering tests, endpoint constant tests, and service tests proving Test Mode gating, max-5 worker-stage configuration, requested cadence recording, CronEmulator row generation, and runtime config/crontab file writes. Stop/power-cycle behavior belongs to Group 3.
