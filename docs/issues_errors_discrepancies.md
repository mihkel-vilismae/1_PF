# Issues / Errors / Discrepancies Registry

This file is the central, append-only registry of system issues for this repository.

Rules:
- Issues are never deleted.
- Issue IDs are never reused.
- Resolved items remain in this file and must retain their history.
- Only issues that affect correctness, architecture integrity, data consistency, recovery guarantees, or concurrency safety belong here.

## Audit Coverage Summary

- FRONTEND → Issues Found
- DOCUMENTATION → No Issues Found
- ARCHITECTURE → Issues Found
- STATE MODEL → No Issues Found
- CONCURRENCY & LOCKING → Issues Found
- WORKER SYSTEM → Issues Found
- CRON & WATCHDOG → No Issues Found
- LOGGING SYSTEM → No Issues Found
- RECOVERY SYSTEM → No Issues Found
- FRONTEND-BACKEND CONTRACT → No Issues Found
- SYSTEM INVARIANTS → Issues Found
- FAILURE SCENARIOS → Issues Found

## Issue Index

| ID | Title | Severity | Status | Category |
|----|-------|----------|--------|----------|
| ISSUE-0001 | Pipeline stages could overlap in the frontend runtime truth layer | HIGH | VERIFIED | CONCURRENCY |
| ISSUE-0002 | Real run and playback actions lacked single-instance guards | HIGH | VERIFIED | WORKERS |
| ISSUE-0003 | Screen simulation controls did not drive playback/screen truth state | HIGH | VERIFIED | FRONTEND |
| ISSUE-0004 | Re-entrant action triggers could overlap login and control flows | MEDIUM | VERIFIED | FRONTEND |

## High Priority Issues

### [ISSUE-0001] Pipeline stages could overlap in the frontend runtime truth layer

**Status:** VERIFIED  
**Type:** ERROR  
**Severity:** HIGH  
**Confidence:** HIGH  
**Category:** CONCURRENCY

**Location:**
- file(s): `dashboard/services/runtimeTruth.js`
- component(s): `runPipelineStage`, `runAutoPipeline`, `runEnqueueStage`

**Description:**
The mock runtime-truth service allowed manual and automatic pipeline stage actions to start without a mutual-exclusion guard. This violated the documented invariant that only one pipeline stage may run at a time.

**Impact:**
The frontend could present overlapping pipeline execution, undermining the documented locking model and making the UI contradict the intended backend architecture.

**Evidence:**
The original implementation started each auto-pipeline stage on independent timers and allowed repeated manual stage clicks without checking whether a stage lock was already held.

**Dependencies:**
NONE

**Proposed Fix:**
Add a single pipeline-active guard to the runtime-truth layer, acquire the pipeline lock before stage execution, reject duplicate stage starts while the lock is held, and sequence auto-pipeline execution stage-by-stage.

**Update Log:**
- Update-1: Confirmed that stage start paths lacked a shared mutual-exclusion check.
- Update-2: Added `pipelineActiveKey` state, centralized stage lock acquisition/release helpers, and changed auto mode to run sequentially without overlap.

**Resolution:**
Fixed by enforcing a shared pipeline lock in the mock runtime-truth service and by sequencing auto-pipeline stages through explicit completion callbacks instead of overlapping timers.

**Verification:**
Verified by repository-local production build (`npm run build`) after the runtime-truth changes and by code-path inspection confirming that new stage starts now return early whenever another stage already holds the lock.

---

### [ISSUE-0002] Real run and playback actions lacked single-instance guards

**Status:** VERIFIED  
**Type:** ERROR  
**Severity:** HIGH  
**Confidence:** HIGH  
**Category:** WORKERS

**Location:**
- file(s): `dashboard/services/runtimeTruth.js`
- component(s): `runPlaybackEmulation`, `startRealRun`

**Description:**
The runtime-truth layer allowed repeated playback-emulation starts and repeated real-run starts without a single-instance guard. This violated the documented expectation that playback and runtime worker processes are single-instance only.

**Impact:**
The frontend could simulate duplicate worker starts, which would misrepresent the locking contract and confuse future backend wiring around process ownership.

**Evidence:**
The original implementation of `runPlaybackEmulation` and `startRealRun` lacked any early-return guard for already-active playback or already-active real runtime state.

**Dependencies:**
NONE

**Proposed Fix:**
Introduce explicit playback-active and real-run-active guards, reject duplicate starts, and keep lock text aligned with single-instance ownership.

**Update Log:**
- Update-1: Confirmed that repeated action triggers could re-enter playback and real-run startup paths.
- Update-2: Added playback guard helpers and idempotent real-run start behavior with duplicate-start rejection logs.

**Resolution:**
Fixed by adding explicit single-instance guards around playback emulation and real-run startup, plus lock-state updates that preserve current ownership semantics.

**Verification:**
Verified by repository-local production build (`npm run build`) after the guard changes and by code-path inspection showing that duplicate real-run and playback starts now return early without mutating active worker state.

---


## High Priority Issues (continued)

### [ISSUE-0003] Screen simulation controls did not drive playback/screen truth state

**Status:** VERIFIED  
**Type:** ERROR  
**Severity:** HIGH  
**Confidence:** HIGH  
**Category:** FRONTEND

**Location:**
- file(s): `dashboard/services/runtimeTruth.js`, `dashboard/views/testView.js`
- component(s): `setSimulationValue`, `applyScreenSimulationState`, B4/B5 interaction

**Description:**
The B5 screen simulation toggles and inactivity timeout did not update the shared runtime truth for screen state or playback pause state, even though the UI documentation and layout describe B5 as the control surface that directly affects the B4 playback preview.

**Impact:**
Operators could toggle screen simulation controls without seeing the promised effect on screen ON/OFF state or playback checkpoint behavior, making the frontend contradict its own documented simulation contract.

**Evidence:**
Before this fix, `setSimulationValue` only updated timeout values and checkbox state. It did not recompute `truth.screenState`, `truth.playbackStatus`, or the screen worker state that the B4 preview and side panels display.

**Dependencies:**
NONE

**Proposed Fix:**
Route all B5 simulation changes through a shared screen-state recomputation helper that updates the runtime truth, playback status, checkpoint text, and screen worker state in one place.

**Update Log:**
- Update-1: Confirmed that B5 toggles updated input state only and did not change the shared screen/playback truth presented to the operator.
- Update-2: Added shared screen simulation recomputation so activity toggles and timeout changes now drive screen state, playback status, checkpoint text, and worker summaries.

**Resolution:**
Fixed by adding `applyScreenSimulationState()` and calling it from `setSimulationValue()` whenever screen-simulation inputs change. The helper now synchronizes B5 controls with B4 preview state and the shared runtime-truth side panels.

**Verification:**
Verified by repository-local production build (`npm run build`) and by code-path inspection showing that changing B5 controls now recomputes `truth.screenState`, `truth.playbackStatus`, `truth.lastCheckpoint`, and the screen worker state used by the preview and status panels.

---

## Medium Issues

### [ISSUE-0004] Re-entrant action triggers could overlap login and control flows

**Status:** VERIFIED  
**Type:** ERROR  
**Severity:** MEDIUM  
**Confidence:** HIGH  
**Category:** FRONTEND

**Location:**
- file(s): `dashboard/services/runtimeTruth.js`
- component(s): `genericAction`, `runLoginFlow`, per-card action dispatch

**Description:**
Repeated clicks on the same action could re-enter generic action handlers and the B1 login flow while they were already running, creating overlapping timers, repeated logs, and inconsistent step state.

**Impact:**
The dashboard could show duplicate action execution for the same control card, which weakens operator trust and misrepresents the single-action expectation documented across the UI.

**Evidence:**
Before this fix, `genericAction()` and `runLoginFlow()` started timers immediately without checking whether the same action key was already active.

**Dependencies:**
NONE

**Proposed Fix:**
Add a small shared action-guard layer for re-entrant UI actions, track active actions by key, and reject duplicate starts until the active run completes.

**Update Log:**
- Update-1: Confirmed that repeated button clicks could stack duplicate action timers for B1 and the generic control cards.
- Update-2: Added active-action tracking plus start/end guards for `genericAction()` and `runLoginFlow()`.

**Resolution:**
Fixed by introducing `activeActions`, `guardAction()`, `beginAction()`, and `endAction()` so duplicate action starts are rejected until the first run completes.

**Verification:**
Verified by repository-local production build (`npm run build`) and by code-path inspection confirming that duplicate action starts now return early with an error log instead of creating overlapping timers.

---
