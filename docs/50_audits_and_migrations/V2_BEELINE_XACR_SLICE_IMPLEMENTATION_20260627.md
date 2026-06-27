# V2 Beeline XACR slice implementation report — 2026-06-27

## XACR result

The remaining sliceplan is logical, but the safe route is not to jump straight to autonomous cron playback before the UI can clearly prove mode, readiness, and truth-source separation. The highest-value first implementation layer is therefore the V2 control/safety layer:

- restore the missing readiness service from v0.10.72;
- make readiness rings mode-aware;
- mark RPI rows with TEST or REAL source tags;
- add per-stage batch-size selectors;
- make crontab start on 09 REAL PLAYBACK require explicit confirmation;
- add default crontab printing and write-test staging actions;
- keep marked blocks hidden.

## Implemented in this slice batch

- Fixed the missing `dashboard/services/v2ReadinessService.ts` import target.
- Added mode-aware readiness state for `.env`, DB, and login.
- Connected `.env` and DB backend action results to readiness rings.
- Connected NEW AUTH session-affecting actions to the login readiness ring.
- Added TEST/REAL source tags to RPI stages and RPI workers blocks.
- Added per-stage numeric batch-size controls to RPI stage cards.
- Forced the `04 workers` RPI blocks to TEST truth mode.
- Forced the `09 REAL PLAYBACK` RPI blocks to REAL truth mode.
- Added V2 mode selector behavior without changing backend runtime headers.
- Added 09 REAL PLAYBACK crontab start confirmation.
- Added default three-worker crontab printer.
- Added non-mutating crontab write-test marker staging.
- Routed V2 crontab cards to existing scheduler result/log surfaces.

## Still not complete

This batch does not claim full autonomous playback. The remaining heavy slices still need backend/product proof work:

- real source-of-truth file parser/writer implementation;
- real manual test runner stage execution with TEST DB/log/truth isolation;
- real crontab write-test add/read/remove cycle;
- real playback worker display loop proof on Raspberry;
- real screen on/off worker proof;
- crash recovery resume proof.

## Main risk closed

The UI no longer leaves RPI rows ambiguous: workers/test page uses TEST mode tags and real playback uses REAL mode tags. 09 REAL PLAYBACK now has a distinct confirmation boundary before installing crontab as the real start action.
