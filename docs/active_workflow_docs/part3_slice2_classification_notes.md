# Part 3 Slice 2 — Classification Notes

## Purpose

This file records how Slice 2 generated the first complete documentation truth matrix. It is intentionally not the final reconciliation report.

## Prompt analysis

The Slice 2 prompt needs to classify all docs without moving or rewriting them. The right scope is broad enough to include active workflow docs and old docs, but shallow enough to avoid pretending that every claim has been deeply proven.

## Critique

- A single-pass classification can overstate confidence if it treats file path heuristics as proof.
- `docs/OLD_DOCS/` may contain still-accurate content, so old location alone is not enough to call a file stale.
- Active workflow docs should be considered current for this workflow, but not necessarily authoritative for product/runtime behavior.
- Endpoint and schema mentions require deeper exact-match checks in Slice 3.

## Refined Slice 2 prompt

```text
Run Slice 2 of Part 3 for DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF.

Use the post-Slice-1 12_PF v0.3.24 repo state as the immutable snapshot. Ensure Slice 1 generated files are present under docs/active_workflow_docs/.

Generate docs/active_workflow_docs/part3_documentation_truth_matrix.md and docs/active_workflow_docs/part3_slice2_classification_notes.md.

For every documentation file in scope, include path, area, LOC, first headings, surface purpose, primary classification, secondary labels, repo evidence checked, documentation evidence, recommended action, and confidence.

Do not delete, move, rewrite existing docs, modify production code, or update version metadata in Slice 2. Preserve behavior.
```

## Classification rules used

- Root `CHANGELOG.md` is treated as authoritative/current because it is the project version history.
- `HOW_TO_RUN.md` is marked current but incomplete when very short and requiring regeneration.
- `docs/active_workflow_docs/` files are current for this workflow.
- `docs/OLD_DOCS/` files are old but still useful unless deeper evidence proves they are stale or contradictory.
- Task docs are old but useful handoff/reference material and likely merge candidates.
- Current `docs/` files are usually current but incomplete until exact implementation/schema/test verification is completed.

## Count summary

| Classification | Count |
|---|---:|
| old but still useful | 61 |
| current but incomplete | 16 |
| authoritative/current | 12 |
| stale/outdated | 1 |
| **Total** | **90** |

## Next Slice 3 focus

Slice 3 should use this matrix to decide source-of-truth candidates, merge candidates, archive policy, and exact contradiction hotspots. It should not move or delete docs yet.
