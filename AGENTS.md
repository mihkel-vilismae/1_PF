# Repository Instructions

## Documentation Navigation Rule

- Before making documentation claims, reorganizing docs, or treating repository documentation as source of truth, read these files first:
  - `docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md`
  - `docs/DOC_INDEX.md`
  - `docs/DOC_FRESHNESS_MATRIX.md`
  - `docs/DOC_REORGANIZATION_PLAN.md`
  - `docs/DOC_LINK_AUDIT.md`
- Use canonical numbered documentation folders for new documentation:
  - `docs/00_current_truth/` for verified or evidence-backed current truth only.
  - `docs/10_runbooks/` for operator/how-to procedures.
  - `docs/20_architecture_and_specs/` for architecture, contracts, target behavior, and specs.
  - `docs/30_status_snapshots/` for dated implementation/status snapshots.
  - `docs/40_backlog_and_tasks/` for backlog, TODOs, task prompts, and future-work notes.
  - `docs/50_audits_and_migrations/` for audits, migration plans, and refactor reports.
  - `docs/90_archive/` for historical/provenance material.
- Do not treat old categorized docs, compatibility pointers, TODOs, task docs, backlog docs, vision/spec docs, or archived docs as current implementation truth unless code, tests, generated evidence, or runtime checks verify the claim.
- Keep old category indexes and compatibility pointers intact unless a later link-retirement audit explicitly proves they can be changed.


## Source File Comment Discipline

- Every source file edited from now on must start with a short comment block, about five lines maximum, describing what the file does.
- Every function edited from now on must have a short leading comment explaining what it does, normally one to five lines.
- Do not retroactively sweep untouched files solely to add comments.
- Before editing a source file, check its file-level comment block first.
- Before editing a function, check whether it already has a comment and read it before changing code.
- After source edits, verify that every edited source file has a top comment block and every edited function has a leading comment.
- This rule does not apply to non-source metadata/support files such as `.gitignore`, package manifests, lockfiles, changelogs, or this instruction file unless explicitly requested.

## UI Version Display

- In apps with distinct frontend and backend parts, the top-right version display must show separate lines for each persistent component, including the component name and version number.
- If other distinct components connect at runtime, such as transient ESP32 devices, add a version line for each connected component while it is present.
- Transient component version lines must be visually distinguishable from persistent component lines, for example with a more muted, secondary, or status-like style.
