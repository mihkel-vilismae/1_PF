# Implementation Status — Auth Flow Reference Move

Estonian timestamp: 2026-05-25 01:28 EEST

## Scope

Moved the auth/provider verification reference document into the architecture/spec documentation area with a compatibility pointer at the old path.

## Files moved to canonical location

- `docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md` -> `docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md`

## Compatibility pointer

The old path remains present as a short pointer file so existing references continue to resolve:

- `docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md`

## Preserved

- Existing source code was not changed.
- Root docs were not changed.
- Category index docs were not changed.
- Tool-local docs were not changed.
- Known ignored dirty/unrelated files were not touched.
- The canonical auth-flow reference content was preserved under the new path.

## Validation summary

- Canonical auth-flow reference exists under `docs/20_architecture_and_specs/auth/`.
- Old path remains as compatibility pointer.
- `DOC_INDEX.md`, `DOC_FRESHNESS_MATRIX.md`, and `DOC_REORGANIZATION_PLAN.md` reference the canonical and compatibility paths.
- Markdown fence balance passed.
- No implementation source files changed.

## Next recommended slice

Move audit/migration docs into `docs/50_audits_and_migrations/` with compatibility pointers.
