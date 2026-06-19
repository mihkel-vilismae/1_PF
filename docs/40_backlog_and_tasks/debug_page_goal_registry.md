# Debug Page Goal Registry

Status: active goal registry for planned Debug page work.  
Version introduced: 0.8.131.  
Related OpenSpec: [`../20_architecture_and_specs/openspec/debug_page_openspec.md`](../20_architecture_and_specs/openspec/debug_page_openspec.md).  
Related runbook: [`../10_runbooks/debug_page_runbook.md`](../10_runbooks/debug_page_runbook.md).

## Purpose

Use this registry to regularly add, refine, and track Debug page goals as implementation approaches. This prevents voice/chat planning notes from becoming lost or being mistaken for proof.

Statuses:

- `idea`: captured but not specified.
- `specified`: covered by OpenSpec/runbook.
- `implementation-planned`: ready for a slice plan.
- `implemented`: code/docs changed, but proof may still be pending.
- `proven`: proof/test/runtime evidence exists.
- `blocked`: cannot proceed until a dependency is resolved.

## Initial goals

| Goal ID | Title | Area | Status | OpenSpec section | Proof/evidence expectation | Risk notes |
|---|---|---|---|---|---|---|
| DBG-GOAL-001 | Add Debug page route | Navigation | specified | 3.1 | UI/router proof later | Route must follow existing router conventions. |
| DBG-GOAL-002 | Add bottom sidebar Debug entry | Navigation | specified | 3.2 | UI/static proof later | Must preserve existing navigation. |
| DBG-GOAL-003 | Add sidebar version tracker near Debug | Version/UI | specified | 3.3 | UI/static proof later | Must use real version source, not hard-coded stale value. |
| DBG-GOAL-004 | Preserve global top-right version tracker | Version/UI | specified | 3.4 | UI/static proof later | Must not confuse top-left context label with version tracker. |
| DBG-GOAL-005 | Add shared full-width pane template | UI layout | specified | 4 | Component/render proof later | Keep page lightweight and stacked. |
| DBG-GOAL-006 | Add Store and restore state pane | Recovery/state | specified, semantics TODO | 5 | State proof later | Exact state definition still missing. |
| DBG-GOAL-007 | Add Test playback pane | Playback | specified | 6 | Playback action proof later | Must define test/native boundary. |
| DBG-GOAL-008 | Add plus-based image process test entry | Test pipeline | specified | 7 | Single-entry proof later | Must not mutate production DB/media. |
| DBG-GOAL-009 | Add Crontab Setup pane | Scheduler | specified | 8 | Fake-crontab tests first | Real crontab mutation is safety-sensitive. |
| DBG-GOAL-010 | Read current crontab content | Scheduler | specified | 8.1 | Read-only parser proof later | Must distinguish app-owned entries. |
| DBG-GOAL-011 | Pause/resume app-owned crontab entries | Scheduler | specified | 8.2 | Fake-crontab mutation proof later | Must preserve unrelated entries. |
| DBG-GOAL-012 | Install worker crontab intervals | Scheduler | specified | 8.3 | Fake-crontab install proof later | Must use pending warning before final install. |
| DBG-GOAL-013 | Require double confirmation under 10 seconds | Scheduler safety | specified | 8.4 | Validation/UI proof later | Prevent runaway high-frequency workers. |
| DBG-GOAL-014 | Add Regular Worker Debug Pane | Worker telemetry | specified | 9 | Telemetry render proof later | Timestamp/count semantics must be clear. |
| DBG-GOAL-015 | Add Playback Worker Debug Pane | Worker telemetry | specified | 9 | Telemetry render proof later | Avoid confusing playback proof with worker call proof. |
| DBG-GOAL-016 | Add On/off Worker Debug Pane | Worker telemetry | specified | 9 | Telemetry render proof later | Screen/power controls need safety boundaries. |
| DBG-GOAL-017 | Add worker manual Run now buttons | Worker actions | specified | 9.3 | Safe invocation proof later | Must avoid unsafe concurrent duplicate runs. |
| DBG-GOAL-018 | Add Estonian timestamp formatting | Worker telemetry | specified | 9.1 | Deterministic formatting test later | Formatting must be stable in tests. |
| DBG-GOAL-019 | Add test data/database isolation proof | Test safety | specified | 7, 13 | Isolation proof later | Test flows must not mutate production data. |
| DBG-GOAL-020 | Add documentation/proof coverage for Debug page | Governance | specified | 13, 14 | Docs tests/audits | Docs must not claim runtime proof. |

## Suggested implementation slice order

1. Documentation/OpenSpec/goal registry.
2. Static route and sidebar entry.
3. Shared debug pane component.
4. Version tracker reuse.
5. Static panes with planned/blocked statuses.
6. Worker telemetry display using mock/test data.
7. Crontab parser/preview against fake content.
8. Pause/resume app-owned block in fake-crontab tests.
9. Pending install warning and double-confirmation UI.
10. Manual worker run mock/proof path.
11. Real Raspberry crontab proof gate.

## Registry update rule

When a new Debug page goal is discovered:

1. Add a new stable `DBG-GOAL-###` row.
2. Mark its status honestly.
3. Link the OpenSpec section or write `TBD`.
4. Add safety/proof notes before implementation.
5. Do not mark `proven` without tests, generated artifacts, or target evidence.

| DBG-GOAL-021 | Add Debug Page Keybook skill and repo inventory seed | Governance/keybook | specified | Keybook | `proof:debug-page-keybook` | Must map panes/buttons to files/docs/tests/proofs/non-claims. |
| DBG-GOAL-022 | Add stable UI element IDs and `*` marker overlay | Element inventory | planned | Keybook follow-up | UI runtime proof later | Keybook seeds IDs now; rendered attributes and marker behavior come in a later slice. |
| DBG-GOAL-023 | Render Debug Help, Stack/Status, Elements list, and Auth/Session planning panes | Debug page runtime/keybook | proven | Help/Stack/Element inventory | `proof:debug-page-runtime`, `proof:debug-page-keybook` | Auth/Session controls are visible as disabled/planned-safe targets only; no provider login/session read is performed. |

## v0.8.200 runtime keybook UI update

The Debug page now renders Help, Stack/Status, Elements/Buttons list, and Auth/Session panes before the legacy debug controls. Implemented panes/buttons have stable `data-ui-element-id` attributes, and inspectable elements expose a `*` marker with hover tooltip and click-to-open local metadata dialog. This remains browser-local/proof-safe and does not claim real provider, crontab, worker, media/database, Raspberry, or recovery behavior.
