# Other Documentation

> Current checkpoint: `v0.10.67`. This compatibility README is preserved for navigation/provenance; use root README, current OpenSpec docs, and proof evidence for live implementation truth.


## Documentation navigation notice

This category index is preserved for local and historical organization. For current cross-repository navigation, start with:

- [`docs/DOC_INDEX.md`](../../DOC_INDEX.md) — the current main map for documentation by purpose, kind, authority, and freshness.
- [`docs/DOC_FRESHNESS_MATRIX.md`](../../DOC_FRESHNESS_MATRIX.md) — the trust/freshness guide for current, stale, historical, and risky docs.
- [`docs/DOC_REORGANIZATION_PLAN.md`](../../DOC_REORGANIZATION_PLAN.md) — the required plan to check before moving documentation files.

Docs in this category may include snapshots, specs, backlog, or reference material. Do not treat them as current implementation truth unless code, tests, or generated evidence confirm the claim.
## Final reference/index handling decision

As of 2026-05-25 01:47 EEST, this category index remains in place as a compatibility pointer for older links and local reference orientation. The canonical operator runbook now lives under [`../../10_runbooks/`](../../10_runbooks/), current organization guidance lives in [`../../DOC_INDEX.md`](../../DOC_INDEX.md), and old reference material should not be promoted to current truth without verification.

Keep this file until a later old-index replacement slice performs a full link audit. Do not add new operator runbooks here; add them under `docs/10_runbooks/` and update `docs/DOC_INDEX.md`.
## Slice 18 link audit status

As of 2026-05-25 02:06 EEST, this other-documentation category compatibility index was retained in place after the full documentation link audit. Use [../../DOC_LINK_AUDIT.md](../../DOC_LINK_AUDIT.md) for the audit result and [../../OLD_INDEX_REPLACEMENT_DECISION.md](../../OLD_INDEX_REPLACEMENT_DECISION.md) for the old-index replacement decision.

This file remains compatibility navigation only. New canonical documentation should go to the numbered target folders documented in `DOC_INDEX.md` and `DOC_REORGANIZATION_PLAN.md`.

## Slice 17 remaining reference move note

As of 2026-05-25 01:56 EEST, the remaining reference/workflow documents from this category have canonical homes outside `docs/categorized/other_documentation/`:

- `archive_and_reference_material.md` → `../../90_archive/reference_material_2026-05-10/archive_and_reference_material.md`
- `documentation_workflow_and_inventory.md` → `../../10_runbooks/documentation_workflow_and_inventory.md`
- `default_project_settings_and_elements_checklist.md` → `../../20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md`

The old paths remain compatibility pointers only. Do not add new canonical docs to this category folder.


## Purpose

This category consolidates non-feature support documentation that remains operationally useful: run/setup notes, auth/operator guidance, documentation workflow governance, default project reference checklists, inventory references, and reduced archive orientation.

## Absorbed source docs

- `README.md`
- `HOW_TO_RUN.md`
- `docs_to_parse/VERSIONING_AND_CHANGELOG_POLICY.md`
- `docs_to_parse/VISION_SPEC/12-documentation-authority-map.md`
- `docs_to_parse/VISION_SPEC/15-vision-and-implementation-reading-guide.md`
- `docs_to_parse/VISION_SPEC/17-deprecated-superseded-docs-log.md`
- `docs_to_parse/VISION_SPEC/VISION_SPEC_readme.md`
- `docs_to_parse/VISION_SPEC/reconciliation/13-final-vision-spec-reconciliation-report.md`
- `docs_to_parse/vision_and_implementation/reconciliation/FINAL_VISION_SPEC_RECONCILIATION_REPORT.md`
- `docs_to_parse/active_workflow_docs/README.md`
- `docs_to_parse/active_workflow_docs/part1_quick_documentation_inventory_with_loc.md`
- `docs_to_parse/active_workflow_docs/part3_recommended_doc_authority_model.md`
- `docs_to_parse/active_workflow_docs/workflow_rule_active_docs_folder_prompt.md`
- `docs_to_parse/active_workflow_docs/part3_slice3_reconciliation_findings.md`
- `docs_to_parse/AI_AUTHENTICATION_2FA_HANDOFF.md`
- `docs_to_parse/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md`
- `docs_to_parse/AUTH_ICLOUDPD_SESSION_VERIFICATION.md`

## Canonical notes

Canonical files in this category:

| File | Scope | Authority limit |
|---|---|---|
| `main_readme.md` | category index and migration map | index-only |
| `operator_setup_and_auth_notes.md` | run/setup/auth practical notes | operator support only |
| `documentation_workflow_and_inventory.md` | compatibility pointer to `../../10_runbooks/documentation_workflow_and_inventory.md` | process governance only |
| `default_project_settings_and_elements_checklist.md` | compatibility pointer to `../../20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md` | aspirational/reference only; not current implementation status or active backlog by itself |
| `archive_and_reference_material.md` | compatibility pointer to `../../90_archive/reference_material_2026-05-10/archive_and_reference_material.md` | explicitly non-authoritative |

Authority limits for this category:

1. Do not treat archive or workflow evidence as behavioral truth by default.
2. For documentation authority tiering, prefer `12-documentation-authority-map.md`.
3. `VERSIONING_AND_CHANGELOG_POLICY.md` remains active governance for version/changelog workflow.
4. `HOW_TO_RUN.md` remains active run guidance while present.
5. Reconciliation reports are audit/reference support, not direct runtime behavior authority.
6. The default project settings checklist is an ideal/reference checklist; unchecked or missing items require separate promotion before they become implementation tasks.

## Conflict / reduction notes

- Preserved conflict: `VISION_SPEC_readme.md` ranks chat addenda as highest working authority, while `12-documentation-authority-map.md` defines tiered authority with code/tests first and map-driven governance. For this category, map tiering is the default unless an explicit promotion decision is recorded.
- `OLD_DOCS`, older reconciliation slices (`18-*`, `19-*`), `vision_and_implementation/reconciliation/*` (except final report use), and `active_workflow*` artifacts were reduced to evidence/reference context and not promoted to behavioral authority.

## Migration status

| Source doc/group | Migration status | Destination |
|---|---|---|
| `HOW_TO_RUN.md` | merged (kept active by reference) | `operator_setup_and_auth_notes.md` |
| `VERSIONING_AND_CHANGELOG_POLICY.md` | merged (governance retained) | `operator_setup_and_auth_notes.md`, `documentation_workflow_and_inventory.md` |
| VISION_SPEC authority/readme/reconciliation docs | merged (authority constraints and conflicts retained) | `main_readme.md`, `documentation_workflow_and_inventory.md` |
| Auth handoff/manual/session docs | merged and deduplicated | `operator_setup_and_auth_notes.md` |
| `active_workflow_docs/*` inventory/governance docs | merged and reduced | `documentation_workflow_and_inventory.md` |
| User-supplied default project checklist | added as reference | `default_project_settings_and_elements_checklist.md` |
| `OLD_DOCS/*`, older reconciliation slices, and workflow evidence backlog | reduced to reference-only summary | `archive_and_reference_material.md` |
