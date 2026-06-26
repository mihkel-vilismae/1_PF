# Root script and documentation placement XACR — 2026-06-25

## Scope

Documentation and root-script organization cleanup. This slice keeps the root operator entry point simple while moving helper scripts and summary documents into canonical folders.

## XACR pass 1 — Inventory

The repo root had multiple user-facing and helper scripts mixed with source/config files. Root Markdown handoff summaries were also present outside canonical documentation folders.

## XACR pass 2 — Implementation

Root now keeps only `full_windows_runner_status.cmd` as the Windows terminal GUI launcher. Supporting scripts were moved under `start_scripts/`:

- `start_scripts/windows/` for Windows start/stop/runner implementation scripts.
- `start_scripts/windows/proofs/` for Windows proof launcher wrappers.
- `start_scripts/raspberry/` for Raspberry launcher scripts.
- `start_scripts/packaging/` for ZIP/update packaging helpers.

Root handoff Markdown files were moved into docs:

- `docs/10_runbooks/windows_runner_status_terminal_ui.md`
- `docs/50_audits_and_migrations/typecheck_fix_summary_20260625.md`
- `docs/50_audits_and_migrations/v2_operator_menu_backend_contract_test_first_implementation_summary.md`
- `docs/50_audits_and_migrations/placeholder_implementations_root_handoff.md`
- `docs/90_archive/patches/PF_login_v0.10.20_b3_regular_worker_state_machine.patch`

## XACR pass 3 — Review

The primary operator path is now clearer:

```cmd
full_windows_runner_status.cmd
```

That launcher delegates into `start_scripts/windows/FULL_WINDOWS_RUNNER_STATUS.PS1`, which in turn calls the moved start/stop scripts. This preserves the terminal GUI workflow while reducing root clutter.

## Non-claims

This slice does not prove live Windows terminal behavior. It updates file organization, launcher paths, documentation references, and static tests.
