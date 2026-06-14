# Raspberry dashboard status view OpenSpec

Status: active planning contract  
Introduced: v0.8.69

## Goal

Define a proof-backed dashboard status view for v1 without granting unsafe control authority.

## Default scope

Until D1/D2 are confirmed, dashboard status should be status-only and should show:

- worker health and last invocation status;
- current/last media playback state;
- v1 readiness gate summary;
- latest proof artifact paths/statuses;
- real-provider status as PASS/BLOCKED/FAILED/PARTIAL.

## Non-claims

- Dashboard display does not start cron or hardware by itself.
- Dashboard controls are out of scope until explicitly approved.
- Dashboard status must not claim proof beyond underlying artifacts.
