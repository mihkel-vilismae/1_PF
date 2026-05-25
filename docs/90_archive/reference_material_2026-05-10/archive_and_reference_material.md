# Archive and Reference Material

## Purpose

Provide a reduced, non-authoritative summary of historical and evidence-heavy documentation groups so they can be referenced without being mistaken for active behavioral guidance.

## Absorbed source docs

- `docs_to_parse/VISION_SPEC/17-deprecated-superseded-docs-log.md`
- `docs_to_parse/vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md`
- `docs_to_parse/OLD_DOCS/*`
- `docs_to_parse/vision_and_implementation/reconciliation/*`
- `docs_to_parse/VISION_SPEC/reconciliation/18-slice2-current-vision-spec-report.md`
- `docs_to_parse/VISION_SPEC/reconciliation/19-slice1-source-inventory-report.md`
- `docs_to_parse/active_workflow/*`
- `docs_to_parse/active_workflow_docs/*`

## Canonical notes

This file is reference-only. It is not behavioral authority.

Reduced archive/reference groups:

| Group | Role now | Use rule |
|---|---|---|
| `OLD_DOCS/*` | historical reference | harvest useful claims before any relocation/deletion |
| `vision_and_implementation/reconciliation/*` | reconciliation evidence | use for audit trail and decision context |
| `VISION_SPEC/reconciliation/18-*`, `19-*` | older slice reports | treat as pre-final reconciliation evidence |
| `active_workflow/*` and `active_workflow_docs/*` | workflow-run artifacts | use for process provenance, not runtime truth |
| deprecated/superseded candidate logs | governance tracker | use for relocation planning only |

Minimum non-authoritative handling rules:

1. Do not use archive/evidence docs as first source for current behavior.
2. Confirm active authority from the authority map before promoting old claims.
3. Keep deletion-marker workflow for any future `to_be_deleted` moves.

## Conflict / reduction notes

- Archive detail was aggressively reduced to group-level guidance; per-file historical summaries were intentionally dropped.
- Preserved tension between addenda-elevating bundle guidance and authority-map tiering; this archive summary follows tiering-first governance.
- Did not carry forward old planning language as active implementation instructions.

## Migration status

| Source group | Migration status | Notes |
|---|---|---|
| `OLD_DOCS/*` | reduced to reference group | no behavioral promotion |
| `vision_and_implementation/reconciliation/*` | reduced to evidence group | final report remains reference support |
| `VISION_SPEC/reconciliation/18-*`, `19-*` | reduced to superseded slice evidence | explicitly lower than final reconciliation |
| `active_workflow*` docs | reduced to process-evidence group | retained provenance intent only |
| deprecated/superseded logs | merged | retained candidate-tracking and deletion-marker rules |
