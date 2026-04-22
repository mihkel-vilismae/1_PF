# Forward-Only Versioning and Changelog Policy

## Purpose

This document defines the enforced forward-only workflow for semantic versioning, changelog updates, and Git hook compliance in this repository.

## Scope

This policy applies from `v0.3.3` forward.

Earlier changelog entries are preserved as legacy history. They are not backfilled, normalized, or rewritten to pretend that the older history was complete.

## Canonical Version Source

`VERSION` is the canonical version source of truth.

The following files must match `VERSION` exactly whenever they are present:

- `package.json`
- `package-lock.json`
- the latest entry in `CHANGELOG.md`

## Semantic Versioning Rules

This repository uses `MAJOR.MINOR.PATCH`.

- `MAJOR` = breaking change
- `MINOR` = backward-compatible feature
- `PATCH` = backward-compatible fix, docs change, test change, maintenance change, or governance/tooling change

### Commit-to-bump mapping

- `feat:` → minor
- `fix:` → patch
- `docs:` → patch
- `refactor:` → patch
- `test:` → patch
- `chore:` → patch
- `feat!:` / `fix!:` / `BREAKING CHANGE:` footer → major

## Commit Message Policy

Commits must follow Conventional Commits with one of these prefixes:

- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`

Optional scopes are allowed.

Plain-English commit headers without an explicit type are automatically rewritten to `chore: <your message>` by the `commit-msg` hook.

Headers that already use an explicit but unsupported type still fail validation so the intent stays unambiguous.

## Changelog Policy

Every new version entry from `v0.3.3` forward must:

- use an Estonian timestamp
- include the version number
- remain forward-only
- include exactly these sections:
  - `Added`
  - `Changed`
  - `Fixed`
  - `Removed`

Each section must contain at least one bullet. Use `- None` when a section has no concrete items for that release.

### Heading format

```md
## YYYY-MM-DD HH:MM EEST — vX.Y.Z
```

`EET` is valid outside daylight saving time.

## Forward-Only Rule

Do not invent missing historical releases.
Do not rewrite old changelog entries just to make them look compliant.
Do not delete older conclusions when updating living documentation.

## Doc-Only Changes Still Count

Documentation-only changes still require:

- a valid commit message
- a SemVer patch bump
- a new changelog entry
- synchronized version files

## Enforcement Tooling

### Validator

```bash
node scripts/version_guard.mjs repo
```

This validates:

- `VERSION`, `package.json`, and `package-lock.json` consistency
- latest changelog entry version matching `VERSION`
- structured changelog requirements for `v0.3.3` and later

Validate a commit message:

```bash
node scripts/version_guard.mjs commit-msg --message "fix: example"
```

### Prepare the next version entry

```bash
node scripts/version_guard.mjs prepare --message "fix: example"
```

That command:

- derives the required bump from the commit intent
- updates `VERSION`
- syncs `package.json`
- syncs `package-lock.json`
- prepends a structured changelog entry template

## Git Hooks

Install repo-local hooks with one of these commands:

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-githooks.ps1
```

### macOS / Linux / Git Bash

```bash
sh ./scripts/install-githooks.sh
```

Installed hooks enforce:

- `commit-msg` → auto-normalize plain commit headers to `chore:` + auto-prepare/auto-stage version metadata when needed + required version bump magnitude
- `pre-commit` → task docs TOC check

## Expected Developer Workflow

1. Make the intended repository change.
2. Stage the intended files.
3. Install hooks once if not already installed.
4. Commit with either a Conventional Commit message or a plain-English subject line.
5. Let the `commit-msg` hook auto-stage an already-prepared version set or generate the next version/changelog entry when it is missing.
6. Optionally edit the generated changelog bullets before retrying the commit if you want richer release notes than `- None`.
7. Optionally run `npm test`.

If you prefer to prepare the version entry yourself before committing, this still works:

```bash
node scripts/version_guard.mjs prepare --message "fix: example"
```

## Notes

- This policy starts strict enforcement going forward from `v0.3.3`.
- Earlier history remains visible but is intentionally left in its original form.
