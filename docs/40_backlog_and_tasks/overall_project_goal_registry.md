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
- Count `DBG-GOAL-001` through `DBG-GOAL-019` as implemented only through the local Debug runtime proof lane; this still does not imply real Raspberry, crontab, production media/database, provider, worker-process, or hardware proof.

## Goal table

| ID | Title | Category | Status | Proof command state | Proof status | Next action |
|---|---|---|---|---|---|---|
| `V1-GATE-001` | Raspberry target tooling and generated fixtures | raspberry_v1_gate | `PROVEN` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep latest Raspberry proof artifacts attached for current runs. |
| `V1-GATE-002` | Install/runtime preflight | raspberry_v1_gate | `PROVEN` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep executable/env preflight evidence current. |
| `V1-GATE-003` | Real iCloud media source | raspberry_v1_gate | `SCAFFOLDED` | `IMPLEMENTED_COMMAND` | `NOT_RUN` | Run/repair real target preflight without leaking secrets; local boundary and auth-checkpoint proofs now exist. |
| `V1-GATE-004` | Real GPS/geocode provider chain | raspberry_v1_gate | `SCAFFOLDED` | `IMPLEMENTED_COMMAND` | `NOT_RUN` | Run with real provider configuration and cache-first evidence. |
| `V1-GATE-005` | Regular worker product pipeline | raspberry_v1_gate | `CONTRACTED` | `IMPLEMENTED_COMMAND` | `NOT_RUN` | Implement/prove real download/index/GPS/geocode/queue worker path after staged product contract remains passing. |
| `V1-GATE-006` | Playback/native display | raspberry_v1_gate | `PROVEN` | `IMPLEMENTED_COMMAND` | `PASSED` | Connect standalone playback proof to real queued media later. |
| `V1-GATE-007` | Address overlay device display | raspberry_v1_gate | `SCAFFOLDED` | `IMPLEMENTED_COMMAND` | `NOT_RUN` | Collect real device display evidence. |
| `V1-GATE-008` | Cron app-running workflow | raspberry_v1_gate | `PARTIAL` | `IMPLEMENTED_COMMAND` | `PARTIAL` | Rerun repaired target pack on Raspberry. |
| `V1-GATE-009` | Dashboard runtime/status view | raspberry_v1_gate | `PRE_PASS` | `IMPLEMENTED_COMMAND` | `PRE_PASS` | Local projection pre-pass exists; final Raspberry dashboard status proof still required. |
| `V1-GATE-010` | Screen worker non-blocking behavior | raspberry_v1_gate | `CONTRACTED` | `IMPLEMENTED_COMMAND` | `PRE_PASS` | Use scheduler host boundary/mock as design pre-pass before real screen-worker non-blocking proof. |
| `V1-GATE-011` | Docs/OpenSpec reconciliation | raspberry_v1_gate | `PRE_PASS` | `PLANNED_COMMAND` | `PRE_PASS` | Keep static docs audits passing; add final v1 reconciliation proof later. |
| `DBG-GOAL-001` | Add Debug page route | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep Debug route runtime proof passing; no Raspberry/provider proof implied. |
| `DBG-GOAL-002` | Add bottom sidebar Debug entry | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep sidebar Debug entry runtime proof passing. |
| `DBG-GOAL-003` | Add sidebar version tracker near Debug | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep sidebar version tracker bound to the app version source. |
| `DBG-GOAL-004` | Preserve global top-right version tracker | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep global top-right version tracker preserved during later UI work. |
| `DBG-GOAL-005` | Add shared full-width pane template | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep shared Debug pane render proof passing before backend wiring. |
| `DBG-GOAL-006` | Add Store and restore state pane | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | State pane is local/planned-safe only; backend restore contract remains future. |
| `DBG-GOAL-007` | Add Test playback pane | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Test playback pane is local/planned-safe only; native playback remains future. |
| `DBG-GOAL-008` | Add plus-based image process test entry | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep plus-based isolated test-media proof passing; production media untouched. |
| `DBG-GOAL-009` | Add Crontab Setup pane | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep fake Crontab Setup pane proof passing; real crontab unavailable. |
| `DBG-GOAL-010` | Read current crontab content | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep read-only fake crontab parser proof passing. |
| `DBG-GOAL-011` | Pause/resume app-owned crontab entries | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep fake pause/resume mutation proof passing; unrelated rows preserved. |
| `DBG-GOAL-012` | Install worker crontab intervals | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep fake install proof passing; real install remains unavailable. |
| `DBG-GOAL-013` | Require double confirmation under 10 seconds | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep high-frequency/double-confirmation block proof passing. |
| `DBG-GOAL-014` | Add Regular Worker Debug Pane | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep Regular Worker mock telemetry render proof passing. |
| `DBG-GOAL-015` | Add Playback Worker Debug Pane | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep Playback Worker mock telemetry render proof passing. |
| `DBG-GOAL-016` | Add On/off Worker Debug Pane | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep On/off Worker mock telemetry render proof passing. |
| `DBG-GOAL-017` | Add worker manual Run now buttons | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep safe Run now mock proof passing; no worker process spawned. |
| `DBG-GOAL-018` | Add Estonian timestamp formatting | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep deterministic Estonian timestamp formatting proof passing. |
| `DBG-GOAL-019` | Add test data/database isolation proof | debug_page | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep isolation proof passing; no production database/media mutation. |
| `DBG-GOAL-020` | Add documentation/proof coverage for Debug page | debug_page | `DOCS_ONLY` | `DOCS_AUDIT` | `PASSED` | Docs tests/audits |
| `IMPL-A1` | Wire concrete pipeline/playback/screen/recovery services behind scheduler host | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-A2` | Decide and implement View A preload/refresh behavior | active_backlog | `IMPLEMENTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep View A Test/Real mode refresh safety proof passing. |
| `IMPL-B1` | Replace remaining View B simulated surfaces with backend-backed stage/test service flow | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-B2` | Replace hard-coded playback/checkpoint/test values with backend projections | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-C1` | Reconcile View C read-only last-run projection wording | active_backlog | `CLEANUP_ONLY` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep View C read-only restore wording proof passing. |
| `IMPL-C2` | Define controlled restore action for View C | active_backlog | `CONTRACTED` | `IMPLEMENTED_COMMAND` | `PASSED` | Future real restore remains blocked until backend/proof mutation contract is implemented. |
| `IMPL-D1` | Replace View D simulated runtime state with backend projections/worker health | active_backlog | `IMPLEMENTED_READ` | `IMPLEMENTED_COMMAND` | `PASSED` | Keep View D/status projection proof passing; Raspberry live scoring remains separate. |
| `IMPL-D2` | Add runtime polling/refresh and start/stop alignment for View D | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-S1` | Implement canonical schema migration order for 9-table baseline | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-S2` | Implement backend-owned writes for stages 2-6 against canonical tables | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |
| `IMPL-S3` | Introduce runtime_state key/value writes/reads as durable truth surface | active_backlog | `DECISION_GATED` | `NONE` | `NOT_APPLICABLE` | Resolve decision gate or implement only after matching spec/proof update. |

## Category summary

| Category | Goal count | Strict proven count | Notes |
|---|---:|---:|---|
| active_backlog | 11 | 0 | Local status/View A/View C/restore-contract pre-passes are recorded; decision-gated product work remains separate. |
| debug_page | 20 | 0 | `DBG-GOAL-001`-`DBG-GOAL-019` are implemented with `proof:debug-page-runtime`; strict proven count remains 0 because live Raspberry/provider/hardware proof is separate. |
| raspberry_v1_gate | 11 | 3 | V1 dashboard/screen rows now have local pre-pass proof; strict Raspberry proof still requires live target artifacts. |

## Non-claims

- This registry does not run proof commands by itself.
- It does not include secret-bearing proof artifacts.
- It does not upgrade old status snapshots into current truth.
- It does not turn Debug page documentation into runtime UI proof.
