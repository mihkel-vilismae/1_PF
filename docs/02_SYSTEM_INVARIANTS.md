# System Invariants

## Purpose

This document lists rules that must remain true at all times. If any invariant is violated, the implementation is defective.

## Global Invariants

1. There is exactly one **authoritative runtime state** for the real system.
2. The authoritative runtime state is backend-owned and durably stored.
3. The event log is append-only; historical entries are never edited in place.
4. The dashboard is never the authority for worker execution or state mutation.
5. Test/simulation activity must not overwrite or masquerade as real runtime state.

## Pipeline Invariants

1. Only one of the five pipeline stages may be executing for the real runtime at any moment.
2. Pipeline stages execute in this order only:
   `download -> index -> parse_gps -> geocode -> enqueue_playback`.
3. A later stage may not start until the current stage has either completed or failed and has written its terminal event.
4. Two concurrent downloads for the same real run are forbidden.

## Worker Invariants

1. At most one playback worker lease may be valid at a time.
2. At most one screen worker lease may be valid at a time.
3. Worker identity changes must not silently discard ownership; lease handoff must be explicit.
4. A worker that loses its lease must stop mutating state.

## Persistence Invariants

1. Every terminal stage outcome writes both a durable state update and an event entry.
2. Screen-off due to inactivity must trigger a checkpoint write before the system treats playback as suspended.
3. Recovery always starts from the **last committed checkpoint**, never from in-memory assumptions.
4. A write that updates runtime state without an associated event is invalid for operational actions.

## Detectability Invariants

1. Invariant violations must be observable through logs and metrics.
2. If duplicate execution is attempted, the losing attempt must generate a duplicate-rejected event.
3. If lease recovery occurs after a stale owner disappears, that recovery must be logged.

## Evidence Basis

Derived from the user's requirement that only one pipeline stage may run at a time, playback and screen workers must each have only one process, explicit history must be preserved, and the system must recover accurately after power loss or crash.
