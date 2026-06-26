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

## Live Orchestrator Baseline Rule

- Before refining or executing any multi-slice, readiness, proof, release, or v1 orchestrator prompt, derive the baseline from the live repository instead of trusting version, HEAD, proof status, blocker lists, or slice order copied into the prompt.
- At minimum, verify the current branch, clean/dirty state, `VERSION`, package version, HEAD, current readiness evaluator mapping, and latest artifact for every relevant exact `proof_kind`.
- Select latest proof artifacts by `proof_timestamp`, preserve unreadable-artifact and identity-mismatch findings, and mark a readiness summary stale when relevant input artifacts are newer.
- Rewrite or skip prompt slices that are already complete, obsolete, unavailable on the current platform, dependent on operator-held secrets, or blocked on target hardware.
- Reorder remaining slices by highest honest readiness impact and executable confidence. Prefer exact required proof kinds and local implementation defects before hardware-only or operator-only gates.
- Do not change readiness mappings merely to match an old prompt, and do not rerun passing proofs without a freshness, identity, regression, or dependency reason.
- In the refined prompt, state the verified live baseline, stale prompt assumptions removed, current passed/blocked gates, selected next slices, deferred target/operator work, and `Skills / rules to apply`.

## Readiness Proof Identity Reporting Rule

- Readiness output must compare each selected mapped proof artifact's `baseline_version` and `git_commit` with the live repository version and HEAD.
- Report every mismatch with the proof kind, source file, affected gate, expected identity, and actual identity.
- Report missing identity fields separately from explicit mismatches.
- State whether identity findings are report-only or gate-blocking under the current evaluator policy; do not silently change gate pass/fail semantics.
- A passed gate backed by an older baseline must not be described as proof of the current release without an explicit identity warning.
- Declare a release-baseline gate `FORMALLY_REFRESHED` only when the gate is passed and every mapped selected proof artifact matches both the current `VERSION` and HEAD.
- Classify a passed gate with mismatched or missing identity as `PASSED_NOT_FORMALLY_REFRESHED`; preserve its gate pass status while requiring current-baseline proof before making a refreshed-release claim.
- Readiness summaries must count formally refreshed gates separately from passed gates and provide exact rerun commands for passed-but-not-refreshed gates.

## Platform-Specific Known Full-Suite Failure Rule

- Track recurring platform-specific full-suite failures in the canonical full-test proof registry with an exact test name, applicable platform, stable ID, and reason.
- Known-failure matching must require both the current platform and exact failing test name; broad substring matching is not allowed.
- Known failures remain real test failures and must not change `full_test_suite_stability` from `FAILED` to `PASSED`.
- Report `KNOWN_FAILURES_ONLY` separately from `UNEXPECTED_FAILURES`, and use `INCOMPLETE_FAILURE_DETAIL` when parsed failure names do not account for the reported failure count.
- Report registered failures that were not observed so stale entries can be reviewed and removed after focused verification.

## Worker Product-Work Proof Authority Rule

- Product-work confirmation must be derived from durable `regular_stage_worker` runtime status evidence, never from a manually asserted environment flag.
- Reject product-work confirmation when worker status reports `implementationStatus: instrumentation_only`, `productWork.claimed` is not true, the invocation was not observed, or the worker run did not succeed.
- `PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED` is not proof authority and must be ignored if present.
- Generated evidence packs may point to `PF_REGULAR_WORKER_RUNTIME_STATUS_FILE`, but must not generate or recommend a manual product-work confirmation value.
- Manifest, GPS, geocode, or bridge evidence may enrich proven worker output; it cannot manufacture the underlying worker product-work claim.

## AI Context Default Exclusion Rule

- Before broad repo analysis, read `.ai-context-ignore` and avoid loading those paths by default.
- Treat excluded paths as on-demand context, not deleted, untracked, or unimportant files.
- Load excluded files only when the task directly touches their domain, such as dependency lockfiles, changelog/version history, generated fixtures, runtime proof evidence, archive patches, registry JSONs, or build/cache outputs.
- Do not exclude active source/spec/test folders such as `server/**`, `dashboard/**`, `tests/**`, or `docs/20_architecture_and_specs/openspec/**` from default analysis.

## Repo Report Timestamp and LOC Rule

- For repository/file/stat/context-analysis answers, print a start timestamp at the top and an end timestamp plus duration at the bottom.
- Include baseline/version, HEAD, and `LOC scanned/read` when measurable. If LOC was not measured, say so rather than inventing a number.
- Use Estonian local time with timezone label for this project unless the user asks otherwise.
- Respect `.ai-context-ignore` before broad repo analysis, and mention excluded files that were loaded on demand because the task required them.
- Do not report hidden model token usage as exact LOC; LOC must come from files, tool output, script output, or visibly inspected snippets.

## Baseline Promotion and Memory Hygiene Rule

- When the user explicitly promotes a newest full Git ZIP as the active baseline, treat that artifact as the current immutable baseline and supersede older PF_login baseline entries.
- Do not accumulate many old baseline memories or docs-only baseline notes when a newer explicit baseline replaces them; keep older versions only when they are needed for lineage, rollback, or comparison.
- Preserve the distinction between docs/OpenSpec-only baseline bumps and runtime implementation bumps in changelog, root README, and handoff summaries.
- For future implementation work, compare behavior against the active baseline snapshot rather than a later dirty workspace or an older remembered version.

## VERSION Output Rule

- When the user says `VERSION`, print the full repository version block.
- The block must include current root/project version, `package.json` version, CronEmulator version, one empty line, `LATEST COMMIT WAS [X AMOUNT OF TIME] AGO`, one empty line, a small summary of latest changes based on `CHANGELOG.md`, one empty line, and `Latest 3 git commits:` with timestamps.
- Compute all values from the current repository state at response time; do not reuse stale values from prior turns.

## Mutable Runtime State Rule

- Treat committed seed/config files differently from runtime-written local state.
- `conf/runtime-truth.seed.json` is the committed neutral runtime-truth seed.
- `conf/runtime-truth.json` is ignored local runtime state created or updated during runs; do not commit it into future baselines unless the user explicitly reverses this rule.
- When a mutable runtime file is needed for app operation, prefer a committed `.seed`, `.example`, or template file plus documentation over tracking changing local state.

## Missing GPS Playback and Address Overlay Rule

- Otherwise valid, playable media must not be excluded from the playback queue solely because GPS metadata, geocoding, or resolved address text is unavailable.
- Represent missing GPS or unresolved location honestly as an explicit unknown, missing, or equivalent non-success state; do not manufacture coordinates or accept deterministic placeholder geocoding as production success.
- Treat address data as optional playback enrichment. Show the address overlay only when accepted real-provider or approved cache evidence supplies usable address text; otherwise hide or omit the overlay cleanly.
- Continue rejecting media for independent playback-safety reasons such as a missing variant, empty or missing file path, unsupported or corrupt media, or another existing invalid playback state.
- Preserve queue idempotency, existing playback selection boundaries, real/mock separation, provider redaction rules, and separate v1.0 proof ownership for iCloud source, GPS/geocode, worker product output, native playback, and device-visible overlay evidence.
- Any change to queue eligibility, missing-location handling, or overlay visibility must update focused tests and the canonical queue/GPS/geocode documentation together.

## Source File Comment Discipline

- Every source file edited from now on must start with a short comment block, about five lines maximum, describing what the file does.
- Every function edited from now on must have a short leading comment explaining what it does, normally one to five lines.
- Do not retroactively sweep untouched files solely to add comments.
- Before editing a source file, check its file-level comment block first.
- Before editing a function, check whether it already has a comment and read it before changing code.
- After source edits, verify that every edited source file has a top comment block and every edited function has a leading comment.
- This rule does not apply to non-source metadata/support files such as `.gitignore`, package manifests, lockfiles, changelogs, or this instruction file unless explicitly requested.

## Thin Entrypoint Architecture Rule

- `server/index.ts` must stay thin and may only bootstrap services, compose routes, create the HTTP server, and start listening.
- `dashboard/app.ts` must stay thin and may only initialize the dashboard shell, subscribe to state, call render orchestration, and bind imported feature event binders.
- New backend feature behavior must live in feature-local route modules, services, controllers, adapters, or utilities instead of being added directly to `server/index.ts`.
- New frontend feature behavior must live in feature-local controllers, views, services, or event binders instead of being added directly to `dashboard/app.ts`.
- Any commit or PR that grows either entrypoint by more than about 50 lines must explain why the behavior cannot live in a feature module and whether the growth is temporary or permanent.
- Exact line-count budgets and enforcement thresholds must be implemented and adjusted repo-locally so checks prevent architectural drift without encouraging mechanical file splitting.

## UI Version Display

- In apps with distinct frontend and backend parts, the top-right version display must show separate lines for each persistent component, including the component name and version number.
- If other distinct components connect at runtime, such as transient ESP32 devices, add a version line for each connected component while it is present.
- Transient component version lines must be visually distinguishable from persistent component lines, for example with a more muted, secondary, or status-like style.

## Fedora Rehearsal Pause Rule

- As of 2026-06-16, Fedora/Linux rehearsal code and specs are paused again.
- Keep existing Fedora code, proof scripts, and docs; do not delete them only because the Fedora path is paused.
- Do not develop new Fedora behavior, add Fedora-first tests, or use Fedora rehearsal as a design target unless the user explicitly resumes Fedora work.
- Treat Fedora artifacts as retained reference/rehearsal material, not active v1 scope and not Raspberry proof.

## GIT WORK Artifact Confirmation Rule

- During `GIT WORK`, do not auto-commit a dirty tree that appears to contain an obvious artifact regression snapshot without first asking for explicit confirmation.
- Treat these as confirmation-required examples:
  - a tracked fixture or artifact directory path has been replaced by a zero-byte file
  - tracked media, fixture, or generated-proof files were deleted and the replacement state looks structurally broken rather than intentionally regenerated
  - `git status`, `git diff --stat`, or direct filesystem checks show a path-collision snapshot like `generated_test_data/videos_with_gps` or `generated_test_data/videos_no_gps` existing as files instead of directories
- When this rule triggers, stop before commit/push and send one concise confirmation line that states the suspicious paths and that `GIT WORK` will snapshot the broken-looking state as-is unless the user approves.
- Do not use this rule to block ordinary dirty-worktree commits, expected fixture regeneration, or intentional artifact removals that were already explicitly requested by the user.

## Large Binary Commit Confirmation Rule

- Before creating any commit during `GIT COMMIT`, `git work`, or similar commit/push workflows, inspect newly added or newly tracked vendored binary files.
- If any newly added or newly tracked binary is larger than GitHub's 50 MB warning threshold, stop and ask for explicit confirmation before committing it.
- If any newly added or newly tracked binary is at or above GitHub's 100 MB hard limit, stop and warn that a normal GitHub push is expected to fail unless the file is removed from history or handled through an approved alternative such as Git LFS.
- The confirmation message must name the affected paths and sizes and state whether the risk is a warning-threshold case or a likely push-blocking case.
- Do not use this rule to block ordinary source files, small assets, or already-tracked unchanged binaries; it applies to newly introduced tracked binary payloads that materially affect Git/GitHub workflow safety.

## Large-File Containment Rule

- Do not add substantial new feature logic to files above `1500` physical lines.
- Treat files above `1500` lines as glue-only unless the change is a tightly scoped bug fix inside existing behavior.
- Allowed large-file edits: imports, route registration, one small render branch, adapter glue, narrow same-responsibility bug fix, or append-only release ledger updates.
- Avoid adding more than roughly `50` to `75` lines to any non-allowlisted file above `1500` lines; create a new focused module, view, service, data file, stylesheet, or test instead.
- For files above `700` lines, add code only when it belongs to the file's existing single responsibility; otherwise create a new file.
- Do not add feature-specific CSS to shared stylesheets above `1000` lines; prefer feature-specific stylesheets such as `dashboard/styles.v2.css`.
- Do not grow large mixed workflow tests with unrelated feature contracts; add focused tests for new behavior.
- Run `npm run check:large-file-containment` before packaging implementation ZIPs when this rule is relevant.
- If an exception is necessary, state the file, line count, reason, preserved behavior, and risk in the implementation summary.
