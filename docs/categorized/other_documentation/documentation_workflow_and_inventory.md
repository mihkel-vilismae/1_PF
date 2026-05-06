# Documentation Workflow and Inventory

## Purpose

Capture documentation governance workflow rules, inventory strategy, and source-tracking decisions used for this consolidation, while keeping authority boundaries explicit.

## Absorbed source docs

- `docs_to_parse/VISION_SPEC/12-documentation-authority-map.md`
- `docs_to_parse/VISION_SPEC/15-vision-and-implementation-reading-guide.md`
- `docs_to_parse/VISION_SPEC/17-deprecated-superseded-docs-log.md`
- `docs_to_parse/VISION_SPEC/reconciliation/13-final-vision-spec-reconciliation-report.md`
- `docs_to_parse/vision_and_implementation/reconciliation/FINAL_VISION_SPEC_RECONCILIATION_REPORT.md`
- `docs_to_parse/active_workflow_docs/README.md`
- `docs_to_parse/active_workflow_docs/part1_quick_documentation_inventory_with_loc.md`
- `docs_to_parse/active_workflow_docs/part3_recommended_doc_authority_model.md`
- `docs_to_parse/active_workflow_docs/workflow_rule_active_docs_folder_prompt.md`
- `docs_to_parse/active_workflow_docs/part3_slice3_reconciliation_findings.md`
- `docs_to_parse/VERSIONING_AND_CHANGELOG_POLICY.md`

## Canonical notes

### Workflow governance

- Active workflow outputs belong in `docs/active_workflow_docs/` and should be kept as evidence for current analysis runs.
- Reconciliation reports document process outcomes and unresolved areas; they are audit artifacts, not direct behavioral specs.
- Deprecation tracking should mark candidates first, then harvest useful content before relocation.

### Inventory strategy

- Use inventory docs to scope consolidation and detect overlap.
- Treat high-volume folders (`OLD_DOCS`, button verification outputs, task docs) as evidence pools unless explicitly promoted.
- Prefer authority-tiered navigation before merging claims across doc sets.

### Consolidation source tracking (this category)

| Topic | Primary source family | Consolidation handling |
|---|---|---|
| Authority tiering | VISION_SPEC authority map + reading guide | preserved as authority limits |
| Workflow placement | active_workflow folder rule + README | preserved as process rule |
| Inventory baseline | part1 inventory | reduced to strategy-level guidance |
| Reconciliation outcomes | final reconciliation reports + slice findings | preserved as audit notes, not runtime authority |
| Version/changelog governance | versioning policy | preserved as active governance reference |

### Default project checklist

The checklist in `default_project_settings_and_elements_checklist.md` is a repo-local reference for ideal default project settings, files, workflows, and quality gates. Treat it as guidance until a specific item is separately promoted into an active implementation task or verified as already present.

## Conflict / reduction notes

- Conflict retained: bundle-style ranking in `VISION_SPEC_readme.md` can elevate chat addenda, but category governance defaults to authority-map tiering unless explicit promotion exists.
- Reduced detailed inventory rows, per-file LOC tables, and slice-level procedural narration to compact governance notes.
- Reduced route/schema/testing excerpts from workflow findings because this category is documentation workflow, not behavioral contract specification.

## Migration status

| Source/group | Migration status | Outcome |
|---|---|---|
| `active_workflow_docs/README.md` + workflow rule prompt | merged | active-workflow placement rule retained |
| `part1_quick_documentation_inventory_with_loc.md` | reduced | inventory statistics not copied in full |
| `part3_recommended_doc_authority_model.md` | merged/reduced | kept hierarchy/archive policy, dropped speculative folder redesign as non-canonical |
| `part3_slice3_reconciliation_findings.md` | reduced | kept actionable documentation findings only |
| VISION_SPEC authority/reconciliation governance docs | merged | preserved authority and deprecation workflow constraints |
| Duplicate final reconciliation report variant | reduced | treated as same report family, not separate authority |
