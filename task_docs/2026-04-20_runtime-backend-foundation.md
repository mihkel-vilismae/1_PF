# Task Doc — Runtime Backend Foundation

## Status

- Proposed on `2026-04-20`
- Scope: build the first honest repo-local runtime backend slice that Views C and D can use as authoritative data sources

## Summary

Implement the next highest-leverage backend/runtime milestone for this repository: replace the frontend-only runtime preview and demo last-run state with a minimal durable runtime backend foundation.

The goal is not to finish the entire product in one pass. The goal is to establish the first real runtime slice behind the existing dashboard so the codebase can move forward from "View A is partly real, Views B/C/D are mostly simulated" to "Views C and D read honest backend projections."

This work should prioritize:

- repo-local runtime state/projection storage
- real `/api/runtime/*` endpoints for current state, workers, last-run, start, and stop
- a dedicated frontend `runtimeService`
- rewiring Views C and D away from default demo/mock runtime state
- documentation updates that keep `placeholder_implementations.md` and `docs/OLD_DOCS/*` aligned with reality

## Current Repo Truth

Based on direct inspection of the current repository:

- `server/index.js` currently implements only `/api/init/*` endpoints
- `server/scheduler_host.js` preserves timing/heartbeat semantics for View A scheduler installation but does not yet run real pipeline/playback/screen/recovery services
- `dashboard/services/runtimeTruth.js` is still the main source of truth for simulated runtime behavior across Views B, C, and D
- `dashboard/views/lastRunView.js` uses manual demo-state controls and seeded demo data instead of backend snapshot loading
- `dashboard/views/runningProcessView.js` uses a local `Start simulated runtime preview` path instead of live runtime projections
- the current repo truth docs for this checkout are under `docs/OLD_DOCS/`, not under top-level `docs/`
- `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md` documents `/api/runtime/*` as planned only
- `docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md` explicitly says Views C and D are still frontend-only/mock
- `placeholder_implementations.md` identifies the major remaining gaps as runtime backend, durable state, worker projections, and real C/D wiring
- `generated_test_data/` exists for test-oriented flows, but it is not yet a substitute for runtime state truth
- current verification surface is minimal: the repo contains `tests/transitGateway.test.js`, but there is no broad backend/runtime test harness yet

## Goals

1. Add the first repo-local runtime backend foundation under `server/`
2. Introduce honest, minimal runtime projections that can power Views C and D
3. Implement the first real `/api/runtime/*` endpoints
4. Rewire the frontend so C and D prefer backend data instead of seeded mock state
5. Keep unsupported or incomplete runtime capabilities explicit instead of faking success
6. Leave the repo in a state where later B/C/D backend work has a real backend shape to build on

## Non-Goals

- Do not fully implement all seven target-state workers in one pass
- Do not claim real iCloud login/download, playback hardware, or screen hardware behavior unless code proves it
- Do not redesign the dashboard layout or visual language
- Do not break existing `/api/init/*` behavior for View A
- Do not silently replace honest "blocked/deferred" responses with fabricated success payloads
- Do not widen the task into unrelated frontend polish or speculative architecture churn

## Why This Is The Next Best Step

The current repo has already crossed the threshold where View A is partially real while the rest of the dashboard still depends heavily on `runtimeTruth.js`.

That means the highest-leverage next move is not another UI-only feature. It is to create the first real runtime backend surface that:

- gives Views C and D a truthful backend source
- establishes the response shapes and storage patterns for later backend work
- creates a foundation that View B can eventually reuse instead of inventing more mock-only state

Without this step, future work risks adding more frontend complexity on top of a runtime model that still only exists in memory.

## Proposed Scope

### Backend

Add a minimal runtime state/projection layer in `server/` that can support:

- current runtime summary
- worker/projection summary
- last-run snapshot
- runtime start
- runtime stop

This can be SQLite-backed, file-backed, or hybrid, but it must be durable enough that it is not merely a mirror of frontend memory.

### Frontend

Add a dedicated `runtimeService` and update Views C and D so:

- C loads last-run data from backend response shapes
- D loads current runtime + worker projections from backend response shapes
- mock/demo controls are no longer the default truth path

### Docs

Update the relevant current-truth docs after implementation so they accurately describe:

- what `/api/runtime/*` now exists
- what remains missing
- which parts of C and D are now real versus still deferred

## Required Implementation Order

1. Inspect the current repo truth before editing:
   - `README.md`
   - `package.json`
   - `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md`
   - `docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`
   - `docs/OLD_DOCS/18_CANONICAL_BACKEND_CONTRACT_SET.md`
   - `docs/OLD_DOCS/19_BACKEND_RUNTIME_CONTRACT.md`
   - `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md`
   - `docs/OLD_DOCS/21_EXECUTION_AND_RECOVERY_CONTRACT.md`
   - `docs/OLD_DOCS/22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md`
   - `placeholder_implementations.md`
   - `dashboard/services/runtimeTruth.js`
   - `dashboard/views/lastRunView.js`
   - `dashboard/views/runningProcessView.js`
   - `server/index.js`
   - `server/scheduler_host.js`

2. Implement the first honest runtime backend storage/projection layer under `server/`

3. Add these endpoints in `server/index.js`:
   - `GET /api/runtime/current`
   - `GET /api/runtime/workers`
   - `GET /api/runtime/last-run`
   - `POST /api/runtime/start`
   - `POST /api/runtime/stop`

4. Define concrete JSON response shapes in code and docs

5. Add a frontend `runtimeService` and wire Views C and D to backend calls

6. Preserve View A behavior and route compatibility

7. Update current-truth docs and placeholder ledger after implementation

8. Verify with build plus direct endpoint smoke tests

## Functional Requirements

### FR1 — Runtime Projection Storage

The backend must own a durable runtime projection source that is not just frontend memory.

Expected behavior:

- state survives beyond a single frontend render cycle
- storage shape is small and honest
- implementation does not pretend the full target backend already exists

### FR2 — `GET /api/runtime/current`

Add an endpoint that returns the authoritative current runtime summary.

Expected behavior:

- clearly reports whether runtime is inactive, active, blocked, or degraded
- includes enough projection data for View D to render meaningful state
- does not fabricate worker success if no worker truly exists

### FR3 — `GET /api/runtime/workers`

Add an endpoint that returns worker or worker-like projection summaries.

Expected behavior:

- distinguishes real worker state from inactive/deferred/not-implemented state
- returns clear messages for missing capabilities
- stays consistent with the current host/runtime code

### FR4 — `GET /api/runtime/last-run`

Add an endpoint that returns the last-run snapshot used by View C.

Expected behavior:

- supports honest `no run yet`, `snapshot available`, and `error` style outcomes
- returns concrete fields instead of forcing the frontend to seed demo state
- remains truthful if recovery details are not fully implemented yet

### FR5 — `POST /api/runtime/start`

Add an endpoint that starts the minimal runtime slice.

Expected behavior:

- writes durable state that runtime has started
- avoids duplicate-start confusion
- returns an honest response if only a minimal preview/runtime skeleton exists

### FR6 — `POST /api/runtime/stop`

Add an endpoint that stops the minimal runtime slice.

Expected behavior:

- writes durable state that runtime has stopped
- updates last-run projection appropriately
- stays idempotent or rejects duplicates clearly

### FR7 — Frontend Runtime Service

Add a dedicated service layer for `/api/runtime/*`.

Expected behavior:

- frontend transport logic stays out of the views
- response and error handling follow the existing View A pattern where useful
- C and D stop depending on mock/demo state as the default source

### FR8 — Honest View C Wiring

Update View C so backend data is the default truth source.

Expected behavior:

- manual demo controls should be removed, hidden behind a dev-only path, or clearly marked as non-default
- last-run cards render backend snapshot fields
- error and empty states come from real backend outcomes

### FR9 — Honest View D Wiring

Update View D so backend data is the default truth source.

Expected behavior:

- the local "simulated runtime preview" path no longer acts as the main runtime source
- D reads current runtime and worker projections from the backend
- UI text stays honest about what is truly implemented

### FR10 — Documentation Alignment

After implementation, update:

- `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md`
- `docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`
- relevant C/D view docs under `docs/OLD_DOCS/`
- `placeholder_implementations.md`

The docs must clearly separate:

- what became real in this milestone
- what remains blocked, deferred, or mock-only

## Suggested File Touch Points

Most likely files:

- `server/index.js`
- new runtime-related helpers under `server/`
- `dashboard/services/apiClient.js`
- `dashboard/services/runtimeService.js`
- `dashboard/services/runtimeTruth.js`
- `dashboard/views/lastRunView.js`
- `dashboard/views/runningProcessView.js`
- `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md`
- `docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`
- `docs/OLD_DOCS/VIEW_C_LAST_RUN_INFO.md`
- `docs/OLD_DOCS/VIEW_D_RUNNING_PROCESS.md`
- `placeholder_implementations.md`

## Risks / Open Questions

1. The target-state contracts are much broader than the minimal runtime slice this repo can realistically land in one pass
2. Worker projections may initially represent skeleton/inactive/deferred services rather than full live worker processes
3. The exact durable storage mechanism may need to be smaller than the full documented schema to stay implementation-realistic
4. Existing View C/D frontend logic may assume seeded structures that need careful reshaping
5. If the runtime start/stop semantics are too ambitious, the first slice should prefer honest admin-style control over fake live orchestration

## Acceptance Criteria

- `/api/runtime/current` exists and returns a usable current-runtime projection
- `/api/runtime/workers` exists and returns usable worker/projection data
- `/api/runtime/last-run` exists and supports empty/ready/error style outcomes honestly
- `/api/runtime/start` and `/api/runtime/stop` exist and update durable backend truth
- View C reads backend last-run data by default
- View D reads backend runtime/worker data by default
- existing View A behavior still works
- docs and placeholder ledger are updated to match the new reality
- `npm run build` passes after the changes

## Codex-Ready Implementation Prompt

Continue implementation of the `1_PF` repository at `I:\___006_1904\1_PF`.

Your task is to implement the next highest-leverage backend/runtime milestone: create the first honest repo-local runtime backend foundation so Views C and D can stop relying on default frontend-only simulated state.

Work against actual repo truth, not aspirational architecture.

Current repo truth you must honor:

- In this checkout, the authoritative docs are under `docs/OLD_DOCS/`, not top-level `docs/`
- View A `/api/init/*` is already implemented in `server/index.js`
- `server/scheduler_host.js` currently reports heartbeat/tick state only; it does not yet run real pipeline/playback/screen/recovery services
- Views B, C, and D still depend heavily on `dashboard/services/runtimeTruth.js`
- `placeholder_implementations.md` is the implementation-gap ledger and must stay honest
- `generated_test_data/` exists for test-oriented work but is not a substitute for runtime truth
- start services with `npm run api` and `npm run dev`
- verify builds with `npm run build`

Read first:

- `README.md`
- `package.json`
- `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md`
- `docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`
- `docs/OLD_DOCS/18_CANONICAL_BACKEND_CONTRACT_SET.md`
- `docs/OLD_DOCS/19_BACKEND_RUNTIME_CONTRACT.md`
- `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md`
- `docs/OLD_DOCS/21_EXECUTION_AND_RECOVERY_CONTRACT.md`
- `docs/OLD_DOCS/22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md`
- `placeholder_implementations.md`
- `dashboard/services/runtimeTruth.js`
- `dashboard/views/lastRunView.js`
- `dashboard/views/runningProcessView.js`
- `server/index.js`
- `server/scheduler_host.js`

Required implementation order:

1. Build a minimal repo-local runtime state/projection layer under `server/`
   - use durable local storage where practical
   - prefer SQLite/file-backed truth over frontend-only memory
   - keep the implementation honest if some contracts are still blocked

2. Implement the first real runtime endpoints:
   - `GET /api/runtime/current`
   - `GET /api/runtime/workers`
   - `GET /api/runtime/last-run`
   - `POST /api/runtime/start`
   - `POST /api/runtime/stop`

3. Define concrete JSON response shapes for those endpoints in code and docs
   - return authoritative projection data
   - if a capability is not truly implemented yet, return an honest blocked/deferred/inactive response instead of fake success

4. Add a dedicated frontend `runtimeService` and rewire Views C and D to backend data
   - stop using seeded demo data as the default source for C
   - stop using local fake runtime-preview state as the default source for D
   - keep any demo-only controls only if clearly marked and dev-scoped

5. Keep View A working as-is
   - do not break or rename existing `/api/init/*` endpoints
   - preserve the current scheduler capability model unless code-and-doc updates clearly justify a better implementation

6. Update docs after implementation
   - update `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md`
   - update `docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`
   - update the relevant view docs for C and D
   - update `placeholder_implementations.md` to reflect what became real versus what remains missing

7. Verify the work
   - run `npm run build`
   - smoke-test the new runtime endpoints directly
   - add focused tests only where they fit the existing repo; do not invent a large new test harness

Guardrails:

- do not redesign the dashboard layout
- do not claim real login/download/hardware behavior unless code proves it
- do not blur current implementation truth with target-state docs
- prefer one honest vertical slice over broad speculative scaffolding
- if you touch `task_docs/`, update `task_docs/_TABLE_OF_CONTENTS.md` in the same patch

Required final output:

- what endpoints were implemented
- what frontend views were rewired
- what remains blocked or deferred
- which docs were updated
- what verification was run

## GitHub Issue / Spec-Style Task Description

Build the first runtime backend foundation for `1_PF` so the dashboard can stop treating Views C and D as frontend-only runtime simulations.

Deliver a minimal durable backend slice under `server/` with real `/api/runtime/*` endpoints for current runtime, workers, last-run, start, and stop. Add a frontend `runtimeService` and rewire Views C and D to backend projections instead of default seeded demo/runtime-preview state. Keep View A stable, preserve route compatibility for `/api/init/*`, and update the current-truth docs plus `placeholder_implementations.md` so the repo’s implementation status remains honest.
