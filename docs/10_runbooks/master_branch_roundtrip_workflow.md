# Master Branch Roundtrip Workflow

Status: reusable workflow runbook

Estonian timestamp: 2026-07-02

## Purpose

Use this runbook when you branch from `master` and want the return merge to stay
predictable, especially when multiple sibling branches must merge back into the
same target later.

This is a workflow standard, not proof that any specific branch is already safe
to merge.

## Recommended default

For future parallel-branch merge work:

- upload both branch full Git ZIPs together;
- upload both branch handoff files together;
- include the split baseline ZIP only when the live target baseline is not
  already available in the working repo;
- treat three-file copies or merge-kit extracts as supplemental context only.

Do not merge branch A first and then branch B second unless you intentionally
want branch A to become the new integration baseline.

## Phase 1: branch from `master`

Before starting branch work:

1. Start from a clean `master` checkout.
2. Record the split baseline identity:
   - branch name
   - HEAD commit
   - `VERSION`
   - package version
   - baseline ZIP name, if you package one
3. Write one branch handoff note at the start of the branch instead of trying
   to reconstruct it later.
4. State:
   - branch goal
   - explicit non-goals
   - behavior that must remain unchanged

If `master` is already dirty, create a clean worktree or clean integration copy
before treating it as the branch split baseline.

## Phase 2: keep a branch handoff note during development

Keep one Markdown handoff note for the branch and update it when shared files,
shared schemas, or shared proofs change.

Minimum fields:

- split baseline ZIP name, commit, version, and package version;
- source branch name, HEAD, version, and package version;
- new files owned by the branch;
- shared files touched;
- logging, proof, package-script, or schema changes;
- commands run and actual results;
- known unresolved merge hotspots.

Update this note immediately when you touch:

- `VERSION`
- `package.json`
- `CHANGELOG.md`
- shared docs indexes
- shared log writers or shared log paths
- shared registries, view maps, routers, or dispatchers

## Phase 3: prepare the branch for return

When the branch is ready to come back to `master`, package these artifacts:

1. Full Git ZIP with `.git` history.
2. Handoff prompt or handoff report Markdown file.
3. Optional merge kit with diffstat, patch files, changed-file copies, and
   proof-command notes.

Authority order:

1. Full Git ZIP
2. Handoff report
3. Optional merge kit
4. Changed-file copies

Do not use changed-file copies alone as the authoritative merge source when the
full Git ZIP still exists.

## Phase 4: merge multiple sibling branches back to `master`

If multiple branches split from the same baseline and all must return:

1. Collect every branch full Git ZIP first.
2. Collect every branch handoff file first.
3. Upload them together before any implementation merge.
4. Build one merge-intake report against live `master`.
5. Merge in a clean integration branch or worktree, not in a dirty live tree.

This avoids turning the first merged branch into an accidental new baseline for
the second branch.

## What not to do

- Do not paste only three changed files when a branch touched shared flows.
- Do not rely on extracted dirty folders over the full Git ZIP.
- Do not trust branch prose that omits split-baseline commit, version, or clean
  state.
- Do not keep the final merged `master` on the same version if two sibling
  branches reused that earlier version for different content.
- Do not treat branch-local proof as merged-`master` proof.

## Reusable prompts

Use these prompts in future chats.

Before or during branch work:

```text
Use $master-branch-roundtrip to prepare this new branch from master for a clean future merge back into master. Record the live baseline, required handoff artifacts, and the shared-file hotspots I need to track during development.
```

Before merge-back:

```text
Use $master-branch-roundtrip and $branch-merge-intake-handoff to audit these branch ZIPs and handoff files together, build the merge contract/intake report, and recommend the safest implementation order before touching master.
```

## Related standards

- [Branch Handoff and Merge Contract](../20_architecture_and_specs/reference/BRANCH_HANDOFF_AND_MERGE_CONTRACT.md)
- [Terminal Demo View 0 / View 6 Merge Intake](../50_audits_and_migrations/TERMINAL_DEMO_VIEW0_VIEW6_MERGE_INTAKE_20260702.md)
