---
name: branch-merge-intake-handoff
description: Audit PF_login branch ZIPs, handoff prompts, merge kits, and split-baseline artifacts before any merge or implementation. Use when Codex is asked to combine parallel branch repos, review branch-for-merge bundles, build a merge intake report, verify split-baseline identity, simulate conflicts safely, or define merge precedence and proof requirements without touching the target worktree.
---

# Branch Merge Intake Handoff

Use this skill to turn branch ZIPs and handoff files into a safe pre-merge intake.
This skill is for analysis and handoff planning, not for performing the merge itself.

## Read First

- `AGENTS.md`
- `docs/20_architecture_and_specs/reference/BRANCH_HANDOFF_AND_MERGE_CONTRACT.md`
- `docs/50_audits_and_migrations/TERMINAL_DEMO_VIEW0_VIEW6_MERGE_INTAKE_20260702.md` as a worked example when the task is similar
- any uploaded handoff prompt, merge kit manifest, diffstat, or changed-file inventory supplied with the branch artifacts

When the task also includes proof or evidence ZIPs, use `proof-bundle-export-audit` separately rather than stretching this skill into proof-bundle review.

## Intake Workflow

1. Establish the live target baseline before trusting the prompt.
   - Record current branch, clean/dirty state, `VERSION`, package version, and HEAD.
   - If the target worktree is already dirty, treat that as a stop condition for real merge work and recommend a clean integration branch or worktree.
2. Inventory each source artifact separately.
   - Full Git ZIP
   - handoff prompt or report
   - merge kit or patch bundle
   - changed-file copies
   - diffstat, name-status, checksum, or proof command list
3. Verify branch identity and source authority.
   - Record the exact split baseline ZIP name, commit, version, and package version.
   - Record each source branch ZIP name, branch name when available, HEAD, version, and package version.
   - Check whether extracted source worktrees are clean or dirty.
   - If a full Git ZIP exists, treat it as the primary source over copied changed files.
4. Build a file-ownership and conflict map.
   - Separate branch-owned new files, shared source files, shared docs, shared package/version files, proof runners, fixture files, and runtime artifacts that must not be committed.
   - Mark files that are likely to conflict or need additive reconciliation.
5. Simulate conflicts safely.
   - Use a temporary clone or worktree from committed target HEAD.
   - Never run the merge simulation in the live dirty target tree.
   - Record exact conflicting paths and distinguish hard conflicts from additive reconciliation hotspots.
6. Produce the intake report using the branch handoff contract.
   - Baseline identity
   - scope ledger
   - behavior matrix
   - file ownership map
   - logging/evidence schema notes
   - side-effect boundaries
   - merge precedence
   - proof pack
   - explicit stop conditions
7. Recommend the next implementation slice.
   - Prefer a clean integration branch/worktree.
   - Preserve current target behavior by default.
   - If two branches reuse the same version for different content, require a new target version during actual integration.

## Required Stop Conditions

Stop and report rather than smoothing over these gaps:

- missing or ambiguous split baseline identity
- source branch artifact lacks trustworthy Git history and lacks a usable merge kit
- copied changed files are presented as the only authoritative source while a fuller artifact is expected
- the live target tree is dirty and the task asks for direct merge implementation there
- version/package identity is reused across different branch contents and would make the merge target misleading
- shared logging or proof schema conflicts would cause silent behavior drift

## Safety And Non-Claims

- Do not claim the merged behavior exists just because the ZIPs, patches, or docs look coherent.
- Do not promote a branch ZIP to baseline merely because it is newer than another upload.
- Do not trust copied prompt text for version, HEAD, proof status, or branch cleanliness when Git metadata can be checked.
- Do not recommend "merge branch A, then merge branch B" if that would turn the first branch into an accidental new baseline.
- Do not mutate uploaded artifacts or the active target repository during intake unless the user explicitly asks for implementation after the intake is complete.

## Output Contract

Report:

- verified live target identity
- verified source artifact identity
- overlap and conflict inventory
- preserved behavior
- changed behavior that each branch intends
- untouched areas
- stop conditions
- safest next implementation order
- exact non-claims
