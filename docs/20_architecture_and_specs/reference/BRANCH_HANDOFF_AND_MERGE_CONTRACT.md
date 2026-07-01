# Branch Handoff and Merge Contract

Estonian timestamp: 2026-07-02 00:48 EEST

## Purpose

This contract defines the minimum documentation package for branch ZIPs or
parallel branch work that must later merge back into a PF_login root branch.
It is a reusable merge-safety standard, not proof that any specific branch is
implemented.

## Required handoff bundle

Every branch intended for later merge should provide:

- full Git ZIP with `.git` history;
- handoff prompt or report;
- optional merge kit with format patches, combined patch, changed-file copies,
  diffstat, name-status, checksums, and proof command list;
- exact split baseline ZIP name, baseline commit, branch head commit, branch
  name, `VERSION`, and package version;
- note whether the extracted working tree is clean.

Do not use copied changed files alone as the primary merge source when a full
Git ZIP is available.

## Required sections

### Baseline identity

Record:

- root target branch and HEAD if known;
- split baseline ZIP, commit, version, package version, and date;
- source branch ZIP, branch, HEAD, version, package version, and date;
- whether the source checkout is clean, dirty, or unknown.

### Scope ledger

Separate:

- in-scope behavior;
- explicit non-goals;
- deferred behavior;
- accepted non-claims;
- behavior that must remain unchanged.

### Behavior matrix

List every user-visible behavior added or changed. For terminal-demo work,
include:

- view ID;
- key sequence;
- expected screen/page/modal text;
- enabled/disabled controls;
- data source;
- side effects;
- expected log/evidence fields.

### File ownership map

Classify changed files as:

- branch-owned new files;
- shared source files;
- shared docs;
- shared package/version files;
- proof runners;
- generated or fixture files;
- runtime artifacts that must not be committed.

Mark files that are expected to conflict or require additive reconciliation.

### Logging and evidence schema

Define:

- log path;
- writer/helper used;
- required fields;
- branch-specific marker values such as `branchFeature`;
- redaction expectations;
- whether evidence is durable, runtime-local, or generated proof output.

Branches sharing one log path must share one event schema or explicitly define
a compatible schema extension.

### Input and side-effect boundaries

For UI, terminal, or operator flows, define:

- owned keys/buttons/routes;
- modal priority;
- active-view scoping;
- side effects that are allowed;
- side effects that are forbidden.

Call out DB writes, auth/session access, worker/cron behavior, hardware access,
network calls, file writes, and generated artifacts explicitly.

### Merge precedence

State what must win when two branches touch the same file. Prefer additive
reconciliation for registries, package scripts, view dispatchers, proof lists,
and documentation navigation.

Never resolve shared files by blindly taking one branch wholesale when the
target branch contains newer unrelated behavior.

### Proof pack

List exact commands, expected result, and proof meaning:

- build/typecheck/test commands;
- behavior proof commands;
- compatibility proof commands;
- docs/link checks;
- commands that are expected to block off-target or without secrets/hardware.

Distinguish PASS, BLOCKED, SKIPPED, and EXPECTED FAILURE. Do not describe
blocked target/hardware proof as current implementation proof.

### Truth labels

Every handoff must include:

- Verified: checked from code, Git, tests, generated evidence, or runtime output;
- Inferred: likely from patterns or docs, but not directly checked;
- Unverified: plausible or requested, but not checked;
- Historical: provenance only.

Do not present branch prose as current implementation truth until it is verified
in the target branch after merge.

## Recommended merge intake workflow

1. Extract all branch ZIPs and the split baseline outside the target repo.
2. Verify each repo root, branch, HEAD, version, package version, and clean/dirty
   state.
3. Compare each branch against the split baseline by commit range.
4. Compare current target against the split baseline.
5. Simulate merges in a temporary clone or worktree, not the real target tree.
6. Produce a conflict matrix before implementation.
7. Create a clean integration branch or worktree for implementation.
8. Import behavior in slices, then finalize package/version/docs/proofs.
9. Run the proof pack and record actual results.
10. Commit only after version is updated and regression checks pass.

## Stop conditions

Stop before implementation or commit when:

- the split baseline is missing or ambiguous;
- the source branch checkout is dirty and the dirty state is not classified;
- the target worktree has unrelated dirty changes and no clean integration
  workspace exists;
- the merge requires overwriting newer target behavior;
- package scripts would be dropped;
- one branch changes a shared log schema without reconciliation;
- proof names no longer match merged behavior;
- docs claim current truth before merged proofs pass;
- a final merged behavior change would keep the same version as an older
  different artifact.

## Documentation placement

Place one-off merge intake reports in `docs/50_audits_and_migrations/`.
Place reusable standards like this file in
`docs/20_architecture_and_specs/reference/`.

Update `docs/table_of_contents.md`, `docs/DOC_INDEX.md`, and
`docs/DOC_FRESHNESS_MATRIX.md` when adding canonical documentation.

