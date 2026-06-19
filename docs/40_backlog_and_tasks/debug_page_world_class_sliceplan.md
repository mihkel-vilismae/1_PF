# Debug Page World-Class Batch / Slice Plan

Status: planning/OpenSpec track generated in v0.8.201.

Baseline: v0.8.200 (`060e0e7`).

Target: Debug page OpenSpec 85%+ and implementation 85%+ before separate real-provider/recovery behavior work.

## 3+2ACR generation result

| Pass | Result |
|---|---|
| Analyze | Current Debug page has structure/IDs/keybook, but needs stronger visual system, behavior registry, proof input panel, and completion rubric. |
| Critique | “World-class” is subjective unless scored through an OpenSpec rubric and proofable UI contracts. |
| Refine | Use the max requested scope: 4 batches, 18 slices, with behavior definitions before real behavior implementation. |
| Implement plan | Generate OpenSpec world-class contract, batch/slice plan JSON/MD, and proof. |
| Verify plan | Proof checks 4 batches, 18 slices, required visual toggle terms, proof input contract, and non-claim boundaries. |

## Summary

| Field | Value |
|---|---:|
| Batch count | 4 |
| Slice count | 18 |
| Confidence | Medium |
| Suggested run mode | One batch, one slice after another, with ACR per slice |

## DBG-WC-BATCH-1 — OpenSpec + behavior contract foundation

Goal: Raise Debug page OpenSpec to a precise 85%+ contract before more UI work.

| Order | Slice ID | Title | Difficulty | Importance | Result |
|---:|---|---|---:|---:|---|
| 1 | `DBG-WC-001` | Define world-class Debug acceptance rubric | 3/10 | 10/10 | Add measurable 85%/95% criteria for visuals, behavior, proof, non-claims. |
| 2 | `DBG-WC-002` | Define visual toggle contract | 4/10 | 9/10 | Specify top-right Toggle Visuals label and two [1,2,3] controls. |
| 3 | `DBG-WC-003` | Define behavior state contract for every pane/button | 6/10 | 10/10 | Every action must be local/mock/blocked/planned-safe/real-provider/runtime. |
| 4 | `DBG-WC-004` | Define proof input/output contract | 5/10 | 9/10 | Document proof-run inputs, expected artifacts, and what is safe to upload. |

## DBG-WC-BATCH-2 — Visual system runtime polish

Goal: Implement a strong visual foundation with selectable color/visual modes while preserving proofability.

| Order | Slice ID | Title | Difficulty | Importance | Result |
|---:|---|---|---:|---:|---|
| 5 | `DBG-WC-005` | Implement top-right Toggle Visuals toolbar | 5/10 | 10/10 | Place label/buttons next to version without breaking existing version tracker. |
| 6 | `DBG-WC-006` | Implement color schema cycle [1,2,3] | 6/10 | 9/10 | Three color schemes, persisted in browser-local state, proofable by rendered attributes. |
| 7 | `DBG-WC-007` | Implement major visual change cycle [1,2,3] | 7/10 | 9/10 | Three layout/intensity modes that visibly improve hierarchy. |
| 8 | `DBG-WC-008` | Polish cards, spacing, typography, badges | 7/10 | 8/10 | Make panes clean, readable, and operator-friendly. |
| 9 | `DBG-WC-009` | Polish responsive layout and accessibility | 7/10 | 9/10 | Keyboard/focus, aria labels, small-screen behavior, readable contrast. |

## DBG-WC-BATCH-3 — Behavior implementation and safe interaction contracts

Goal: Make defined local/planned-safe behaviors explicit and proofable without claiming real provider/runtime behavior.

| Order | Slice ID | Title | Difficulty | Importance | Result |
|---:|---|---|---:|---:|---|
| 10 | `DBG-WC-010` | Implement behavior registry visible on page | 6/10 | 9/10 | Every button shows what it does, reality level, and proof state. |
| 11 | `DBG-WC-011` | Implement Auth/Session planned-safe control states | 6/10 | 9/10 | Login/check/verify targets visible but safe until auth contract exists. |
| 12 | `DBG-WC-012` | Implement snapshot controls as explicit local/system-state draft | 7/10 | 9/10 | Pre/post manual-test state preview, no production recovery claim. |
| 13 | `DBG-WC-013` | Implement proof input panel | 6/10 | 8/10 | Shows what proofrunner needs and what operator should upload. |
| 14 | `DBG-WC-014` | Implement error/blocked/pass visual language | 5/10 | 9/10 | Consistent status chips for PASS/BLOCKED/FAILED and non-claim messages. |

## DBG-WC-BATCH-4 — Proof closure, docs cleanup, and world-class hardening

Goal: Close the Debug page world-class track at 85%+ implementation with proofs/docs aligned.

| Order | Slice ID | Title | Difficulty | Importance | Result |
|---:|---|---|---:|---:|---|
| 15 | `DBG-WC-015` | Strengthen keybook-render proof | 5/10 | 10/10 | Prove keybook IDs, markers, modal, elements list, visual toolbar all match. |
| 16 | `DBG-WC-016` | Add screenshot/style proof contract | 7/10 | 8/10 | Optional browser/screenshot or source-level visual contract; honest if not run. |
| 17 | `DBG-WC-017` | Run docs/OpenSpec/keybook reconciliation | 4/10 | 9/10 | No stale planned claims or mismatched behavior statuses. |
| 18 | `DBG-WC-018` | World-class Debug page completion report | 4/10 | 10/10 | Score OpenSpec and implementation against 85% rubric, print blockers. |


## Batch 1–3 implementation note

Implemented through v0.8.215:

- Batch 1: rubric, visual toggle contract, behavior taxonomy, proof input contract.
- Batch 2: top-right Toggle Visuals toolbar, color schema cycle, major visual mode cycle, visual polish, responsive/focus polish.
- Batch 3: behavior registry, Auth/Session planned-safe states, SYSTEM_STATE draft controls, proof input panel, PASS/BLOCKED/FAILED visual language.

Batch 4 remains planned for stronger render proof, screenshot/style proof, reconciliation, and completion reporting.
