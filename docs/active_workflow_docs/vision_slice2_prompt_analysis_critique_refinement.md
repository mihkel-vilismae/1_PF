# Slice 2 Prompt Analysis, Critique, and Refined Prompt

Created: 2026-04-26 19:59 EEST
Workflow: 3-slice vision/specification documentation reconciliation.
Slice: 2 — Current reality and product vision spec.
Baseline: post-Slice-1 repository ZIP, committed at `c3c7617 docs: add vision documentation authority map`.

## User instruction incorporated

- Do not run auth tests.
- If a test hangs for too long twice, record that fact and avoid rerunning it in later slices unless the user explicitly asks.
- Keep deprecated and superseded documentation candidates marked in a dedicated markdown log file.

## Analysis

Slice 1 created the evidence base: a documentation authority map, unresolved questions list, deprecated/superseded documentation log, and source inventory report. Slice 2 should not re-run the whole inventory. Its job is to turn the strongest evidence into three usable current-facing specs:

1. project vision;
2. current implementation reality;
3. dashboard view specification.

The most important risk is confusing target intent with implementation reality. The repository contains a mix of real backend routes, deterministic placeholders, mock views, historical docs, and active workflow evidence. Slice 2 must mark each claim with a status class rather than making everything sound finished.

## Critique of the raw Slice 2 request

The request correctly targets the post-Slice-1 repo, but it needs tighter execution controls:

- It must explicitly use repo-local skills where suitable.
- It must avoid auth test execution because the user prohibited it.
- It must record long-running or hanging verification instead of repeatedly rerunning the same risky command.
- It must update the deprecated/superseded documentation log, but it must not move or delete docs in Slice 2.
- It must keep production code untouched.
- It must update version and changelog metadata because the repo policy requires a patch bump even for docs-only work.

## Refined prompt used for Slice 2

```text
You are running Slice 2 of the 3-slice vision/specification documentation reconciliation workflow for the 12_PF / 1_PF photo-frame dashboard repository.

STRICT MODE:
- Snapshot-safe.
- Regression-intolerant.
- Documentation-only by default.
- Preserve all production code behavior.
- Preserve git history.
- One logical commit for Slice 2.
- Do not squash commits.
- Do not move or permanently delete documentation files in Slice 2.
- Do not invent functionality that is not supported by docs or code evidence.
- Clearly distinguish IMPLEMENTED, PARTIAL, DOCUMENTED_INTENT, PLANNED, DEPRECATED, UNKNOWN, NEEDS_VERIFICATION, and NEEDS_USER_DECISION.

BASELINE:
Use the post-Slice-1 repo ZIP as the immutable baseline for this slice.

MANDATORY SKILL USE:
Inspect `.codex/skills/` and use suitable repo-local skills where relevant.
For this slice:
- Use `.codex/skills/button-workflow-verification/SKILL.md` as supporting evidence for dashboard button and inspect metadata truth.
- Use `.codex/skills/view-a-init-reconciliation/SKILL.md` as supporting evidence for View A init/auth/scheduler claims.
If no broader documentation-reconciliation skill exists, state that no general doc-reconciliation skill was present and continue using the strict workflow rules.

PRIMARY SLICE 2 GOAL:
Create or update:
- `docs/vision_and_implementation/PROJECT_VISION.md`
- `docs/vision_and_implementation/CURRENT_IMPLEMENTATION_SPEC.md`
- `docs/vision_and_implementation/DASHBOARD_VIEWS_SPEC.md`

Also update:
- `docs/vision_and_implementation/README.md`
- `docs/vision_and_implementation/UNRESOLVED_QUESTIONS.md`
- `docs/vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md`
- `docs/active_workflow_docs/vision_slice2_prompt_analysis_critique_refinement.md`
- version metadata and changelog according to repo policy.

EVIDENCE TO USE:
- Slice 1 authority map and unresolved questions.
- Root `README.md`.
- `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` for high-level intended behavior.
- `docs/IMPLEMENTATION_STATUS_AUDIT.md` for implementation status.
- `docs/buttons_and_implementation_overview.md` for button/view implementation truth.
- Current code structure in `server/index.js`, `dashboard/views/`, `dashboard/services/`, `dashboard/inspect/`, `schema.sql`, and `tests/` only as needed.

TEST / VERIFICATION RULES:
- Do not run auth tests.
- Do not run full `npm test` if it would include auth tests.
- Prefer documentation-safe verification:
  - `git diff --check`
  - `npm run task-docs:check`
  - `node scripts/version_guard.mjs repo`
  - selected non-auth tests only if quick and relevant.
- If any test or verification command hangs for too long twice, record it and do not rerun it in later slices unless explicitly requested.

DEPRECATED / SUPERSEDED DOC RULE:
Keep deprecated and superseded documentation candidates recorded in `docs/vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md`.
In Slice 2, add a note that useful content has started to be harvested into current vision/spec docs, but no old docs are moved yet.

COMMIT:
Make exactly one Slice 2 commit with message:
`docs: add current vision and implementation specs`
```

## Skill usage

| Skill | Used in Slice 2 | Why |
|---|---|---|
| `.codex/skills/button-workflow-verification/SKILL.md` | Yes, supporting evidence | It defines how to interpret dashboard button wiring, backend boundaries, inspect metadata, and real/mock classifications. |
| `.codex/skills/view-a-init-reconciliation/SKILL.md` | Yes, supporting evidence | It defines View A reconciliation rules and prevents frontend wording from being treated as implementation proof. |
| General documentation reconciliation skill | Not found as a repo-local `.codex/skills/` skill | Slice 2 continued using the strict workflow and active workflow docs from `docs/active_workflow_docs/`. |

## Verification guidance carried forward

Auth tests are explicitly excluded by user instruction. If a non-auth test command hangs twice in this workflow, record it in the verification notes and avoid rerunning it in Slice 3 unless the user explicitly asks.
