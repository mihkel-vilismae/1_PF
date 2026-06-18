# Overall Project Goal Registry

Status: active project completeness source registry  
Introduced: v0.8.135  
Related status enum: [`../20_architecture_and_specs/reference/project_status_enum_registry.md`](../20_architecture_and_specs/reference/project_status_enum_registry.md).

## Purpose

This registry is the canonical active source for `print overall project completeness` style reports. It gathers active v1 gates, Debug page goals, and active implementation backlog items into one proof-honest table while preserving source paths and non-claims.

## Source priority

1. VERSION, package.json, git HEAD
2. active OpenSpec docs under docs/20_architecture_and_specs/openspec/
3. machine-readable proof/gate evaluators under tools/
4. active queues/goal registries under docs/40_backlog_and_tasks/
5. README and table of contents for navigation only
6. audits/status snapshots as supporting context
7. archive docs only for history

## Runtime proof artifact policy

- If `runtime_data/proofs` is absent or incomplete, reports must print `NOT_ENOUGH_LIVE_PROOF_DATA` for live proof scoring.
- Documented Raspberry bundle status may be shown only as a documented-status estimate and must name the source.

## Debug page separation rule

- Debug page documentation/OpenSpec coverage is separate from runtime/UI completeness.
- Do not count `DBG-GOAL-*` runtime/UI behavior as implemented until route/sidebar/panes/actions have code and tests.

## Goal table

| ID | Title | Category | Status | Proof command state | Proof status | Next action |
|---|---|---|---|---|---|---|
| `V1-GATE-001` | Raspberry target tooling and generated fixtures | raspberry_v1_gate | `PROVEN` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep latest Raspberry proof artifacts attached for current runs. |
| `V1-GATE-002` | Install/runtime preflight | raspberry_v1_gate | `PROVEN` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep executable/env preflight evidence current. |
| `V1-GATE-003` | Real iCloud media source | raspberry_v1_gate | `SCAFFOLDED` | `IMPLEMENTED_COMMAND` | `NOT_RUN` | Run/repair real target preflight without leaking secrets. |
| `V1-GATE-004` | Real GPS/geocode provider chain | raspberry_v1_gate | `SCAFFOLDED` | `IMPLEMENTED_COMMAND` | `NOT_RUN` | Run with real provider configuration and cache-first evidence. |
| `V1-GATE-005` | Regular worker product pipeline | raspberry_v1_gate | `CONTRACTED` | `IMPLEMENTED_COMMAND` | `NOT_RUN` | Implement/prove real download/index/GPS/geocode/queue worker path. |
| `V1-GATE-006` | Playback/native display | raspberry_v1_gate | `PROVEN` | `IMPLEMENTED_COMMAND` | `PASSED` | Connect standalone playback proof to real queued media later. |
| `V1-GATE-007` | Address overlay device display | raspberry_v1_gate | `SCAFFOLDED` | `IMPLEMENTED_COMMAND` | `NOT_RUN` | Collect real device display evidence. |
| `V1-GATE-008` | Cron app-running workflow | raspberry_v1_gate | `PARTIAL` | `IMPLEMENTED_COMMAND` | `PARTIAL` | Rerun repaired target pack on Raspberry. |
| `V1-GATE-009` | Dashboard runtime/status view | raspberry_v1_gate | `CONTRACTED` | `PLANNED_COMMAND` | `PLANNED` | Implement proof-backed dashboard status projection and proof. |
| `V1-GATE-010` | Screen worker non-blocking behavior | raspberry_v1_gate | `CONTRACTED` | `PLANNED_COMMAND` | `PLANNED` | Add dedicated screen worker non-blocking proof. |
| `V1-GATE-011` | Docs/OpenSpec reconciliation | raspberry_v1_gate | `PRE_PASS` | `PLANNED_COMMAND` | `PRE_PASS` | Keep static docs audits passing; add final v1 reconciliation proof later. |
| `DBG-GOAL-001` | Add Debug page route | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | UI/router proof later |
| `DBG-GOAL-002` | Add bottom sidebar Debug entry | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | UI/static proof later |
| `DBG-GOAL-003` | Add sidebar version tracker near Debug | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | UI/static proof later |
| `DBG-GOAL-004` | Preserve global top-right version tracker | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | UI/static proof later |
| `DBG-GOAL-005` | Add shared full-width pane template | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Component/render proof later |
| `DBG-GOAL-006` | Add Store and restore state pane | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | State proof later |
| `DBG-GOAL-007` | Add Test playback pane | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Playback action proof later |
| `DBG-GOAL-008` | Add plus-based image process test entry | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Single-entry proof later |
| `DBG-GOAL-009` | Add Crontab Setup pane | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Fake-crontab tests first |
| `DBG-GOAL-010` | Read current crontab content | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Read-only parser proof later |
| `DBG-GOAL-011` | Pause/resume app-owned crontab entries | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Fake-crontab mutation proof later |
| `DBG-GOAL-012` | Install worker crontab intervals | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Fake-crontab install proof later |
| `DBG-GOAL-013` | Require double confirmation under 10 seconds | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Validation/UI proof later |
| `DBG-GOAL-014` | Add Regular Worker Debug Pane | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Telemetry render proof later |
| `DBG-GOAL-015` | Add Playback Worker Debug Pane | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Telemetry render proof later |
| `DBG-GOAL-016` | Add On/off Worker Debug Pane | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Telemetry render proof later |
| `DBG-GOAL-017` | Add worker manual Run now buttons | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Safe invocation proof later |
| `DBG-GOAL-018` | Add Estonian timestamp formatting | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Deterministic formatting test later |
| `DBG-GOAL-019` | Add test data/database isolation proof | debug_page | `SPECIFIED` | `PLANNED_COMMAND` | `PLANNED` | Isolation proof later |
| `DBG-GOAL-020` | Add documentation/proof coverage for Debug page | debug_page | `DOCS_ONLY` | `DOCS_AUDIT` | `PASSED` | Docs tests/audits |
| `IMPL-A1` | Wire concrete pipeline/playback/screen/recovery services behind scheduler host | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-A2` | Decide and implement View A preload/refresh behavior | active_backlog | `NOW` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-B1` | Replace remaining View B simulated surfaces with backend-backed stage/test service flow | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-B2` | Replace hard-coded playback/checkpoint/test values with backend projections | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-C1` | Reconcile View C read-only last-run projection wording | active_backlog | `IMPLEMENTED_READ` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-C2` | Define controlled restore action for View C | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-D1` | Replace View D simulated runtime state with backend projections/worker health | active_backlog | `NOW` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-D2` | Add runtime polling/refresh and start/stop alignment for View D | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-S1` | Implement canonical schema migration order for 9-table baseline | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-S2` | Implement backend-owned writes for stages 2-6 against canonical tables | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-S3` | Introduce runtime_state key/value writes/reads as durable truth surface | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |

## Category summary

| Category | Goal count | Strict proven count | Notes |
|---|---:|---:|---|
| active_backlog | 11 | 0 | Use source/proof fields before scoring. |
| debug_page | 20 | 0 | Debug docs/runtime split required. |
| raspberry_v1_gate | 11 | 3 | Use source/proof fields before scoring. |

## Non-claims

- This registry does not run proof commands by itself.
- It does not include secret-bearing proof artifacts.
- It does not upgrade old status snapshots into current truth.
- It does not turn Debug page documentation into runtime UI proof.
