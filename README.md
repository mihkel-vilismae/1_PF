# Photo Frame Dashboard System

## 1. Project Overview

This repository contains a dashboard-driven system for managing a staged photo-processing pipeline and playback simulation.

The system includes:
- a browser-based dashboard (Vite frontend)
- staged pipeline controls (download → index → GPS → geocode → queue → playback)
- an inspect/metadata system for explaining UI state
- a repo-local versioning and changelog enforcement system

This is a **partially implemented system** with a mix of real backend wiring and simulated behavior.

## Authoritative Behavioral Spec (Top Priority)

For high-level behavioral intent and requirement authority, use:

- `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md`

This is the highest-level authoritative behavior document in this repository. If wording conflicts with lower-level working docs, treat this spec as the source of truth unless explicitly superseded by a newer user-approved authority document.

## 2. Current System State

The system is **not fully backend-complete**.

| Area | State |
|------|------|
| View A (Init) | Real backend endpoints |
| View B (Test) | Mixed (real + mock) |
| View C (Last Run Info) | Mock/demo only |
| View D (Running Process) | Simulated runtime preview |

Key facts:
- Some pipeline stages already call real endpoints.
- Other stages are still simulated or placeholder-backed.
- Runtime behavior in View D is a preview, not real worker execution.
- Inspect modes are important because they expose the difference between implementation truth, backend status, and value provenance.

## 3. Architecture Overview

High-level components:
- `dashboard/` — frontend UI, views A–D, inspect system
- `docs/` — system documentation and control files
- `scripts/` — local tooling, including repo governance helpers
- shared runtime-truth state — frontend state layer used by hybrid and simulated surfaces

The repository follows a stage-based pipeline model, but only part of that model is currently wired to real backend behavior.

## 4. Dashboard Views

### View A — Init
Real backend-backed initialization surfaces for environment checks, database setup, and scheduler-related actions.

### View B — Test
Hybrid test area. Some actions are wired to real endpoints, while other stages and preview surfaces remain mock/simulated.

### View C — Last Run Info
Demo-oriented view. It does not currently restore real saved run state from a backend implementation.

### View D — Running Process
Simulated runtime preview. It displays worker-like state and screen/playback surfaces, but it is not a real runtime worker dashboard yet.

## 5. How to Run

Install dependencies:

```bash
npm install
```

Start the dashboard:

```bash
npm run dev
```

Open in a browser:

```text
http://localhost:5173/
```

What you should expect:
- a dashboard with Views A–D
- inspect modes that explain UI surfaces
- a mix of real and simulated behavior depending on the view and card

## 6. Versioning and Changelog System

This repository uses forward-only SemVer enforcement.

Version format:

```text
MAJOR.MINOR.PATCH
```

Supported commit prefixes:

```text
feat:
fix:
docs:
refactor:
test:
chore:
```

Breaking-change markers:

```text
feat!:
fix!:
BREAKING CHANGE:
```

Local enforcement is provided by:
- `.githooks/commit-msg`
- `.githooks/pre-commit`
- `scripts/version_guard.mjs`

Hook install commands:

```bash
powershell -ExecutionPolicy Bypass -File scripts/install-githooks.ps1
# or
sh scripts/install-githooks.sh
```

Important rule:
- no backfilling missing historical changelog history
- strict structured changelog enforcement applies going forward from the governance rollout point

## 7. Repository Structure

```text
dashboard/        frontend views and inspect system
docs/             documentation bundle and control docs
scripts/          helper scripts and repo tooling
.githooks/        repo-local Git hooks
tests/            test suite
VERSION           canonical repo version
CHANGELOG.md      forward-only changelog
```

## 8. Documentation Map

Key documentation entrypoints:
- `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` (highest-level behavior authority)
- `docs/VERSIONING_AND_CHANGELOG_POLICY.md`
- `docs/buttons_and_implementation_overview.md`
- `docs/IMPLEMENTATION_STATUS_AUDIT.md`
- the system-doc bundle under `docs/`

This README is the repo entrypoint. Deeper implementation details belong in the dedicated docs.

## 9. Development Workflow

Before committing:
1. use a valid conventional-style commit message
2. update version/changelog when required
3. run the repo validator

Manual validation:

```bash
node scripts/version_guard.mjs repo
```

Optional helper flow:

```bash
node scripts/version_guard.mjs prepare --message "feat: example change"
```

## Notes

- Do not assume full pipeline completeness.
- Do not assume View D is real runtime execution.
- Where UI wording and implementation differ, trust code and inspect metadata rather than surface phrasing alone.
