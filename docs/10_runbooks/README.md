# Runbooks

> Current checkpoint: `v0.10.67`. This README was refreshed in the docs/launcher reconciliation pass; code, focused tests, proof artifacts, and runtime evidence override stale prose.

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

- [Full HOW_TO_RUN Reference](how_to_run_full_reference.md) — preserved expanded operator/run guidance moved out of the short root `HOW_TO_RUN.md`.
- [Operator Setup and Auth Notes](operator_setup_and_auth_notes.md) — operator-facing setup, auth, iCloudPD, session, and NEW AUTH usage notes.

## Documentation workflow runbook moved in Slice 17

Estonian timestamp: 2026-05-25 01:56 EEST

Slice 17 moved this documentation-governance runbook into the canonical runbook area:

- [Documentation Workflow and Inventory](documentation_workflow_and_inventory.md)

The old `docs/categorized/other_documentation/documentation_workflow_and_inventory.md` path remains a compatibility pointer only. Use the canonical runbook path for new references.
- [Windows Runner Status Terminal UI](windows_runner_status_terminal_ui.md) — root `full_windows_runner_status.cmd` launcher, Start All / Stop All / Refresh Status menu, and moved script layout.
- [Windows Full Launcher Runbook](windows_full_launcher.md) — full Windows startup script with dependency install, tests, dual API/frontend tabs, and browser opening.

- [GPS Metadata Sources](gps_metadata_sources.md) — EXIF, JSON/XMP/text sidecar, filename-token, and path-token coordinate source examples for the GPS parser stage.

- [Geocode Provider Activation](geocode_provider_activation.md) — safe activation, cache-first verification, placeholder fallback checks, and secret-handling rules for reverse geocoding providers.

## Current operator checklists

- [PC/runtime worker-stage verification checklist](PC_RUNTIME_WORKER_STAGE_VERIFICATION_CHECKLIST_20260529.md) — step-by-step PC evidence capture for Download, Index, GPS parser, Geocode, and Queue.

- [Power-Outage Playback Recovery Checklist](./POWER_OUTAGE_PLAYBACK_RECOVERY_CHECKLIST_20260529.md) — Manual Windows/Raspberry restore verification after simulated power loss.

- [Native Playback Runner Setup Runbook](native_playback_runner_setup.md) — setup, detection, manual start/stop, worker auto-start, and power-outage notes for OS-native fullscreen playback.

- [Raspberry Project-Owned Launcher](raspberry_project_owned_launcher.md) — conservative Raspberry launcher skeleton with dry-run evidence and optional project-owned API start.

- [Debug Page Runbook](debug_page_runbook.md) — operator/developer guide for the planned Debug page, crontab setup, worker panes, and proof-honesty checks.
- [Debug Page Keybook](../40_backlog_and_tasks/debug_page_keybook.md) — repo-local lookup map for Debug page elements, buttons, IDs, source files, docs, tests, proofs, and non-claims.

## Overall project completeness reporting

- [Overall Project Completeness Reporting Runbook](overall_project_completeness_reporting.md) defines the operator workflow for source-backed completeness tables, status handling, planned proof command separation, and Debug docs/runtime split.
- [Proofrunner handoff artifact export contract](proofrunner_handoff_artifact_export_contract.md) defines shell-summary handoff and failed proof artifact packaging requirements.
- [Proofrunner packaging identity contract](proofrunner_packaging_identity_contract.md) defines version-aligned repo ZIP/handoff root naming requirements.
