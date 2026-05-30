# Runbooks

Estonian timestamp: 2026-05-24 23:31 EEST

## Purpose

This folder is for operator procedures and how-to instructions.

## Belongs here

- setup and run instructions.
- debugging procedures.
- auth evidence pack usage guides.
- safe operational checklists.

## Does not belong here

- architecture-only target specs.
- historical task prompts.
- raw logs, secrets, cookies, or provider session contents.

## Authority rule

Runbooks explain what to do, but they must be checked against current scripts, endpoints, and evidence when behavior changes. Code, tests, generated evidence packs, and runtime artifacts are stronger than old documentation when there is a conflict.

## Navigation

Use these repository-level documentation guides before adding or moving files:

- [Documentation Index](../DOC_INDEX.md)
- [Documentation Freshness Matrix](../DOC_FRESHNESS_MATRIX.md)
- [Documentation Reorganization Plan](../DOC_REORGANIZATION_PLAN.md)

Do not physically move files into this folder until the move is covered by a link-aware documentation slice.

## Current runbooks

- [Operator Setup and Auth Notes](operator_setup_and_auth_notes.md) — operator-facing setup, auth, iCloudPD, session, and NEW AUTH usage notes.

## Documentation workflow runbook moved in Slice 17

Estonian timestamp: 2026-05-25 01:56 EEST

Slice 17 moved this documentation-governance runbook into the canonical runbook area:

- [Documentation Workflow and Inventory](documentation_workflow_and_inventory.md)

The old `docs/categorized/other_documentation/documentation_workflow_and_inventory.md` path remains a compatibility pointer only. Use the canonical runbook path for new references.
- [Windows Full Launcher Runbook](windows_full_launcher.md) — full Windows startup script with dependency install, tests, dual API/frontend tabs, and browser opening.

- [GPS Metadata Sources](gps_metadata_sources.md) — EXIF, JSON/XMP/text sidecar, filename-token, and path-token coordinate source examples for the GPS parser stage.

## Current operator checklists

- [PC/runtime worker-stage verification checklist](PC_RUNTIME_WORKER_STAGE_VERIFICATION_CHECKLIST_20260529.md) — step-by-step PC evidence capture for Download, Index, GPS parser, Geocode, and Queue.

- [Power-Outage Playback Recovery Checklist](./POWER_OUTAGE_PLAYBACK_RECOVERY_CHECKLIST_20260529.md) — Manual Windows/Raspberry restore verification after simulated power loss.

- [Native Playback Runner Setup Runbook](native_playback_runner_setup.md) — setup, detection, manual start/stop, worker auto-start, and power-outage notes for OS-native fullscreen playback.
