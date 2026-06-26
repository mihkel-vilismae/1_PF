# V2 Real Playback OpenSpec Coverage 3+2 ACR Review

Estonian timestamp: 2026-06-26 11:05 EEST

## Purpose

This audit records the 3+2 ACR review used to strengthen OpenSpec coverage before the code inventory and implementation phases for V2 real playback.

## ACR passes

| Pass | Finding | Resulting documentation update |
| --- | --- | --- |
| A1 — extract requirements | The V2 docs already defined goals/pages, but not enough implementation gates. | Added coverage gate, page acceptance matrix, proof matrix, and inventory requirements to `v2_operator_pages_openspec.md`. |
| C1 — critique duplication risk | Copy-paste HTML remains the main architecture risk. | Added reusable component extraction checklist and prohibited implementation patterns. |
| R1 — refine sequencing | The next step should be inventory, not UI. | Added next OpenSpec-to-code handoff requirements. |
| C2 — critique status drift | JSON, Markdown, and overlay can drift. | Added JSON schema contract and sync checklist. |
| R2 — refine proof coverage | Existing endpoint tests do not prove V2 placement. | Added endpoint + frontend button + response handling + final proof matrices. |

## Coverage improvements made

| Document | Coverage added |
| --- | --- |
| `docs/20_architecture_and_specs/openspec/v2_operator_pages_openspec.md` | 3+2 ACR coverage section, status JSON schema, page acceptance criteria, proof matrix, prohibited implementation patterns, next handoff. |
| `docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md` | Status vocabulary, required JSON fields, inventory template, synchronization checklist. |
| `docs/20_architecture_and_specs/openspec/V2_IssueRegister.md` | Added issues for JSON location, status drift, inventory, response tests, address toggle, proof harness, disabled test controls, and cron defaults. |
| `docs/20_architecture_and_specs/openspec/V2_GoalSummary.md` | Added summary of the OpenSpec coverage expansion and inventory-first rule. |
| `docs/table_of_contents.md` and README indexes | Added this audit as a discoverable documentation artifact. |

## Non-claims

This audit does not claim that V2 UI/runtime behavior is implemented. It only improves the OpenSpec contract so later implementation has clearer gates.

## Next required step

Perform the code inventory/reuse map pass and update `V2_ImplementationStatus.md` with actual discovered component sources, endpoints, tests/proofs, extraction decisions, and status JSON IDs before adding UI.
