# Terminal Demo View 0 / View 6 Merge Intake - 2026-07-02

Estonian timestamp: 2026-07-02 00:48 EEST

## Purpose

This is a pre-implementation merge intake for combining two branch ZIP
artifacts into the current PF_login target branch. It is an audit and
handoff report, not proof that the merged behavior exists.

## XACR result

Analyze: the original request was to upload both branch ZIPs and handoff
files together, then build a merge contract/intake report before any merge.
The live target branch, split baseline, View 0 artifact, and View 6 artifact
had to be verified from files and Git metadata instead of trusted from prompt
text.

Criticize: a simple one-branch-then-the-other merge would make the first
branch an accidental new baseline. The branch work overlaps in package
scripts, terminal demo runtime dispatch, docs, and proof naming. View 6 also
has a logging shape that must be reconciled with the View 0 shared logging
contract before docs can honestly claim one shared standard.

Refine: create an intake report and a reusable branch handoff standard before
implementation. Use exact commits, not dirty extracted worktrees. Preserve the
current target branch behavior, import View 0 shared logging/route behavior
first, then import View 6 fixture/placeholder behavior, and finish with
version, package, docs, and proof reconciliation.

Skills / rules to apply:

- `git-branch-consolidation`: use conservative branch intake and do not reset,
  delete, rebase, or merge the real target while analyzing.
- `pf-doc-governance-writer`: place this audit in
  `docs/50_audits_and_migrations/`, place reusable standards under
  `docs/20_architecture_and_specs/reference/`, and keep truth labels explicit.
- `.ai-context-ignore`: proof/generated/archive files were loaded only on
  demand because this task directly concerns branch artifacts and proof files.

## Verified baseline

| Item | Value |
| --- | --- |
| Current target repo | `S:\_PHOTOFRAMES\PF_login_v0.10.20_github_history_merged` |
| Current branch | `main` |
| Current HEAD | `25d8a7d7af3b5c78383ebb9b18cf765dcc899ef0` |
| Current VERSION | `2.0.13` |
| Current package version | `2.0.13` |
| Current worktree | Dirty before doc edits; observed dirty paths include `__unzipped_archives/PF_login_v2.0.9_empty_view_shells_full_git/PF_login_v2.0.8_acr_usage_ledger_full_git` and `terminal/demo/runtime_logs.zip` |
| Split baseline ZIP | `E:\_CHROME_DOWNLOADS\PF_login_v2.0.10_view0_map_view6_blank_full_git.zip` |
| Split baseline HEAD | `b0210d9b86484efcc8a250aa7136314808ff11ac` |
| Split baseline version | `2.0.10` |
| View 0 branch ZIP | `E:\_CHROME_DOWNLOADS\PF_login_v2.0.13_view0_custom_test_route_full_git (1).zip` |
| View 0 HEAD | `127fa4f3d535cd9c1f4e9f31a4a6900ffca3cdd1` |
| View 0 version | `2.0.13` |
| View 6 branch ZIP | `E:\_CHROME_DOWNLOADS\PF_login_v2.0.13_view6_branch_for_merge_full_git.zip` |
| View 6 HEAD | `8a6c2ecad8663b0b92a7e6564c2c32cdf007111c` |
| View 6 version | `2.0.13` |

Both extracted branch repositories reported local dirty files after ZIP
extraction. Treat the named commits and handoff bundles as the branch source of
truth, not the extracted working-tree state.

## Branch intent

View 0 adds the shared terminal JSONL action logging contract at
`runtime_data/logs/demo/terminal-button-actions.jsonl`, the
`branchFeature: "view0_map_testing"` marker, the `0A` default route, the `7D`
custom route, and focused proof/docs for those contracts.

View 6 adds fixture-backed View 6 buttons, a disabled future queue-backed
section, copied fixture media under
`terminal/demo/test_data/playback_fixtures/`, and a Codex placeholder modal
whose headline must be exactly `this will be done by Codex`.

View 6 must not add real playback, queue-backed playback, fullscreen playback,
address-overlay playback, worker/auth/DB/cron side effects, or hardware
claims.

## Committed branch deltas

View 0 changes 29 files from `b0210d9` to `127fa4f`, with about 1248
insertions and 61 deletions. Key areas:

- Source: `terminal/demo/src/main.ts`, `terminal/demo/src/run/TerminalActionLogWriter.ts`, `terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts`, `terminal/demo/src/state/*`, `terminal/demo/src/ui/renderViewZero.ts`, `terminal/demo/src/view0/*`, `terminal/demo/src/views/TerminalViewRegistry.ts`.
- Docs/proofs: new shared logging and View 0 OpenSpecs/proof docs, updates to the View 0 / View 6 blank proof docs, and `docs/table_of_contents.md`.
- Config: `VERSION`, `package.json`, `package-lock.json`.

View 6 changes 26 files from `b0210d9` to `8a6c2ec`, with about 858
insertions and 29 deletions plus two small fixture binaries. Key areas:

- Source: `terminal/demo/src/main.ts`, `terminal/demo/src/playback/*`, `terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts`, `terminal/demo/src/ui/renderScreen.ts`, `terminal/demo/src/ui/renderViewSixPlayback.ts`, `terminal/demo/src/views/TerminalViewRegistry.ts`, `terminal/demo/src/views/TerminalViewState.ts`.
- Fixture data: `terminal/demo/test_data/playback_fixtures/README.md`, `gps_valid_01.jpg`, `gps_valid_video_02_tartu.mp4`.
- Docs/proofs: new View 6 OpenSpecs/proof docs and proof runners, plus changes to `tools/run-terminal-demo-view0-map-view6-blank-proof.mjs`.
- Config: `VERSION`, `package.json`, `package-lock.json`.

## Simulated conflicts

A temp clone of the current committed target HEAD was used for conflict
simulation. The real target worktree was not merged.

| Simulated merge | Conflicts |
| --- | --- |
| Current target plus View 0 | `CHANGELOG.md`, `package.json` |
| Current target plus View 6 | `package.json`, `terminal/demo/src/ui/renderScreen.ts` |

High-risk additive reconciliation files:

- `terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts`
- `terminal/demo/src/main.ts`
- `terminal/demo/src/views/TerminalViewRegistry.ts`
- `terminal/demo/src/views/TerminalViewState.ts`
- `terminal/demo/src/ui/renderScreen.ts`
- `terminal/demo/README.md`
- `package.json`
- `package-lock.json`
- `CHANGELOG.md`
- `tools/run-terminal-demo-view0-map-view6-blank-proof.mjs`

## Required preservation

- Preserve current target terminal shell/log/auth work after the split baseline,
  including `L` and `I` render branches and the current package scripts.
- Preserve modal/input priority for existing start-stage modal behavior before
  adding View 0 and View 6 route handling.
- Preserve View 0 route handling only while active on View 0.
- Preserve View 6 fixture button handling only while active on View 6.
- Preserve View 6 non-claims: no real playback, no queue playback, no worker,
  no auth, no DB, no cron, no hardware behavior.
- Preserve one shared terminal action log standard. View 6 logging should be
  reconciled to include its own branch marker, such as
  `branchFeature: "view6_fixture_playback"`, instead of keeping a competing
  direct-write event shape.

## Recommended merge plan

1. Create a clean integration branch or worktree from current `main` at
   `25d8a7d`. Do not implement in the already dirty target worktree.
2. Import the View 0 shared logging contract first.
3. Import View 0 route/runtime behavior.
4. Import View 6 fixture contract and placeholder behavior, adapting View 6
   evidence logging to the shared terminal action log writer/schema.
5. Manually reconcile `renderScreen.ts` so current `L`/`I` branches remain and
   View 6 is added.
6. Union package scripts from current target, View 0, and View 6. Regenerate or
   verify `package-lock.json` consistently.
7. Rewrite or replace `proof:terminal-demo-view0-map-view6-blank`; the name is
   no longer a clean final contract after View 6 is intentionally non-blank.
8. Finalize docs, changelog, and version after behavior is reconciled.

The final merged repo must not remain at version `2.0.13`; current target,
View 0, and View 6 already use that version for different content.

## Stop conditions

Stop before implementation or commit if:

- the implementation workspace is not isolated from the dirty target tree;
- a merge uses dirty extracted worktrees instead of exact commits or patches;
- package scripts from current target, View 0, or View 6 disappear;
- `renderScreen.ts` drops current `L`/`I` shell handling or auth rendering;
- View 6 starts real playback, queue-backed playback, or side effects outside
  its placeholder contract;
- View 6 logs lack a merge-safe branch marker;
- docs claim current implementation truth before proofs pass;
- the final merged version remains `2.0.13`.

## Verification commands for the eventual merge

Run these after implementation in the integration branch:

```powershell
git status --short --branch
npm install
npm run typecheck
npm test
npm run build
npm run proof:terminal-demo-empty-view-shells
npm run proof:terminal-demo-auth-view-shells
npm run proof:terminal-demo-logs-view-shell
npm run proof:terminal-demo-view0-default-test-route
npm run proof:terminal-demo-view0-custom-test-route
npm run proof:terminal-demo-shared-logging-contract
npm run proof:terminal-demo-view6-fixture-playback-contract
npm run proof:terminal-demo-view6-codex-placeholder
npm run proof:terminal-demo-view6-codex-placeholder-complete
npm run proof:terminal-demo-view6-codex-playback-handoff
git fsck --no-dangling
```

If a compatibility proof keeps the old `proof:terminal-demo-view0-map-view6-blank`
name, its assertions must be rewritten to match the merged View 6 contract.

## Future contract standard

Use `docs/20_architecture_and_specs/reference/BRANCH_HANDOFF_AND_MERGE_CONTRACT.md`
for future branch ZIP handoffs. The standard requires baseline identity,
branch intent, file ownership, behavior matrix, logging schema, side effects,
proof pack, conflict forecast, and truth labels before merge implementation.

## What remains unverified

- No final merge was performed in the target branch.
- No post-merge proof command was run.
- The exact content of dirty extracted worktree modifications was not accepted
  as branch truth.
- Fixture provenance was taken from the View 6 handoff and committed tree; the
  source generated fixture originals were not independently validated in this
  intake.

