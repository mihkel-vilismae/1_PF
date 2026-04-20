# View A Init Reconciliation Prompt

## Purpose

This document captures a stronger prompt for analyzing what must be done so **View A** works correctly, honestly, and without contradictions between the UI, backend, and documentation.

It also records why the weaker prompt shape is insufficient.

## Critique Of The Current Prompt

The current prompt input is useful as raw evidence, but weak as an execution prompt.

Main problems:

- it mixes UI copy, failing runtime logs, and desired outcome without telling the agent how to separate them
- it assumes the failures must be backend-logic defects, even though View A also depends on the repo-local init API process actually being reachable
- it does not require checking whether `/api/init/*` failures come from a dead server, proxy problem, handler error, or contract mismatch
- it does not force the agent to distinguish **current repo truth** from **target-state design**
- it does not ask for a contradiction ledger, so an agent can produce vague advice instead of a precise reconciliation
- it does not define the acceptable scope, so the agent can drift into B/C/D or into future runtime architecture
- it asks for “what to do” but does not define the required deliverables, evidence standard, or doc updates

## Refined Prompt

```text
You are analyzing the `1_PF` repository to determine exactly what must be done so `A — Init` works correctly, interacts with the backend honestly, and contains no contradictions between frontend behavior, backend behavior, and documentation.

Use the repo as the source of truth.

Before proposing fixes, use the local workflow in `.codex/skills/view-a-init-reconciliation/SKILL.md` together with the relevant existing photo-frame docs.

Your scope is View A only:
- 1A Verify `.env`
- 2A Database controls
- 3A Scheduler controls

Do not drift into implementing or redesigning B, C, or D unless a View A dependency truly requires it.

Required analysis workflow:

1. Inspect the current implementation truth first:
   - `README.md`
   - `docs/15_CURRENT_IMPLEMENTATION_STATUS.md`
   - `docs/VIEW_A_INIT.md`
   - `docs/13_FRONTEND_BACKEND_CONTRACT.md`
   - `docs/09_CRON_AND_WATCHDOG.md`
   - `placeholder_implementations.md`
   - relevant frontend/backend files under `dashboard/` and `server/`

2. Verify runtime prerequisites before blaming the handlers:
   - determine how the frontend is being served
   - determine whether the repo-local init API is actually running
   - check whether `127.0.0.1:4301` or the active `/api` target is reachable
   - explicitly separate:
     - API process not running
     - proxy or transport failure
     - backend route exists but throws
     - contract mismatch between frontend and backend
     - UI wording or documentation contradiction

3. Test each View A endpoint directly and capture the exact outcome:
   - `POST /api/init/verify-env`
   - `GET /api/init/database/status`
   - `POST /api/init/database/inspect`
   - `POST /api/init/database/delete`
   - `POST /api/init/database/recreate-empty`
   - `POST /api/init/cron/install`
   - `GET /api/init/cron/status`
   - `GET /api/init/cron/print`

4. Build a contradiction ledger for View A:
   - what the UI text claims
   - what the frontend code actually does
   - what the backend code actually implements
   - what the current docs claim
   - what the live runtime proves

5. Classify every contradiction as one of:
   - operational prerequisite missing
   - frontend bug
   - backend bug
   - backend incomplete by design
   - documentation drift
   - wording/expectation problem only

6. Produce the smallest honest fix order.
   - fix startup/reachability problems before deeper endpoint changes
   - preserve the legacy `/api/init/cron/*` route names unless there is code-and-doc agreement to rename them
   - do not claim that the scheduler host runs real pipeline/playback/screen/recovery services unless code proves it

7. Update the docs after the analysis so they match repo truth.
   - update `docs/VIEW_A_INIT.md`
   - update `docs/15_CURRENT_IMPLEMENTATION_STATUS.md`
   - update `placeholder_implementations.md` only if implementation status actually changed
   - update any prompt or guidance docs that were materially improved by the work

Required final output:
- a short root-cause summary
- a per-endpoint findings table
- a contradiction table with file references
- a minimal action plan in execution order
- a list of documents updated and why

Important guardrails:
- do not assume every UI `500` means a broken handler
- do not invent backend features that are not present in `server/`
- do not blur current implementation truth with future architecture intent
- do not widen the task into B/C/D stabilization
```

## Why This Prompt Is Better

It forces the analysis agent to prove whether the problem is:

- missing runtime setup
- an actual backend defect
- a frontend/backend contract mismatch
- documentation or wording drift

That distinction matters because View A can look “broken” even when the repo code exists, simply because the separate init API process is not running or reachable.
