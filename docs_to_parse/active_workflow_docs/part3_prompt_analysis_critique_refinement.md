# Part 3 Slice 4 — Prompt Analysis, Critique, and Refined Prompt

## Original task summary

Run Slice 4 on the post-Slice-3 repo ZIP. Verify Slice 3 generated files are attached to the repo ZIP, produce the final Browser Repo Verifier & Doc Curator report, finalize documentation truth/reconciliation artifacts, update version/changelog, commit, and package the updated repo with Git history.

## Analysis

Slice 4 is a finalization slice. It should consolidate Slice 1 evidence, Slice 2 matrix, and Slice 3 reconciliation findings into the final report. It should not start moving or deleting documentation, because the workflow explicitly limits changes to generated reports and version metadata.

## Critique

The risk is overreach: a final report can sound like it completed full semantic verification of every doc claim. This run should be honest that it performed surface-to-medium truth reconciliation and produced the authority model for future deeper consolidation.

## Refined prompt

```text
Run Slice 4 of Part 3 for DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF.

Use the post-Slice-3 12_PF v0.3.24 repo ZIP as the immutable input snapshot.

First verify that Slice 3 generated files are present under docs/active_workflow_docs/:
- part3_slice3_reconciliation_findings.md
- part3_recommended_doc_authority_model.md

Generate/finalize:
- docs/active_workflow_docs/part3_browser_repo_verifier_doc_curator_report.md
- docs/active_workflow_docs/part3_documentation_truth_matrix.md
- docs/active_workflow_docs/part3_recommended_doc_authority_model.md
- docs/active_workflow_docs/part3_prompt_analysis_critique_refinement.md

Update docs/active_workflow_docs/README.md.

Update version metadata from 0.3.24 to 0.3.25 and add an Estonian timestamped CHANGELOG.md entry.

Do not modify production code.
Do not delete, move, or rewrite existing docs except final generated reports under docs/active_workflow_docs/.
Commit one logical documentation-only change.
Package the final repo ZIP with full .git history.
```

## Assumptions

- Slice 1–3 generated files are trusted workflow inputs but remain challengeable.
- `docs/OLD_DOCS/` is historical and should not be deleted in this run.
- Version bump is acceptable because the repository is modified by adding final workflow reports.

## Limitations

- This pass does not rewrite `HOW_TO_RUN.md`; it recommends a separate HOW_TO_RUN regeneration pass.
- This pass does not perform full semantic verification of every historical document.
- This pass does not move or archive files; it only recommends future action.
