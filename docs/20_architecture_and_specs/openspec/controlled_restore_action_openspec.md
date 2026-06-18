# Controlled restore action OpenSpec

Version introduced: 0.8.156

## Purpose

Define the boundary for a future restore action before any production restore mutation is implemented.

## Required states

- `RESTORE_UNAVAILABLE`: no valid restore target exists.
- `RESTORE_PREVIEW_READY`: a sanitized preview exists and can be inspected.
- `RESTORE_CONFIRMATION_REQUIRED`: operator confirmation is required before any mutation.
- `RESTORE_BLOCKED`: required evidence is missing or unsafe.
- `RESTORE_EXECUTED`: reserved for a future implementation with backend proof.

## Acceptance rules

1. View C remains read-only until a backend restore contract exists.
2. Debug may offer fake/local restore previews only.
3. Production restore must not be reachable from frontend-only state.
4. Any future real restore must write a sanitized proof artifact and identify the exact target state.

## Non-claims

This OpenSpec does not implement restore mutation, does not prove recovery after power loss, and does not authorize production database or media writes.
