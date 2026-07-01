# Default Project Settings and Elements

## Purpose

This document defines the reusable default settings, files, workflows, and quality gates that should be applied to new projects by default. It is intended to keep repositories consistent, regression-safe, easy to run, easy to package, and easy to inspect.

## Core Principles

Every new project should be created and maintained with the following principles:

- Think like a senior engineer when designing architecture and implementation details.
- Think like a senior designer when creating visual interfaces and user-facing flows.
- Think like a senior analyst when evaluating risks, gaps, dependencies, and tradeoffs.
- Preserve existing functionality by default.
- Avoid silent behavior changes.
- Respect existing architectural boundaries, abstractions, and layering.
- Prefer small, verifiable, commit-sized changes.
- Keep implementation, documentation, tests, and changelog updates synchronized.
- Make mock/demo behavior clearly distinguishable from real backend/system behavior.

## Default Repository Structure

A new project should normally include this baseline structure:

```text
project-root/
├─ .git/
├─ .gitignore
├─ README.md
├─ HOW_TO_RUN.md
├─ CHANGELOG.md
├─ main-goal-readme.md
├─ full_windows_runner_status.cmd
├─ start_scripts/
│  ├─ windows/
│  │  ├─ start_win.cmd
│  │  ├─ START_WIN.PS1
│  │  └─ FULL_WINDOWS_RUNNER_STATUS.PS1
│  └─ raspberry/
│     └─ START_RASPBERRYOS.SH
├─ logs/
│  ├─ error.log
│  ├─ debug.log
│  ├─ full_log.log
│  └─ log_{datetime}.log
├─ docs/
├─ tests/
├─ scripts/
├─ zip_ignore.json
└─ CREATE_TRASNFERABLE.cmd
```

The exact folders may vary by project type, but the intent should remain the same: clear entrypoints, clear documentation, clear logs, clear tests, and clear packaging.

## Required Root-Level Files

### README.md

The README should include:

- Project summary.
- What the project does.
- Main screens or flows the user will see after running it.
- Commands to install, run, test, and package the project.
- Short explanation beside each command.
- Expected result for each command.
- Notes about real vs mock/demo behavior.
- Troubleshooting basics.

### HOW_TO_RUN.md

The root HOW_TO_RUN file must stay short and quickstart-oriented. It should include only:

- The preferred one-command or double-click quickstart.
- Current launcher paths.
- Canonical database/schema paths when relevant.
- The shortest manual install/build/start commands.
- Links to deeper runbooks for proof, auth, platform, and troubleshooting details.

Do not turn root `HOW_TO_RUN.md` into a long operator manual. Move long run guidance into `docs/10_runbooks/` and link it from the root quickstart.

### CHANGELOG.md

The changelog should be maintained automatically whenever functionality changes. It should follow forward-only version history and avoid retroactive fabrication.

Recommended structure:

```markdown
# Changelog

## YYYY-MM-DD HH:mm EEST
## v0.1.0 - Short change title

- Initial project structure.
- Added the first runnable launcher/status helper.
```

Rules:

- Preserve existing changelog data when reformatting.
- Use a paired date heading plus version/title heading for each entry.
- If an old entry has no recorded date, mark the date as `DATE_NOT_RECORDED` rather than inventing one.

### main-goal-readme.md

This file tracks the current main project goal. It should be updated whenever the project scope or primary objective changes.

Recommended structure:

```markdown
# Main Goal

## Current Goal

Describe the current main goal here.

## Scope Notes

Describe what is in scope and out of scope.

## Last Updated

YYYY-MM-DD
```

### .gitignore

Each project should include a suitable `.gitignore` for its technology stack. It should exclude generated files, dependency folders, caches, local environment files, and packaged archives.

### full_windows_runner_status.cmd / root runner-status helper

Every default project that has multiple runtime components should include one root-level runner/status helper similar to `full_windows_runner_status.cmd`. Documentation must show PowerShell current-directory usage, for example `.\full_windows_runner_status.cmd`, because bare local command names are not executed by PowerShell by default.

Expected behavior:

- Easy double-click startup from the repository root, plus explicit PowerShell usage with `.\` when run from a terminal.
- Starts the main components/dependencies through scripts under `start_scripts/`.
- Provides a visible status view for key components.
- Provides safe stop/refresh actions when applicable.
- Clear error output if prerequisites are missing.
- Does not silently fail or hide component startup errors.
- Delegates complex logic to scripts inside `start_scripts/`.

### start_scripts/windows and start_scripts/raspberry

Platform-specific startup logic should live under `start_scripts/windows/` and `start_scripts/raspberry/` when needed. Root scripts should remain minimal operator entry points.

### logs/

Every default project should include a `logs/` folder with these files:

- `error.log` — errors only.
- `debug.log` — debug-level details.
- `log_{datetime}.log` — timestamped regular runtime log.
- `full_log.log` — combined log containing everything that appears in the other logs.

The project should avoid hiding failures. Important actions should be visible in logs.

## Git and Versioning Rules

Each project should be initialized as a valid Git repository.

Default Git rules:

- Include full `.git` history when producing a repository ZIP.
- Use one logical change per commit.
- Do not squash commits unless explicitly requested.
- Use clear commit messages.
- Prefer a safe branch for debugging or improvement work.
- Compare changes against the original snapshot when a snapshot exists.
- Set upstream remote when known.
- If no upstream is known, initialize local Git without setting a remote.

Mandatory commit author:

```text
Mihkel Vilismäe (AI-assisted) <mihkel.vilismae@gmail.com>
```

Suggested Git config commands:

```bash
git config user.name "Mihkel Vilismäe (AI-assisted)"
git config user.email "mihkel.vilismae@gmail.com"
```

## Versioning Rules

Default versioning should use SemVer where practical:

```text
MAJOR.MINOR.PATCH
```

Recommended meaning:

- `PATCH` — fixes, documentation corrections, safe small improvements.
- `MINOR` — new backward-compatible functionality.
- `MAJOR` — breaking changes or architectural shifts.

Any functionality change should normally update:

- `CHANGELOG.md`
- `README.md` when run behavior or visible behavior changes
- `HOW_TO_RUN.md` when commands change
- `main-goal-readme.md` when scope changes
- tests when behavior changes

### Visible App Version Badge

For apps with a visual UI, the current app version should be visible in the top-right corner whenever practical.

Default behavior:

- Display the current version as a small badge, for example `v0.2.1`.
- Prefer the top-right corner of the main app shell/header.
- The displayed value should come from the same version source used by project metadata where practical, such as `package.json`, a generated version file, or a shared constants file.
- Avoid hardcoding a version in multiple places.
- Update the visible version whenever the project version changes.
- The badge should be subtle and not interfere with main controls.
- If the screen is too small or the UI does not have a suitable header, document why the visible badge is not used.

## Packaging and ZIP Rules

When generating ZIPs or transferable archives:

- Include full Git history when requested or when implementing code changes.
- Include a valid `.git` folder.
- Include a suitable `.gitignore`.
- Exclude ignored/generated files.
- Use `zip_ignore.json` for additional archive exclusions.
- Prefer a reusable packaging script.
- Validate Markdown fence safety before creating ZIPs.
- Do not package structurally broken Markdown.

Expected packaging helper files:

```text
CREATE_TRASNFERABLE.cmd
scripts/pack_repo_zip.py
zip_ignore.json
```

Preferred ZIP naming pattern:

```text
{project_folder}_{creation_datetime}_{VERSION}.zip
```

Example:

```text
my_project_2026-05-06_0635_v0.1.0.zip
```

## Markdown ZIP Safety Rules

Before creating a ZIP that contains Markdown files:

- Validate that code fences are balanced.
- Ensure there is no broken nesting of triple backticks.
- Remove accidental UI artifacts such as `Copy code`.
- Normalize code blocks.
- Refuse to create the ZIP if the Markdown structure is unsafe and cannot be safely repaired.
- Create the ZIP only after validation passes.

## Testing Rules

Each project should include tests for implemented functionality where practical.

Testing expectations:

- Tests should match real functionality.
- Tests should be updated when behavior changes.
- Tests should be removed only when the related functionality is removed.
- Regression tests should be added for fixed bugs.
- Commands to run tests should be documented in `README.md` and `HOW_TO_RUN.md`.
- Prefer fast smoke tests plus deeper functional tests when applicable.

Recommended test documentation format:

```markdown
## Test Commands

```bash
npm test
```

Runs the automated test suite. Expected result: all tests pass.
```

## Dashboard and UI Inspection Controls

For dashboard-style projects, include reusable meta-inspection controls where applicable:

- `Explain controls`
- `Explain values`
- `Show real vs mock`
- `Show/Hide backend status`

These controls should help users understand:

- What each button/control does.
- What each displayed value means.
- Whether data is real, mock, demo, cached, inferred, or backend-confirmed.
- Whether the backend is reachable and what endpoint/state supports the UI.


### Terminal Pane / Section Inspection IDs

For terminal-style UIs with multiple panes and bordered sections, prefer a documented section-header ID overlay. This makes screenshots, bug reports, and operator prompts easier to reference without guessing names.

Recommended vocabulary:

| Term | Meaning |
|---|---|
| `Pane` | A large top-level terminal region such as left, center, or right. |
| `Section` | A bordered functional block inside a pane. |
| `SectionHeader` | The visible title of a section. |
| `SectionBody` | The content inside the section. |

Recommended behavior: provide a safe toggle such as `H` that shows `section_header_id_overlay` prefixes in the form `{pane-code}-{section-ordinal}`. Example headers: `L-3 ACTIONS`, `C-2 PLAYBACK`, and `R-1 RPI-STAGES`. The overlay should be display-only and must not trigger backend actions, workers, cron, or data mutation.

## Real vs Mock Rules

Projects must not present fake/demo/mock data as real system state.

Default rules:

- Label mock/demo behavior clearly.
- Label backend-confirmed behavior clearly.
- Avoid frontend-only guesses when backend state should be authoritative.
- If a feature is simulated, say so in the UI and docs.
- If a backend endpoint is unavailable, show that honestly.
- Do not show success unless the system has actually confirmed success.

## Runtime and Logging Rules

Runtime behavior should be visible, debuggable, and safe.

Default expectations:

- Important actions write to logs.
- Errors write to `error.log` and `full_log.log`.
- Debug information writes to `debug.log` and `full_log.log`.
- Timestamped runtime logs are created when the project runs.
- The system should avoid silent failure.
- Long-running tasks should expose status where practical.

## Snapshot-Safe Change Rules

When a project snapshot is provided, treat it as the immutable baseline unless explicitly released.

Rules:

- Preserve all existing functionality by default.
- Compare changes against the snapshot, not only the latest modified state.
- Do not introduce breaking changes without approval.
- Do not remove functionality without clearly stating it first.
- Respect architecture and layering.
- Clearly state what is preserved, what changes, and any risks.
- If asked to revert, restore snapshot behavior accurately.

## Implementation Workflow

Recommended workflow for code changes:

1. Identify the baseline snapshot.
2. Define the smallest safe change.
3. Update implementation.
4. Update tests.
5. Update documentation.
6. Update changelog/version if functionality changed.
7. Run formatting/lint/tests.
8. Commit one logical change.
9. Package ZIP with `.git` history when requested.
10. Provide diff, commit metadata, test commands, and ZIP link when applicable.

## Standard Deliverables for Implemented Code Changes

When code changes are implemented, provide:

- Exact files changed.
- Exact Git diff or patch.
- Commit message.
- Commands to format/lint/test/run.
- Test result summary.
- ZIP snapshot with Git history when requested or required.
- Clear statement of preserved behavior, changed behavior, and risks/tradeoffs.

## Default Project Checklist

### A. Repository Setup

- [x] Project folder created.
- [x] Git repository initialized.
- [x] `.gitignore` added.
- [x] Git author configured as `Mihkel Vilismäe (AI-assisted) <mihkel.vilismae@gmail.com>`.
- [x] Upstream remote added if known.
- [ ] If upstream is unknown, repository remains local without fake remote.
- [x] Initial commit created.

### B. Required Documentation

- [x] `README.md` created.
- [x] `README.md` explains what the project does.
- [ ] `README.md` includes install/run/test/package commands.
- [ ] `README.md` includes expected command results.
- [x] `README.md` summarizes visible screens or flows.
- [x] `HOW_TO_RUN.md` created.
- [ ] `HOW_TO_RUN.md` is short, quickstart-oriented, and links to deeper runbooks instead of embedding them.
- [ ] Linux/macOS instructions are included only when applicable.
- [x] `CHANGELOG.md` created.
- [ ] `main-goal-readme.md` created.
- [ ] Main project goal is clearly written.
- [x] Documentation mentions real vs mock behavior where relevant.

### C. Versioning

- [x] Initial version selected.
- [x] SemVer used where practical.
- [x] Version appears in appropriate project metadata.
- [ ] Visual apps show the current version in the top-right corner where practical.
- [ ] Visible version badge uses the shared/project metadata version source where practical.
- [x] `CHANGELOG.md` includes the initial version entry.
- [ ] Version is updated when functionality changes.

### D. Start Scripts

- [ ] A root runner/status helper such as `full_windows_runner_status.cmd` exists when multi-component startup is needed, and PowerShell docs show `.\full_windows_runner_status.cmd`.
- [ ] Platform-specific startup logic lives under `start_scripts/windows/` or `start_scripts/raspberry/` when needed.
- [ ] Startup scripts print clear errors when prerequisites are missing.
- [ ] Startup scripts do not silently fail.
- [x] Startup commands are documented in `README.md` and `HOW_TO_RUN.md`.

### E. Logs

- [x] `logs/` folder exists.
- [x] `logs/error.log` exists.
- [x] `logs/debug.log` exists.
- [x] `logs/full_log.log` exists.
- [ ] Timestamped runtime log pattern is documented: `log_{datetime}.log`.
- [x] Runtime errors are written to logs.
- [x] Important runtime actions are logged.

### F. Tests

- [x] `tests/` folder exists when practical.
- [ ] Smoke tests exist for startup/basic functionality.
- [x] Functional tests exist for core behavior where practical.
- [ ] Regression tests are added for fixed bugs.
- [ ] Test commands are documented.
- [ ] Tests pass before commit when possible.

### G. Dashboard / UI Inspection Controls

- [x] `Explain controls` exists where applicable.
- [x] `Explain values` exists where applicable.
- [x] `Show real vs mock` exists where applicable.
- [x] `Show/Hide backend status` exists where applicable.
- [x] UI clearly distinguishes real data from mock/demo data.
- [ ] UI does not claim backend success without backend confirmation.
- [ ] Inspect metadata is kept synchronized with actual behavior.

### H. Real vs Mock Safety

- [x] Mock/demo behavior is explicitly labeled.
- [x] Real/backend-confirmed behavior is explicitly labeled.
- [ ] Cached or inferred data is not presented as confirmed truth.
- [x] Failure states are visible and honest.
- [ ] No fake success states are shown.

### I. Packaging

- [ ] `CREATE_TRASNFERABLE.cmd` exists when archive generation is needed.
- [x] `scripts/pack_repo_zip.py` or equivalent packaging script exists.
- [x] `zip_ignore.json` exists.
- [x] Packaging excludes ignored/generated files.
- [x] ZIP includes `.git` history when required.
- [x] ZIP naming follows `{project_folder}_{creation_datetime}_{VERSION}.zip`.
- [ ] Markdown fence safety validation passes before ZIP creation.

### J. Commit Discipline

- [ ] One logical change per commit.
- [ ] Commit message is clear.
- [ ] Commit uses mandatory author identity.
- [ ] Changelog updated in the same logical change when behavior changes.
- [ ] README/HOW_TO_RUN updated when commands or visible behavior change.
- [ ] Tests updated in the same logical change when behavior changes.

### K. Snapshot-Safe / Regression-Safe Rules

- [ ] Baseline snapshot identified when applicable.
- [ ] Existing functionality preserved.
- [ ] No silent behavior shifts introduced.
- [ ] Architecture boundaries respected.
- [ ] Risks and tradeoffs documented.
- [ ] Revert path is clear.

## Completion Definition

A project satisfies the default settings when:

- It can be cloned or unzipped and understood from the root documentation.
- It can be started using documented commands.
- It has versioning and changelog tracking.
- It has clear logs and visible failures.
- It has tests where practical.
- It distinguishes real behavior from mock/demo behavior.
- It can be packaged safely.
- It preserves Git history.
- It follows snapshot-safe, regression-aware workflow rules.


## ACR Workflow Usage Tracking

Projects that use ACR-style planning commands may include a runtime-only ledger for future usage counts:

```text
runtime_data/workflow/acr-command-usage.jsonl
```

The ledger should separate operator-requested analysis from assistant workflow analysis with these source values:

| Source | Meaning |
|---|---|
| `user_called` | The user explicitly requested the ACR command. |
| `assistant_automatic` | The assistant ran the ACR command as part of an agreed workflow. |

Recommended helper commands:

| Script | Purpose |
|---|---|
| `workflow:acr:record` | Append one validated ACR usage event. |
| `workflow:acr:summary` | Print totals by command and source. |
| `proof:workflow-acr-usage-ledger` | Prove the ledger, summary, docs, and package script coverage. |

## Terminal View Vocabulary Defaults

Terminal-style operator interfaces should use this vocabulary when applicable:

| Term | Meaning |
|---|---|
| `View` | Whole full-screen terminal screen/state. |
| `Pane` | Large top-level region inside a view. |
| `Section` | Bordered block inside a pane. |
| `Subsection` | Smaller block inside a section. |
| `Modal` | View-scoped overlay visible only when opened/enabled. |
| `ViewKey` | Keyboard key that selects a view when no modal owns input. |

For PhotoFrame terminal Demo Mode, reserve `D` for Default, `L` for Logs, `I` for iCloudPD login, and `1`-`6` for stage/playback views. Shell slices must not execute real button actions. View `D` may include a read-only authorization shell, and View `I` may list NEW AUTH button shells without executing iCloudPD.


### Terminal Shell Component Composition Defaults

Terminal-style operator interfaces should compose repeated UI blocks from reusable helpers instead of duplicating strings and layout code across views.

Recommended reusable pieces:

| Component | Purpose |
|---|---|
| `SectionFrame` | Shared bordered section wrapper. |
| `ViewMapSection` | Shared hotkey-to-view navigation table. |
| `StatusRing` | Shared status marker/icon beside status labels; implemented as a display-only terminal helper in PF_login v2.0.12. |
| `StatusRow` | Shared read-only label/value/status row; implemented as a display-only terminal helper in PF_login v2.0.12. |
| `RpiStagesSection` | Shared RPI stage truth/status section. |
| `RpiWorkersSection` | Shared RPI worker truth/status section. |

For shell-first work, documentation must distinguish `planned shell contract` from `implemented runtime behavior`. Shell buttons may be visible, but must not execute auth, workers, cron, playback, DB writes, or file copies until a later implementation slice explicitly wires and proves that behavior.


### PF_login iCloudPD Auth Shell Defaults

For PF_login terminal Demo Mode, View `D` may show an `iCloudPD authorization` section and View `I` may show NEW AUTH button shells. These are shell-only unless a later slice explicitly wires and proves iCloudPD execution. Older compatibility auth buttons must not appear in View `I`. View `0` and View `6` are unchanged by the auth-shell slice.
