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
├─ start_win.cmd
├─ start_gui.cmd
├─ start_scripts/
│  └─ start_win.ps1
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

The HOW_TO_RUN file should provide practical run instructions, preferably Windows-first when relevant. It should include:

- Prerequisites.
- Install commands.
- Start commands.
- Test commands.
- Expected console output or UI result.
- Common failures and fixes.
- Linux/macOS instructions only when applicable, preferably after the Windows section.

### CHANGELOG.md

The changelog should be maintained automatically whenever functionality changes. It should follow forward-only version history and avoid retroactive fabrication.

Recommended structure:

```markdown
# Changelog

## [0.1.0] - YYYY-MM-DD

### Added
- Initial project structure.

### Changed
- None.

### Fixed
- None.

### Removed
- None.
```

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

### start_win.cmd / start_gui.cmd

At least one simple root-level Windows launcher should exist when the project is intended to be run on Windows.

Expected behavior:

- Easy double-click startup.
- Clear error output if prerequisites are missing.
- Does not silently fail.
- Delegates more complex logic to scripts inside `start_scripts/`.

### start_scripts/start_win.ps1

PowerShell startup logic should live here when needed. The root `.cmd` file should remain simple and user-friendly.

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

- [ ] Project folder created.
- [ ] Git repository initialized.
- [ ] `.gitignore` added.
- [ ] Git author configured as `Mihkel Vilismäe (AI-assisted) <mihkel.vilismae@gmail.com>`.
- [ ] Upstream remote added if known.
- [ ] If upstream is unknown, repository remains local without fake remote.
- [ ] Initial commit created.

### B. Required Documentation

- [ ] `README.md` created.
- [ ] `README.md` explains what the project does.
- [ ] `README.md` includes install/run/test/package commands.
- [ ] `README.md` includes expected command results.
- [ ] `README.md` summarizes visible screens or flows.
- [ ] `HOW_TO_RUN.md` created.
- [ ] `HOW_TO_RUN.md` is Windows-first when relevant.
- [ ] Linux/macOS instructions are included only when applicable.
- [ ] `CHANGELOG.md` created.
- [ ] `main-goal-readme.md` created.
- [ ] Main project goal is clearly written.
- [ ] Documentation mentions real vs mock behavior where relevant.

### C. Versioning

- [ ] Initial version selected.
- [ ] SemVer used where practical.
- [ ] Version appears in appropriate project metadata.
- [ ] Visual apps show the current version in the top-right corner where practical.
- [ ] Visible version badge uses the shared/project metadata version source where practical.
- [ ] `CHANGELOG.md` includes the initial version entry.
- [ ] Version is updated when functionality changes.

### D. Start Scripts

- [ ] `start_win.cmd` or `start_gui.cmd` exists when Windows startup is needed.
- [ ] `start_scripts/start_win.ps1` exists when PowerShell startup logic is needed.
- [ ] Startup scripts print clear errors when prerequisites are missing.
- [ ] Startup scripts do not silently fail.
- [ ] Startup commands are documented in `README.md` and `HOW_TO_RUN.md`.

### E. Logs

- [ ] `logs/` folder exists.
- [ ] `logs/error.log` exists.
- [ ] `logs/debug.log` exists.
- [ ] `logs/full_log.log` exists.
- [ ] Timestamped runtime log pattern is documented: `log_{datetime}.log`.
- [ ] Runtime errors are written to logs.
- [ ] Important runtime actions are logged.

### F. Tests

- [ ] `tests/` folder exists when practical.
- [ ] Smoke tests exist for startup/basic functionality.
- [ ] Functional tests exist for core behavior where practical.
- [ ] Regression tests are added for fixed bugs.
- [ ] Test commands are documented.
- [ ] Tests pass before commit when possible.

### G. Dashboard / UI Inspection Controls

- [ ] `Explain controls` exists where applicable.
- [ ] `Explain values` exists where applicable.
- [ ] `Show real vs mock` exists where applicable.
- [ ] `Show/Hide backend status` exists where applicable.
- [ ] UI clearly distinguishes real data from mock/demo data.
- [ ] UI does not claim backend success without backend confirmation.
- [ ] Inspect metadata is kept synchronized with actual behavior.

### H. Real vs Mock Safety

- [ ] Mock/demo behavior is explicitly labeled.
- [ ] Real/backend-confirmed behavior is explicitly labeled.
- [ ] Cached or inferred data is not presented as confirmed truth.
- [ ] Failure states are visible and honest.
- [ ] No fake success states are shown.

### I. Packaging

- [ ] `CREATE_TRASNFERABLE.cmd` exists when archive generation is needed.
- [ ] `scripts/pack_repo_zip.py` or equivalent packaging script exists.
- [ ] `zip_ignore.json` exists.
- [ ] Packaging excludes ignored/generated files.
- [ ] ZIP includes `.git` history when required.
- [ ] ZIP naming follows `{project_folder}_{creation_datetime}_{VERSION}.zip`.
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

