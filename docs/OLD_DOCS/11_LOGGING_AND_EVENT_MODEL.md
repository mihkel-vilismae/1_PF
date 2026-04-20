# Logging and Event Model

## Purpose

This document defines the required append-only history layer.

## Principles

- Events are durable operational facts.
- Events are append-only.
- Events support debugging, auditability, and recovery reasoning.
- Events do not replace canonical current state; they complement it.

## Required Event Categories

### Stage events
- `stage_start`
- `stage_complete`
- `stage_fail`
- `stage_retry_scheduled`
- `stage_skipped`

### Playback events
- `playback_item_started`
- `playback_item_progress`
- `playback_item_completed`
- `playback_paused_inactivity`
- `playback_resumed`
- `playback_error`

### Screen events
- `screen_on`
- `screen_off_inactivity`
- `screen_off_manual`
- `activity_detected_pir`
- `activity_detected_mouse`
- `activity_detected_keyboard`
- `screen_error`

### System events
- `run_started`
- `run_stopped`
- `recovery_started`
- `recovery_completed`
- `recovery_failed`
- `lease_acquired`
- `lease_renewed`
- `lease_released`
- `duplicate_rejected`

## Event Schema

Required fields:
- `event_id`
- `occurred_at`
- `run_id` nullable
- `component`
- `event_type`
- `severity`
- `worker_name` nullable
- `correlation_id` nullable
- `causation_id` nullable
- `payload_json`

## Ordering Rule

Within a single transaction scope, state change and event append must be consistent. If the system cannot atomically perform both in one storage transaction, it must use a durable outbox process.

## Log File Relationship

Human-readable log files may exist, but they are secondary observability artifacts. The `event_log` store is the authoritative structured history.

## Evidence Basis

Derived from the user's requirement that any stage completion, image display, screen on/off transition, and interruption-related action must create explicit history entries that survive power loss.
