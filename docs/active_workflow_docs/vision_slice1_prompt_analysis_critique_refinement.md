# Vision/Specification Slice 1 — Prompt Analysis, Critique, and Refined Prompt

Timestamp: 2026-04-26 19:47 EEST

## Analysis

The requested Slice 1 is an evidence-establishment slice, not a writing-heavy final specification slice. The safest way to run it is to inventory the documentation corpus, inspect repo-local skills, verify a small set of implementation anchors from the full repository, and create a new authority map that future slices can build on.

The added requirement is important: deprecated and superseded documents must not only be classified inside the authority map, but also recorded in a dedicated new markdown log file so later relocation/deletion decisions are auditable.

## Critique

The broad 3-slice prompt is strong, but Slice 1 needs extra precision:

1. It should not move or delete documents yet.
2. It should avoid overclaiming that older docs are wrong simply because they live under `docs/OLD_DOCS/`.
3. It should use existing repo-local skills when relevant, but the available skills are View/button-specific, so they are supporting evidence rather than perfect documentation-reconciliation engines.
4. It should record deprecated/superseded candidates separately from unresolved questions.
5. It should update version/changelog metadata because this repository has an explicit forward-only versioning policy.

## Refined Slice 1 Prompt Used

```text
Run Slice 1 of the up-to-date vision/specification documentation workflow for the 12_PF / 1_PF photo-frame dashboard repository.

Use the docsonly ZIP as the primary documentation evidence source and the full repo ZIP as the implementation verification source.

Strict requirements:
- Snapshot-safe.
- Regression-intolerant.
- Documentation-only.
- Preserve git history.
- One logical commit.
- Do not permanently delete or move documentation files in Slice 1.
- Use suitable repo-local skills when available.
- Record which skills were inspected and used.
- Do not invent implementation status.
- Mark unknowns and contradictions explicitly.
- Add a dedicated markdown log for deprecated/superseded documentation candidates.

Actions:
1. Inspect `.codex/skills/` and active workflow docs.
2. Confirm VERSION, package metadata, changelog policy, docs structure, and repo history.
3. Inventory markdown documentation with path, LOC, last modified time, heading sample, classification, and recommended action.
4. Verify only the implementation anchors needed for Slice 1: API route table, tests folder, schema file, dashboard/server folder presence, auth/scheduler/runtime code presence.
5. Create `docs/vision_and_implementation/README.md`.
6. Create `docs/vision_and_implementation/DOCUMENTATION_AUTHORITY_MAP.md`.
7. Create `docs/vision_and_implementation/UNRESOLVED_QUESTIONS.md`.
8. Create `docs/vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md`.
9. Create `docs/vision_and_implementation/reconciliation/SLICE1_SOURCE_INVENTORY_REPORT.md`.
10. Update changelog/version metadata according to repository policy.
11. Run available documentation/package checks that are safe for a documentation-only slice.
12. Commit as `docs: add vision documentation authority map`.
```
