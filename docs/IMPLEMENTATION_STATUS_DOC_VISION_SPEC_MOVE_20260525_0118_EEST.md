# Implementation Status — Vision/Spec Documentation Move

Estonian timestamp: 2026-05-25 01:18 EEST

## Scope

Moved selected categorized vision/spec documentation into `docs/20_architecture_and_specs/` with compatibility pointers at the old categorized paths.

## Files moved to canonical architecture/spec paths

- `docs/20_architecture_and_specs/architecture_runtime_and_recovery_spec.md`
- `docs/20_architecture_and_specs/dashboard_auth_pipeline_spec.md`
- `docs/20_architecture_and_specs/product_vision_and_authority.md`

## Compatibility pointers preserved

- `docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md`
- `docs/categorized/vision_spec_docs/dashboard_auth_pipeline_spec.md`
- `docs/categorized/vision_spec_docs/product_vision_and_authority.md`

## Preserved

- No source code was changed.
- `docs/categorized/vision_spec_docs/main_readme.md` remains in place until the old-index replacement slice.
- Existing root docs, status snapshots, backlog docs, archived docs, runbooks, and tool-local docs remain in place.
- Known ignored dirty/unrelated files were excluded from slice scope.

## Why files were not all moved

Only the three canonical vision/spec documents were moved. The category index stays where it is so older navigation remains intact while physical grouping continues slice by slice.

## Validation results

- Canonical moved files exist.
- Old categorized paths remain compatibility pointers.
- `docs/DOC_INDEX.md`, `docs/DOC_FRESHNESS_MATRIX.md`, and `docs/DOC_REORGANIZATION_PLAN.md` reference canonical and compatibility paths.
- Markdown fence balance passed.
- No implementation source files changed.

## Next recommended slice

Move remaining audit/migration documentation into `docs/50_audits_and_migrations/` with compatibility pointers, or move auth architecture/reference docs into `docs/20_architecture_and_specs/auth/` as a separate smaller slice.
