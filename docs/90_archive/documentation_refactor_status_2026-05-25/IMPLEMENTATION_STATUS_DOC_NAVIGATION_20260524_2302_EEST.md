# Implementation Status — Root Documentation Navigation

Estonian timestamp: 2026-05-24 23:02 EEST

## Status

Implemented the root-link documentation navigation slice.

## Files changed

- `README.md`
- `HOW_TO_RUN.md`
- `docs/main_readme.md`
- `docs/IMPLEMENTATION_STATUS_DOC_NAVIGATION_20260524_2302_EEST.md`

## Preserved

- Existing README structure and content.
- Existing HOW_TO_RUN commands.
- Existing `docs/main_readme.md` content.
- Existing documentation files and paths.
- Existing source code.
- Existing tool-local docs.
- Known unrelated dirty files were not touched.

## Changed

Added concise documentation-navigation sections that link to:

- `docs/DOC_INDEX.md`
- `docs/DOC_FRESHNESS_MATRIX.md`
- `docs/DOC_REORGANIZATION_PLAN.md`
- `docs/AUTH_EVIDENCE_PACK.md`

The added sections explain that old TODO docs, `task_docs/`, backlog docs, and vision/spec docs must not be treated as current implementation truth without code, test, or generated-evidence verification.

## Why files were not moved

Moving docs before root navigation is discoverable would increase link-break risk and make it harder for future agents to distinguish current truth from archive/spec/backlog material. This slice intentionally adds navigation first and leaves physical reorganization to later link-aware slices.

## Next recommended slice

Run a link-aware root-index update slice that updates old category indexes to point at `docs/DOC_INDEX.md` and `docs/DOC_FRESHNESS_MATRIX.md`, still without moving files.
