# Raspberry cron worker singleton and recovery proof plan

Version introduced: v0.8.44  
Status: Planned proof contract / documentation-only  
Runtime behavior changed by this document: none

## Purpose

This proof plan defines the target evidence required before PF_login / PhotoFrame can honestly claim that the Raspberry app is running through cron.

It is intentionally documentation-only in v0.8.44. It does not install cron rows, run workers, modify locks, reboot the Raspberry, or perform a power-loss test.

## Runtime definition under proof

A Raspberry PhotoFrame app-running proof must cover all three cron worker lanes:

| Worker lane | Required cadence | Required evidence |
|---|---:|---|
| `regular_stage_worker` | every 10 minutes | scheduled row, entrypoint, observed invocation, same-worker singleton, duplicate skip |
| `playback_worker` | every 1 minute | scheduled row, entrypoint, observed invocation, same-worker singleton, duplicate skip |
| `screen_on_off_worker` | every 3 minutes | scheduled row, entrypoint, observed invocation, same-worker singleton, duplicate skip |

## Required proof phases

### 1. Target and cron preflight

The proof must record:

- Raspberry target detection;
- repo version and git commit;
- cron command availability;
- current managed crontab rows;
- whether each expected worker row is present;
- entrypoint path checks for all three worker lanes.

### 2. Worker invocation evidence

The proof must record one observed invocation or proof-owned bounded invocation per worker lane.

The evidence must distinguish the worker lanes. A single playback worker run cannot prove the regular stage or screen on/off lanes.

### 3. Same-worker singleton evidence

For each worker lane, the proof must show that a duplicate invocation of the same worker does not start a second real worker body while the first valid instance is active.

Expected evidence:

- first invocation acquired the lane lock or singleton marker;
- duplicate invocation detected the active same-lane instance;
- duplicate invocation skipped safely;
- skip reason was logged;
- lock was released, refreshed, or left in a safe state.

### 4. Cross-worker independence evidence

The proof must show that each worker lane has its own boundary. A valid lock for one worker type must not automatically block the others.

Expected evidence examples:

- `regular_stage_worker` active while `playback_worker` can still pass its own singleton check;
- `playback_worker` active while `screen_on_off_worker` can still pass its own singleton check;
- stale or active lock keys are lane-specific.

### 5. Stale-lock reclaim evidence

The proof must show safe stale-lock handling before reboot or power-loss recovery can be claimed.

Expected evidence:

- stale lock marker created or detected;
- stale age/threshold recorded;
- worker refuses unsafe duplicate while lock is fresh;
- worker reclaims or invalidates lock when stale;
- durable state is not reset or corrupted as a side effect.

### 6. Reboot and restored-power continuation evidence

This v0.8.44 proof plan defines the requirement but does not claim it.

Future reboot/power-loss proof must include:

- pre-event marker;
- boot/restored-power timestamp;
- post-event crontab evidence;
- post-event worker invocation evidence for all three lanes;
- stale-lock reclaim evidence when pre-event locks remain;
- playback/runtime state safety evidence.

## Required proof artifact fields

Future proof JSON should include:

- `proof_kind: raspberry_cron_worker_singleton_recovery`;
- `proof_status`;
- `baseline_version`;
- `git_commit`;
- `target_detection`;
- `cron_evidence`;
- `worker_lanes`;
- `same_worker_singleton_evidence`;
- `cross_worker_independence_evidence`;
- `stale_lock_reclaim_evidence`;
- `reboot_recovery_evidence` when applicable;
- `power_loss_recovery_evidence` when applicable;
- `non_claims`;
- `sanitization_notes`.

## PASS criteria

A future proof may return `PASSED` only when:

1. The target is eligible for the requested proof mode.
2. All three worker lanes are represented.
3. Cron rows and entrypoints are present.
4. Same-worker duplicate-skip behavior is shown for every lane.
5. Cross-worker independence is shown.
6. Stale-lock reclaim or safe invalidation is shown.
7. Evidence is sanitized and written to a proof artifact.

## BLOCKED criteria

The proof should return `BLOCKED`, not `FAILED`, when:

- it is run off-target;
- cron is unavailable or inaccessible;
- the operator has not installed approved cron rows yet;
- entrypoints are intentionally missing because implementation has not started;
- reboot or power-loss phases require manual action that has not happened.

## Non-claims preserved in v0.8.44

This plan does not prove:

- actual Raspberry cron worker runtime behavior;
- controlled reboot recovery;
- physical power-loss recovery;
- monitor-pixel/display-camera proof;
- production iCloud continuation;
- real provider download/geocode success;
- Windows Task Scheduler behavior.
