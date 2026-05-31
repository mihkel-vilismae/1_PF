---
name: view-a-init-reconciliation
description: Use when analyzing or repairing View A in the PF_login dashboard so the Init UI, backend contract, runtime behavior, and current-truth docs stay aligned without inventing implementation status.
---

# View A Init Reconciliation

Use this skill when the task is to analyze, reconcile, or fix `A — Init` in the `PF_login` dashboard.

## Read First

1. `README.md`
2. `docs/table_of_contents.md`
3. `docs/DOC_INDEX.md`
4. `docs/DOC_FRESHNESS_MATRIX.md`
5. `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md`
6. `docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md`
7. `docs/50_audits_and_migrations/placeholder_implementations.md`
8. Current code and tests for the specific View A action being checked

## Core Workflow

1. Confirm the runtime mode before diagnosing contradictions.
   - check whether the frontend is being served from Vite, `dist/`, or another host
   - check whether the repo-local init API process is actually running
   - verify whether `127.0.0.1:4301` or the current `/api` target is reachable
2. Separate failure classes before proposing fixes.
   - API process absent or unreachable
   - frontend transport/proxy issue
   - backend handler error
   - contract mismatch between frontend and backend
   - doc drift or over-optimistic UI wording
3. Verify each View A action with evidence.
   - `POST /api/init/verify-env`
   - `GET /api/init/database/status`
   - `POST /api/init/database/inspect`
   - `POST /api/init/database/delete`
   - `POST /api/init/database/recreate-empty`
   - `POST /api/init/cron/install`
   - `GET /api/init/cron/status`
   - `GET /api/init/cron/print`
4. Build a contradiction ledger.
   - what the UI claims
   - what the docs claim
   - what the code implements
   - what the live runtime actually does
5. Recommend the smallest honest fix order.
   - startup or reachability fix first
   - handler or payload fix second
   - UI wording and docs last unless they are the only contradiction

## Required Outputs

- a root-cause summary that distinguishes operational failure from implementation failure
- a per-endpoint status table
- a contradiction list with exact file references
- a minimal fix sequence
- doc updates only where repo evidence supports them

## Guardrails

- Do not treat a dead API process as proof that endpoint code is missing.
- Do not claim B, C, or D are backend-backed.
- Do not claim the scheduler host runs real business services unless code proves it.
- Do not update `docs/50_audits_and_migrations/placeholder_implementations.md` unless implementation status actually changed.
