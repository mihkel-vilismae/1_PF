# Concurrency and Locking

## Purpose

This document defines the exact concurrency control model.

## Canonical Backend Contract Alignment

This document is the older target-state concurrency design.

For the implementation-ready backend execution model, also read:

- [`18_CANONICAL_BACKEND_CONTRACT_SET.md`](18_CANONICAL_BACKEND_CONTRACT_SET.md)
- [`21_EXECUTION_AND_RECOVERY_CONTRACT.md`](21_EXECUTION_AND_RECOVERY_CONTRACT.md)
- [`19_BACKEND_RUNTIME_CONTRACT.md`](19_BACKEND_RUNTIME_CONTRACT.md)

The newer canonical execution contract is more specific about stage-entry locks, Stage 3 and Stage 4 queue claims, Stage 6 playback ownership, reclaim, restart behavior, and conflict handling. Use it when implementing backend runtime behavior.

## Canonical Choice

The system uses **database-backed leases with fencing tokens** as the primary lock mechanism.
This is preferred over file-only locks because the database is already the canonical state holder.

## Lease Records

Each worker role has one row in `worker_lease` identified by `worker_name`.

Fields required for safety:
- `worker_name`
- `owner_id`
- `fencing_token`
- `lease_expires_at`
- `last_heartbeat_at`
- `status`

## Acquisition Algorithm

1. Read current lease row for the worker name.
2. Acquire only if:
   - no row exists, or
   - current time is after `lease_expires_at`, or
   - the requester already owns the lease and is renewing.
3. When acquired, increment `fencing_token`.
4. Store the new owner and expiry in one transaction.
5. Return the new token to the worker.

## Fencing Rule

A worker must include its `fencing_token` on any protected state mutation. If the token no longer matches the current lease row, the mutation is rejected.
This prevents a stale process from writing after lease loss.

## Lock Scope

- `pipeline` lease protects stage execution and stage state mutation.
- `playback` lease protects playback queue consumption and playback state mutation.
- `screen` lease protects screen activity processing and screen state mutation.
- `recovery` lease protects multi-component recovery actions.

## Duplicate Prevention

Even if the same endpoint or cron path is called many times:
- only the lease holder proceeds
- all others return a duplicate-rejected result
- duplicate attempts should be logged

## Crash-Safe Recovery

If a worker crashes mid-lease:
- it stops heartbeating
- lease expires after the configured TTL
- another worker may acquire the lease with a higher fencing token
- stale worker writes are rejected due to fencing mismatch

## Pipeline Stage Overlap Prevention

Pipeline overlap is prevented by both:
1. the exclusive `pipeline` lease
2. an atomic state transition on `runtime_state.pipeline_stage_state`

A new stage may only enter `running` from an allowed prior terminal state.

## Evidence Basis

Derived from the user's requirement that the five stages cannot run at the same time, that playback and screen each must have only one process, and that repeated trigger calls must not create duplicate active work.
