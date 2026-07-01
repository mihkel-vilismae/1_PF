---
name: branch-merge-implementation
description: Implement audited PF_login branch ZIP or handoff merges into live `master` after merge intake is complete. Use when Codex is asked to actually merge one or more branch artifacts back into `master`, reconcile shared terminal-demo/docs/package/proof files, rerun target-master verification, bump version metadata, and commit the verified integration without pushing unless explicitly requested.
---

# Branch Merge Implementation

Use this skill after `branch-merge-intake-handoff` has produced a merge intake or when the user explicitly asks to perform the merge from branch ZIPs/handoff artifacts.
This skill is for the actual integration pass, not the pre-merge audit.

## Read First

- `AGENTS.md`
- `.codex/skills/master-branch-roundtrip/SKILL.md`
- `.codex/skills/branch-merge-intake-handoff/SKILL.md`
- `.codex/skills/baseline-artifact-identity-validator/SKILL.md` when ZIP/live identity is unclear
- `.codex/skills/pf-doc-governance-writer/SKILL.md` when canonical docs or indexes change
- the merge-intake report and branch handoff contract named by the task

When the merge touches terminal-demo buttons, view routing, keyboard/mouse/PIR input, or proof runners, also use the relevant terminal-demo skill such as `terminal-demo-clickable-controls`.

## ACR Preflight

### Analyze

1. Derive the live target baseline from the repository before trusting prompt text:
   - remote URL
   - branch, which must be `master` for this repo
   - clean/dirty state
   - HEAD
   - `VERSION`
   - package version
   - ahead/behind status
2. Re-read the merge-intake report as historical evidence, not current truth.
3. Recreate any temporary extraction or simulation worktree from current `master`.
4. Identify stale prompt assumptions:
   - old branch names such as `main`
   - old target HEAD or version
   - branch-local proof results presented as merged-target proof
   - docs or proofs that freeze a sibling view as "unchanged"

### Criticise

Before editing, check whether the proposed merge would:

- overwrite current `master` behavior with an older branch snapshot;
- treat branch A as the accidental baseline for branch B;
- reuse a branch version number as the final merged version;
- introduce a competing log schema, proof schema, router, registry, or dispatcher;
- leave stale proof assertions such as "View X remains blank" after a promoted view becomes implemented;
- depend on Windows-hostile nested proof runners such as `node -> npm.cmd -> tsx` when direct `node --import tsx` is available;
- commit generated runtime output, local logs, temp extraction folders, credentials, cookies, or proof scratch directories.

Stop and report if these risks cannot be resolved conservatively.

### Refine

Build a concrete implementation plan that lists:

- files each source branch owns;
- shared files requiring deliberate reconciliation;
- preserved current-master behavior;
- changed behavior each branch adds;
- stale docs/proofs to refresh;
- proof commands to rerun on the merged target;
- version/package/changelog bump for the final integration commit.

## Implementation Workflow

1. Verify live `master`.
   - Fix an invalid staging `origin` before reasoning about ahead/behind.
   - Fetch/prune before merge work when network is available and the task requires current GitHub state.
   - Do not proceed with direct implementation on a dirty worktree unless the dirty state is the intended merge work already under review.
2. Extract branch artifacts only into temp locations.
   - Treat full Git ZIPs as stronger authority than copied changed-file subsets.
   - Record source branch HEAD, version, package version, and dirty/clean state where available.
3. Reconcile shared files manually.
   - Preserve live `master` behavior by default.
   - Union package scripts; do not drop current scripts.
   - Bump `VERSION`, package metadata, and package lock metadata for the final integration.
   - Update `CHANGELOG.md` with exact scope and non-claims.
4. Reconcile proofs and docs as implementation artifacts.
   - Rerun branch proofs on the merged target; branch-local proof output is not enough.
   - Update docs indexes and freshness matrices when adding canonical docs.
   - Refresh old proof assertions that claim a surface is unchanged when the merge intentionally changes it.
   - Keep proof names stable when useful, but update proof text so historical names do not imply false current behavior.
5. Reconcile logs and evidence schemas.
   - Prefer one shared writer or an established local writer shape over parallel JSONL schemas.
   - Add branch markers such as `branchFeature` only as compatible extensions.
   - Do not log secrets, request/response bodies, credentials, cookies, or raw provider output.
6. Verify before commit.
   - Run focused proofs for changed behavior.
   - Run preservation proofs or smokes for adjacent behavior.
   - Run typecheck/build when source changes affect TypeScript or frontend output.
   - Run `git diff --check` and inspect staged file sizes before committing.
7. Commit only after verification.
   - Use one logical integration commit unless the user asked for a different breakdown.
   - Use the required project author when applicable.
   - Do not push unless the user explicitly asks after the commit.

## Verification Guidance

Prefer direct, host-compatible proof commands when Node proof runners shell into npm poorly on Windows:

```powershell
node --import tsx terminal/demo/src/main.ts --adapter=real-demo --view-shell-smoke=0
node --import tsx terminal/demo/src/main.ts --adapter=real-demo --view-shell-smoke=6
npm run typecheck
npm run build
```

When updating existing proof runners, make the proof itself portable instead of documenting a local workaround.

## Stop Conditions

Stop before commit when:

- live `master` identity cannot be verified;
- source artifacts are missing or ambiguous;
- branch ZIPs disagree with handoff claims in behavior-affecting ways;
- shared schema conflicts remain unresolved;
- verification fails for reasons that look caused by the merge;
- a newly added binary exceeds GitHub size warning thresholds and the user has not approved it;
- the merge would require real credentials, target hardware, or operator-only actions to verify honestly.

## Output Contract

Report:

- verified live baseline and source artifact identity;
- stale assumptions removed;
- files changed by category;
- preserved behavior and modified behavior;
- exact proofs/tests run and results;
- unresolved risks or non-claims;
- commit hash when committed;
- push status, explicitly distinguishing local commit from GitHub push.
