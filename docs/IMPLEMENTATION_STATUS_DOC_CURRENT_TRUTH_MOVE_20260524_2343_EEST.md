# Implementation Status — Current Truth Documentation Move

Estonian timestamp: 2026-05-24 23:43 EEST

## Scope

Implemented the first physical documentation grouping slice. This slice moved only the canonical NEW AUTH Evidence Pack guide into the `docs/00_current_truth/` target folder.

## Files moved or added

- Moved canonical content from `docs/AUTH_EVIDENCE_PACK.md` to `docs/00_current_truth/AUTH_EVIDENCE_PACK.md`.
- Replaced `docs/AUTH_EVIDENCE_PACK.md` with a compatibility pointer so older links continue to work.
- Updated `docs/00_current_truth/README.md` to list the canonical current-truth document.
- Updated `docs/DOC_INDEX.md`, `docs/DOC_FRESHNESS_MATRIX.md`, and `docs/DOC_REORGANIZATION_PLAN.md` to reflect the canonical path and compatibility pointer.

## Preserved

- Existing source code was not changed.
- No historical, backlog, status-snapshot, audit, vision/spec, root, category-index, or tool-local documentation was moved.
- Existing links to `docs/AUTH_EVIDENCE_PACK.md` remain valid through the compatibility pointer.
- Known unrelated dirty files remained outside slice scope.

## Why only one document moved

The existing reorganization plan identified `docs/AUTH_EVIDENCE_PACK.md` as the only current auth evidence document ready for the first controlled move. Moving more files now would mix current truth with status snapshots, runbooks, specs, backlog, or historical docs before their link risks are checked.

## Validation summary

The slice validation checked changed-file scope, required canonical/pointer links, Markdown fence balance, absence of implementation source changes, and that no unrelated ignored files were included as slice changes.

## Next recommended slice

Move or copy selected runbook/operator docs into `docs/10_runbooks/` with compatibility pointers and link updates. Keep historical, backlog, and status-snapshot docs in place until their own move slices.
