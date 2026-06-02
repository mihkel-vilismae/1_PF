# Test Mode whole-logic emulator contract

## Scope

This document defines the Group 1 operator-visible contract for the Test Mode control surface named **RUN whole logic without logging in**. Group 1 is intentionally UI/contract-only: it does not install cron, start workers, start native fullscreen playback, or terminate processes.

## Operator control

The Test Mode View A panel exposes this planned button text:

```text
INSTALL CRONTAB/EMULATOR, CALLING REGULAR WORKER EVERY 1 MINUTES, PLAYBACK WORKER EVERY 30sec, screen on-off worker EVERY 2 MINUTES, ADD LIMIT OF 5 ITEMS TO EACH WORKER STAGE (INCLUDING THE MOCK DOWNLOAD)
```

The button is disabled in Group 1. Group 2 may wire it to a backend/service boundary that uses the safe Test Mode scheduler/emulator path.

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

## Non-goals for Group 1

- No production backend behavior changes.
- No real iCloudPD authentication changes.
- No real Raspberry cron proof.
- No Windows Task Scheduler proof.
- No real native fullscreen runtime proof.
- No process termination behavior.

## Evidence

Group 1 evidence is limited to deterministic UI rendering tests and source review. Runtime scheduler/emulator behavior belongs to Group 2, and stop/power-cycle behavior belongs to Group 3.
