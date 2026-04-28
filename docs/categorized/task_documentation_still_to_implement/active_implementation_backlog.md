# Active Implementation Backlog

## Purpose
Track still-actionable implementation work extracted from authoritative implementation/task docs, excluding tasks that conflict with current authority-map tiering.

## Absorbed source docs
- `placeholder_implementations.md`
- `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md`
- `docs_to_parse/VISION_SPEC/16-unresolved-questions.md`

## Task status rules
- `Now`: can be implemented immediately based on current documentation.
- `Decision-gated`: valid task, but blocked until specific unresolved-question decisions are made.
- `Deferred`: acknowledged but explicitly not part of current bounded implementation slice.

## Backlog tasks
| ID | Task | Source basis | Status |
|---|---|---|---|
| IMPL-A1 | Wire real runtime services behind View A scheduler host (current host is heartbeat/tick shell). | `placeholder_implementations.md` (A Init gaps/blockers) | Decision-gated |
| IMPL-A2 | Decide and implement View A preload/refresh behavior for init readiness status on entry. | `placeholder_implementations.md` (A data-loading gap) | Now |
| IMPL-B1 | Replace View B timer/fabricated stage outputs with backend-backed stage/test service flow. | `placeholder_implementations.md` (B placeholder logic) | Decision-gated |
| IMPL-B2 | Replace hard-coded playback/checkpoint/test values in View B with backend projections. | `placeholder_implementations.md` (B real code needed) | Decision-gated |
| IMPL-C1 | Implement durable `last-run` snapshot read path for View C and remove demo-only seeded path from canonical operator flow. | `placeholder_implementations.md` (C placeholder logic) | Decision-gated |
| IMPL-C2 | Implement controlled restore action for View C using backend restore contract. | `placeholder_implementations.md` (C required behavior) | Decision-gated |
| IMPL-D1 | Replace View D local simulated runtime state as canonical path with backend runtime projections and worker health surfaces. | `placeholder_implementations.md` (D placeholder logic) | Decision-gated |
| IMPL-D2 | Add runtime polling/refresh and complete start/stop control path alignment for View D. | `placeholder_implementations.md` (D contract mismatch) | Decision-gated |
| IMPL-S1 | Implement canonical schema migration order for the proposed 9-table baseline when runtime persistence rollout is approved. | `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md` (migration path/order) | Decision-gated |
| IMPL-S2 | Implement backend-owned writes for Stages 2-6 against canonical tables after schema migration. | `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md` (conceptual migration step 2) | Decision-gated |
| IMPL-S3 | Introduce `runtime_state` key/value writes/reads as durable runtime truth surface. | `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md` (runtime state model) | Decision-gated |

## Decision gates (must be answered before gated tasks)
Decision gates are sourced from `docs_to_parse/VISION_SPEC/16-unresolved-questions.md`:
- View C source-of-truth endpoint/projection decision.
- View D runtime projection model decision (locks vs DB vs logs vs combined projection).
- View B orchestration model decision (frontend sequential vs backend orchestration canonical path).
- Runtime truth partition decision (`SQLite` vs lock files vs logs vs `conf/runtime-truth.json`).
- Scheduler platform decision (Windows role, Linux/Raspberry Pi canonical target, install vs print-only behavior).
- Auth/session and interactive 2FA flow decisions needed for real-provider behavior.

## Conflict / reduction notes
- No new implementation tasks were added beyond documentation evidence.
- View E extension work was excluded from active backlog because `placeholder_implementations.md` marks current bounded scope as implemented.
- Workflow-only repair plans were not imported as implementation authority.

## Migration status
| Source | Migration result |
|---|---|
| `placeholder_implementations.md` | Active unimplemented items for A/B/C/D and runtime backend captured; implemented-only E scope removed. |
| `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md` | Proposed migration phases captured as gated implementation tasks; non-goal/deferred table families kept out of active work. |
| `docs_to_parse/VISION_SPEC/16-unresolved-questions.md` | Converted to explicit decision gates that block risky runtime/auth/scheduler changes. |
