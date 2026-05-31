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
| IMPL-A1 | Wire concrete pipeline/playback/screen/recovery services behind the already-selected scheduler host. | `placeholder_implementations.md` (A Init gaps/blockers) | Decision-gated |
| IMPL-A2 | Decide and implement View A preload/refresh behavior for init readiness status on entry. | `placeholder_implementations.md` (A data-loading gap) | Now |
| IMPL-B1 | Replace only the remaining View B simulated surfaces with backend-backed stage/test service flow. | `placeholder_implementations.md` (B placeholder logic) | Decision-gated |
| IMPL-B2 | Replace remaining hard-coded playback/checkpoint/test values in View B with backend projections where those projections exist. | `placeholder_implementations.md` (B real code needed) | Decision-gated |
| IMPL-C1 | Reconcile View C read-only last-run projection and remove stale demo-only wording from operator docs. The durable read path now exists through `/api/runtime/orchestration/last`; the remaining work is restore semantics, not read semantics. | `placeholder_implementations.md` reconciliation against current code/tests | Implemented-read / cleanup-only |
| IMPL-C2 | Define and implement a controlled restore action for View C using a backend restore contract; keep the resume button non-operational until this is approved. | `placeholder_implementations.md` (C required behavior) | Decision-gated |
| IMPL-D1 | Replace View D local simulated runtime state as canonical path with backend runtime projections and worker health surfaces. | `placeholder_implementations.md` (D placeholder logic) | Now / design-first |
| IMPL-D2 | Add runtime polling/refresh and complete start/stop control path alignment for View D after the projection schema is fixed. | `placeholder_implementations.md` (D contract mismatch) | Decision-gated |
| IMPL-S1 | Implement canonical schema migration order for the proposed 9-table baseline when runtime persistence rollout is approved. | `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md` (migration path/order) | Decision-gated |
| IMPL-S2 | Implement backend-owned writes for Stages 2-6 against canonical tables after schema migration. | `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md` (conceptual migration step 2) | Decision-gated |
| IMPL-S3 | Introduce `runtime_state` key/value writes/reads as durable runtime truth surface. | `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md` (runtime state model) | Decision-gated |

## Decision gates (must be answered before gated tasks)
Decision gates are sourced from `docs_to_parse/VISION_SPEC/16-unresolved-questions.md` plus current code/test reconciliation:
- View C restore/action semantics decision. The read-only last-run source is now `/api/runtime/orchestration/last`; do not reopen the old demo-only read-path task.
- View D runtime projection model decision (locks vs DB vs logs vs combined projection).
- View B orchestration model decision (frontend sequential vs backend orchestration canonical path).
- Runtime truth partition decision (`SQLite` vs lock files vs logs vs `conf/runtime-truth.json`). `conf/runtime-truth.json` remains an uncommitted local runtime file in the current ZIP lineage and must not be treated as committed product truth.
- Scheduler platform decision (Windows role, Linux/Raspberry Pi canonical target, install vs print-only behavior).
- Auth/session and interactive 2FA flow decisions needed for real-provider behavior.

## Conflict / reduction notes
- No new implementation tasks were added beyond documentation evidence.
- Slice 5 reconciled stale backlog wording against current code evidence: View C has a read-only backend load path, geocode has a cache-first provider registry, and GPS has local/offline fallback providers.
- View E extension work was excluded from active backlog because `placeholder_implementations.md` marks current bounded scope as implemented.
- Workflow-only repair plans were not imported as implementation authority.

## Migration status
| Source | Migration result |
|---|---|
| `placeholder_implementations.md` | Active unimplemented items for A/B/C/D and runtime backend captured; implemented-only E scope removed. |
| `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md` | Proposed migration phases captured as gated implementation tasks; non-goal/deferred table families kept out of active work. |
| `docs_to_parse/VISION_SPEC/16-unresolved-questions.md` | Converted to explicit decision gates that block risky runtime/auth/scheduler changes. |


## 2026-05-06 backlog update after NEW AUTH Slice 10

NEW AUTH Slices 1–10 are no longer active implementation backlog items. The completed scope includes the frontend shell, endpoint family, provider-proof status, 2FA diagnostics, 2FA submission, safe login start, logout/session removal, test-download proof, UI/event diagnostics, and closure audit.

Do not reopen NEW AUTH as generic missing work unless new evidence shows a regression. Future tasks should be narrower, such as provider-specific hardening, additional tests, or UX refinements.

Active implementation backlog that remains outside NEW AUTH:

1. Prove real iCloudPD download through Index, GPS parsing, Geocode, Queue, and Playback Select before changing the download contract.
2. Prove one real reverse-geocode provider behind the cache-first provider registry while keeping network providers disabled by default.
3. Prove the added GPS metadata fallbacks against real/operator-provided media and sidecar examples.
4. Replace scheduler host placeholder-service mode with real pipeline/playback/screen/recovery worker services.
5. Decide and implement the View C restore/resume backend contract; the read-only last-run path is no longer the main gap.
6. Wire View D to a backend-owned live runtime monitor.
7. Prove live environment isolation before destructive smoke tests.


## Slice 5 backlog reconciliation — 2026-05-30 21:35 EEST

This reconciliation keeps the backlog aligned with the current repo state after typecheck stabilization, GPS fallback providers, geocode provider docs, and documentation slices 1-4.

| Area | Previous wording risk | Current repo-backed interpretation | Action |
|---|---|---|---|
| View C last-run read path | Suggested the durable read path was still missing. | `/api/runtime/orchestration/last` is now the read-only last-run source used by View C. | Mark read-path work as implemented/cleanup-only; keep restore as the actual missing behavior. |
| Geocode | Suggested the only meaningful behavior was deterministic placeholder output. | Cache-first reverse-geocode provider registry exists; network providers are disabled by default and still need runtime proof. | Reword as provider activation/proof gap, not provider-boundary absence. |
| GPS parsing | Suggested the parser had only EXIF breadth. | EXIF-first provider chain now includes JSON, XMP, text sidecar, filename-token, and path-token fallback providers. | Reword as runtime fixture/proof gap, not architecture absence. |
| Scheduler/runtime | Suggested scheduler host itself was only a heartbeat shell. | Target selection and host semantics exist; concrete worker/service commands and proof remain the gap. | Keep service execution and Raspberry power-loss proof as active work. |
| View D | Local simulated preview remains the canonical surface. | No backend-owned runtime monitor is wired to the view yet. | Keep as active implementation candidate. |

Do not use old backlog entries to reintroduce already-implemented provider-boundary work. Future implementation should focus on runtime proof, controlled restore semantics, worker health projections, and Raspberry recovery evidence.
