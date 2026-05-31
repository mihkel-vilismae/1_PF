# Repository Instructions

## Documentation Navigation Rule

- Before making documentation claims, reorganizing docs, or treating repository documentation as source of truth, read these files first:
  - `docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md`
  - `docs/table_of_contents.md`
  - `docs/DOC_INDEX.md`
  - `docs/DOC_FRESHNESS_MATRIX.md`
  - `docs/DOC_REORGANIZATION_PLAN.md`
  - `docs/DOC_LINK_AUDIT.md`
  - `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md` when working on View A/B/D cards, card buttons, button labels/actions, card/button implementation status, user-observed subjective assessments, or the related follow-up issue list.
  - `docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md` when working on user-observed View A/B/D subjective status snapshots, follow-up issue lists, or validation notes captured from manual/user testing. Treat it as less authoritative than code/tests/runtime evidence.
  - `.codex/skills/test-real-visual-mode-split/SKILL.md`, `.codex/skills/mode-specific-css-architecture/SKILL.md`, `.codex/skills/pending-card-button-border-audit/SKILL.md`, `.codex/skills/test-vs-real-behavior-boundary/SKILL.md`, and `.codex/skills/mock-test-real-implementation-boundary/SKILL.md` when working on the Test Mode / Real Mode visual split, mode CSS organization, pending card/button borders, future test-vs-real behavior boundaries, or reusable mock/test versus real implementation architecture.
  - `.codex/skills/photo-frame-media-provider-proof/SKILL.md` when working on GPS parsing providers, reverse-geocoding providers, provider order, provider activation, cache-first behavior, fallback behavior, or provider proof evidence.
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


## ACR Skill Check Rule

- Whenever an ACR cycle is performed, include a skill-selection step before producing the refined prompt.
- During the Analyze phase, check whether any existing reusable skill, workflow rule, repo skill file, project convention, or prior saved project rule is relevant to the task.
- During the Criticize phase, verify that any selected skill actually fits the task and does not introduce architectural drift, regression risk, outdated assumptions, or unnecessary complexity.
- During the Refine phase, the final refined prompt must include a short `Skills / rules to apply` section that lists selected skills/rules and why they apply, or `No specific reusable skill found` if none are suitable.
- Do not force a skill if none fits, and do not let any skill override the active immutable baseline, explicit user instructions, or the current repo/baseline.
- Prefer repo-local skill files as source of truth when present; preserve architecture boundaries, Test/Real separation, existing behavior, and regression safety.

## Mutable Runtime State Rule

- Treat committed seed/config files differently from runtime-written local state.
- `conf/runtime-truth.seed.json` is the committed neutral runtime-truth seed.
- `conf/runtime-truth.json` is ignored local runtime state created or updated during runs; do not commit it into future baselines unless the user explicitly reverses this rule.
- When a mutable runtime file is needed for app operation, prefer a committed `.seed`, `.example`, or template file plus documentation over tracking changing local state.

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
