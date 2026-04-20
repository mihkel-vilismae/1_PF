# Acceptance And Validation Contract

## Purpose

This document is the canonical proof standard for deciding whether the backend pipeline behaves correctly enough to implement, validate, and ship.

## Sources Absorbed

- `docs/contracts/ACCEPTANCE_AND_VALIDATION.md`
- `docs/contracts/DB_STAGE_CHECKLIST.md`
- `docs/archive/analysis/END_TO_END_ACCEPTANCE.md`

## Main Success Definition

A successful per-file pipeline means:

1. the file is downloaded
2. the canonical asset is created
3. GPS is found or a correct terminal GPS outcome is recorded
4. the address is geocoded or a correct terminal geocode outcome is recorded
5. eligible addressed media enters slideshow readiness
6. Stage 6 commits a valid current item
7. Stage 7 derives matching overlay output from the committed current item

At system level, success also requires clear logs or operator-visible summaries.

## Core Invariants

- canonical truth is durable truth
- queue and canonical truth stay synchronized when both are written in one stage outcome
- runtime correctness must not depend on memory-only state
- by default, only addressed items are display-eligible
- a stale old overlay on a new item is forbidden
- retry, reclaim, and conflict handling must be visible in evidence surfaces

## Stage Acceptance Gates

| Stage | Pass when |
|---|---|
| Stage 1 | auth/download succeeds or fails explicitly, with durable Stage 1 proof and no stale 2FA markers |
| Stage 2 | variants and canonical rows are created deterministically and GPS enqueue is idempotent |
| Stage 3 | claims are safe, queue and canonical GPS outcomes stay synchronized, and geocode enqueue happens only on GPS success |
| Stage 4 | cache-first geocoding works, queue and canonical geocode outcomes stay synchronized, and only addressed success makes an asset Stage 5-eligible |
| Stage 5 | only eligible addressed assets receive slideshow rows and reruns stay idempotent |
| Stage 6 | playback ownership is enforced, invalid candidates are handled explicitly, and pointer plus playback history commit together |
| Stage 7 | overlay derives from the committed current-item pointer and canonical address, and stale publish is prevented |

## Required Proof Layers

Every stage needs all of these:

1. unit tests
2. integration tests
3. manual or environment-backed checks where external behavior matters
4. acceptance audit through logs, DB state, or operator-visible summaries

Code existence alone is not proof.

## DB Checklist Contract

The DB checklist is the active machine-checkable proof surface for stages 1 through 6.

It must continue to validate:

- Stage 1 action outcome plus persisted auth/download proof
- Stage 2 canonical/variant linkage and GPS queue creation
- Stage 3 GPS truth, queue truth, coordinates, and geocode enqueue alignment
- Stage 4 geocode truth, queue truth, coordinates, address text, and cache alignment
- Stage 5 slideshow eligibility correctness
- Stage 6 current-item pointer, playback history, and action outcome alignment

Checklist semantics remain:

- `PASS`: internally consistent DB evidence
- `WARN`: incomplete or suspicious but not clearly contradictory
- `FAIL`: invalid or desynchronized state
- `NOT_RUN`: not enough evidence to say the stage was reached

## High-Value Validation Work

- reclaim and retry behavior for Stage 3 and Stage 4
- crash safety between claim, outcome, and downstream handoff
- Stage 6 single-runner conflicts and restart behavior
- Stage 7 stale-publish prevention
- live Stage 1 and cache-miss geocode smoke paths

## Required Scenario Coverage

The validation suite should prove at least these scenario classes:

- end-to-end happy path
- idempotent rerun
- retry scheduling and retry exhaustion
- crash before and after claim commit
- stale lock reclaim
- overlapping trigger conflicts
- playback restart without double-counting
- overlay correctness during pointer transitions

## Observability Requirements

Evidence must make it possible to trace one asset across:

- stage entry and exit
- claims and releases
- retries and terminal failures
- canonical truth writes
- slideshow eligibility decisions
- current-item pointer updates
- overlay binding and publish decisions
- reclaim, restart, and conflict events

Errors should be easier to find than success noise.

## Final Proof Standard

The backend may be treated as implementation-ready only when all of these are true:

- stage contracts are implemented without ownership or transition contradictions
- the DB checklist catches cross-table desynchronization
- high-risk scenarios have direct evidence
- Stage 6 and Stage 7 pointer-to-overlay correctness is explicitly proved
- end-to-end runs and degraded scenarios are both observable

