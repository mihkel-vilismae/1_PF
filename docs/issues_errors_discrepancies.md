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
