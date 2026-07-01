---
name: master-branch-roundtrip
description: Prepare PF_login work that branches from `master` and later merges back into `master`. Use when Codex should help start a new branch from the live `master` baseline, define the minimum branch handoff package, keep merge-critical metadata during development, answer what artifacts to upload for one or more sibling branches, or prepare safe merge-back intake without accidentally turning one branch into the new baseline.
---

# Master Branch Roundtrip

Use this skill to keep a branch easy to merge back into `master`.
This skill covers the branch lifecycle and upload strategy, not the actual merge implementation.

## Read First

- `AGENTS.md`
- `docs/10_runbooks/master_branch_roundtrip_workflow.md`
- `docs/20_architecture_and_specs/reference/BRANCH_HANDOFF_AND_MERGE_CONTRACT.md`
- `.codex/skills/branch-merge-intake-handoff/SKILL.md` when merge-back artifacts already exist
- `.codex/skills/baseline-artifact-identity-validator/SKILL.md` when baseline or ZIP identity is unclear

## Workflow

### 1. Start from live `master`

1. Verify that `master` is the intended base branch for this repo.
2. Record the live split baseline before trusting older prompt text:
   - branch
   - clean/dirty state
   - HEAD
   - `VERSION`
   - package version
3. If the working tree is dirty, treat that checkout as unsafe for defining a clean split baseline.
4. Define branch scope:
   - intended behavior
   - explicit non-goals
   - behavior that must remain unchanged

### 2. Define the branch handoff package early

Each branch meant to return to `master` should plan to produce:

- a full Git ZIP with `.git` history;
- one handoff prompt or report;
- an optional merge kit with patches, diffstat, changed-file copies, or proof command notes.

Do not treat copied changed files as the primary source when a full Git ZIP exists.

### 3. Keep merge metadata during development

Maintain one branch handoff note and update it whenever shared files or shared contracts move.
Keep these fields current:

- split baseline ZIP name when available;
- split baseline commit, version, and package version;
- branch name, branch HEAD, version, and package version;
- new files owned by the branch;
- shared files touched;
- logging, proof, package-script, or schema changes;
- commands run and actual results;
- known unresolved merge hotspots.

Pay extra attention when editing shared files such as:

- `VERSION`
- `package.json`
- `CHANGELOG.md`
- docs indexes
- shared log writers or shared log paths
- registries, routers, dispatchers, and view maps

### 4. Prepare merge-back the right way

When the branch is ready to return:

1. Export the full Git ZIP.
2. Export the handoff report.
3. Include the optional merge kit only as supporting context.
4. State whether the exported checkout is clean or dirty.
5. Keep the split baseline identity explicit.

### 5. Handle multiple sibling branches together

If two or more branches split from the same `master` baseline and all need to come back:

- collect all full Git ZIPs first;
- collect all handoff files first;
- upload them together before implementation;
- include the split baseline ZIP if the live target baseline is not already available.

Do not merge branch A first and then treat that merged result as the new baseline for branch B unless the user explicitly wants a sequential integration strategy.

### 6. Merge-back rules

- Prefer the live `master` checkout plus all sibling branch artifacts over copied prompt prose.
- Treat the full Git ZIP as authoritative over extracted changed-file subsets.
- Require explicit reconciliation for shared log schemas, package scripts, docs navigation, and shared registries.
- Require a new final merged version when sibling branches reused the same earlier version number for different content.
- Treat branch-local proof results as branch evidence only until the merged target is verified again.

## Stop conditions

Stop and report rather than smoothing over these gaps:

- split baseline is missing or ambiguous;
- only a few copied files are supplied for a branch that clearly touched shared flows;
- the source branch ZIP or checkout is dirty and the dirty state is not classified;
- two branches changed the same log path or schema without a compatibility plan;
- package/version/docs/proof-command drift would make the merge misleading.

## Output contract

Report:

- verified live `master` identity;
- expected branch handoff artifacts;
- missing or weak artifacts;
- safest upload order;
- safest merge-intake order;
- preserved behavior;
- explicit non-claims about unverified merged behavior.
