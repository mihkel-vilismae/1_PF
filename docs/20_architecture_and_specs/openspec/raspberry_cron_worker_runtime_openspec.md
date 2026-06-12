# Raspberry cron worker runtime OpenSpec

Version introduced: v0.8.44  
Status: OpenSpec / documentation-only contract  
Runtime behavior changed by this document: none

## Purpose

This OpenSpec defines the Raspberry cron worker runtime contract for PF_login / PhotoFrame. It closes the documentation ambiguity around the phrase “app is running” by making the Raspberry cron system and all three worker lanes part of the same runtime claim.

This document does not implement cron installation, worker singleton behavior, reboot recovery, or power-loss recovery. It defines the acceptance boundary for future implementation and proof work.

## App-running definition

On Raspberry OS, PhotoFrame may only be called “running” when all of the following are true:

1. The Raspberry cron mechanism is active for the project.
2. The regular stage worker lane is scheduled and operational every 10 minutes.
3. The playback worker lane is scheduled and operational every 1 minute.
4. The screen on/off worker lane is scheduled and operational every 3 minutes.
5. Each worker lane enforces same-worker singleton behavior before doing real work.
6. Duplicate invocations of the same worker skip safely and leave evidence.
7. Different worker types do not block each other merely because another worker lane is active.
8. Stale locks from dirty shutdown, reboot, or restored power are reclaimed or invalidated safely so recovery is not permanently blocked.

API startup, Vite startup, the Raspberry launcher dry-run, native image playback, or native video playback alone are not sufficient to claim the PhotoFrame app is running.

## Worker lane contract

| Worker lane | Required cadence | Required boundary |
|---|---:|---|
| `regular_stage_worker` | every 10 minutes | owns regular media pipeline stages such as download/index/GPS/geocode/queue preparation without pretending to be playback or display control |
| `playback_worker` | every 1 minute | owns playback current/next selection and playback worker autostart boundaries |
| `screen_on_off_worker` | every 3 minutes | owns screen/display schedule actions separately from media pipeline and playback selection |

Future proof artifacts must use these lane names consistently. Alias names may be documented for compatibility, but pass/fail criteria must use the canonical lane names above.

## Singleton and duplicate-skip contract

Each worker invocation must check whether another instance of the same worker lane is already active before doing real work.

A compliant worker lane must:

- acquire a worker-specific lock, lease, or equivalent singleton marker before real work;
- reject or skip a duplicate same-worker invocation while the active lock is valid;
- log that the duplicate was skipped;
- release or refresh the lock on normal completion;
- detect stale locks using a documented threshold;
- reclaim or invalidate stale locks without corrupting durable state;
- avoid deleting history needed for diagnosis.

## Cross-worker independence contract

The singleton boundary is per worker lane, not global across all workers.

A compliant runtime must allow:

- `regular_stage_worker` to be active without automatically blocking `playback_worker`;
- `playback_worker` to be active without automatically blocking `screen_on_off_worker`;
- `screen_on_off_worker` to be active without automatically blocking regular pipeline work;
- independent status evidence for each lane.

A future proof must explicitly show that a busy or locked worker lane does not falsely suppress other worker types.

## Dirty shutdown, reboot, and restored-power contract

Worker locks and runtime state must be recoverable after dirty shutdown, reboot, or restored power.

A compliant proof plan must distinguish:

| Recovery class | Meaning | Current v0.8.44 status |
|---|---|---|
| stale-lock reclaim simulation | local/proof-owned stale marker is reclaimed | planned, not implemented |
| controlled reboot recovery | operator/manual reboot with pre/post evidence | planned, not implemented |
| physical power-loss recovery | actual power interruption/restored-power evidence | planned, not implemented |

The runtime may not claim reboot or physical power-loss recovery from dry-run, simulated, or Windows CronEmulator evidence alone.

## Required future proof evidence

A future Raspberry cron worker runtime proof must export sanitized evidence including:

- repo version and git commit;
- Raspberry target detection;
- cron availability and current managed crontab rows;
- all three worker lane schedules;
- entrypoint existence for all three lanes;
- last observed invocation for each lane;
- same-worker duplicate-skip evidence for each lane;
- cross-worker independence evidence;
- stale-lock reclaim or safe invalidation evidence;
- proof status of `PASSED`, `FAILED`, or `BLOCKED` with exact reasons;
- explicit non-claims for monitor-pixel proof, production iCloud continuation, real provider chains, reboot recovery, and power-loss recovery unless separately observed.

## Expected future proof statuses

| Status | Meaning |
|---|---|
| `PASSED` | Cron is active and all three worker lanes produced the required singleton, duplicate-skip, independence, and stale-lock evidence on the intended target. |
| `FAILED` | The proof ran on an eligible target and observed missing entries, failed worker evidence, unsafe locking, false cross-worker blocking, or stale-lock non-recovery. |
| `BLOCKED` | The proof could not run because Raspberry target detection, cron access, entrypoints, permissions, or required runtime state were unavailable. |
| `NOT_RUN` | No target evidence was collected. |

## Non-goals

This OpenSpec does not:

- implement the worker singleton behavior;
- install or modify a Raspberry crontab;
- implement systemd or boot autostart;
- prove controlled reboot recovery;
- prove physical power-loss recovery;
- prove monitor-pixel/display-camera observation;
- prove production iCloud continuation;
- prove real geocode provider behavior;
- reintroduce Windows Task Scheduler into project scope;
- vendor `mpv`, `ffmpeg`, or `ffprobe` binaries into Git.

## Relationship to existing Raspberry proofs

The Raspberry tool checker, generated fixture validation, native image playback, and native video playback proofs may all pass without proving this cron worker runtime contract. Those proofs are prerequisite confidence, not app-running proof.

The Raspberry project-owned launcher dry-run may write a launch plan without proving cron, worker singleton behavior, reboot recovery, or power-loss recovery.

## Recommended next implementation slice

The next implementation slice after v0.8.44 should add a proof-owned Raspberry cron worker runtime proof that validates all three lanes and exports sanitized evidence without claiming reboot or power-loss recovery unless separately observed.
