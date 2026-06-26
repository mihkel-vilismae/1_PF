# Dashboard Test / Real Mode OpenSpec 3XACR Review

Status: documentation-only review generated after adding page-level OpenSpec coverage for the existing Test Mode and Real Mode dashboard areas.

## Pass 1 — Inventory result

Relevant source files inspected:

```text
dashboard/app.ts
dashboard/shared/constants.ts
dashboard/views/initView.ts
dashboard/views/testView.ts
dashboard/services/runtimeTruth.ts
dashboard/services/apiClient.ts
```

Existing related docs inspected:

```text
docs/20_architecture_and_specs/openspec/README.md
docs/20_architecture_and_specs/openspec/view_a_refresh_plan_openspec.md
docs/20_architecture_and_specs/openspec/endpoint_contract_inventory_openspec.md
docs/20_architecture_and_specs/openspec/v2_operator_menu_backend_contract_openspec.md
```

Main inventory finding:

- the repo had many endpoint/proof/backend OpenSpecs;
- it did not have complete page-level OpenSpecs for the existing Test Mode / Real Mode shell, View A, and View B;
- View A and View B already encode important mode-specific behavior in frontend code.

## Pass 2 — Gap resolution

Added docs:

```text
dashboard_test_real_modes_openspec.md
dashboard_view_a_init_page_openspec.md
dashboard_view_b_test_page_openspec.md
```

These docs close the first documentation gap by defining:

- startup mode gate contract;
- Test Mode vs Real Mode boundaries;
- View A card/block inventory;
- View B card/block inventory;
- mode-specific visible/hidden/disabled behavior;
- action classifications;
- safety/non-claim boundaries.

## Pass 3 — Post-implementation review

Remaining OpenSpec gaps after this docs-only slice:

| Area | Remaining gap |
|---|---|
| C — Last Run Info | needs its own page-level OpenSpec |
| D — Running Process | needs its own page-level OpenSpec |
| E — Database Viewer | has support docs but needs page-level view spec |
| WIN/RPI Playback views | need page-level spec connecting UI to native playback proofs |
| V2_structure placeholder | still out of scope for this slice |
| final release page | still out of scope for this slice |
| Debug page | already comparatively strong |

## Safety review

This slice intentionally changed documentation only.

No frontend code, backend code, tests, package version, runtime data, auth flow, database schema, crontab logic, or worker behavior was changed.

## Recommended next documentation slice

Next docs-only slice should probably cover:

```text
dashboard_view_c_last_run_recovery_page_openspec.md
dashboard_view_d_running_process_page_openspec.md
```

Then separately:

```text
v2_structure_summary_placeholder_openspec.md
final_release_page_visual_openspec.md
```
