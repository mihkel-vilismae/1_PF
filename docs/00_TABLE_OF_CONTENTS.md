# Table of Contents (Master Control Document)

## Purpose

This document is the **highest-order source of truth for documentation structure**.
It does not replace runtime state. Instead, it controls the documentation set that defines the system.
All other documents are subordinate to this file and must remain consistent with it.

## Document Order and Authority

1. `01_SYSTEM_OVERVIEW.md` — scope, goals, boundaries, terminology
2. `02_SYSTEM_INVARIANTS.md` — non-negotiable rules
3. `03_ARCHITECTURE.md` — component and deployment shape
4. `04_SINGLE_SOURCE_OF_TRUTH.md` — canonical runtime state ownership
5. `05_STATE_MACHINE.md` — allowed states and transitions
6. `06_DATABASE_SCHEMA.md` — durable storage design
7. `07_PIPELINE_STAGES.md` — five-stage processing loop
8. `08_WORKERS_AND_OWNERSHIP.md` — worker roles and write authority
9. `09_CRON_AND_WATCHDOG.md` — scheduling and supervision
10. `10_CONCURRENCY_AND_LOCKING.md` — duplicate prevention and lock recovery
11. `11_LOGGING_AND_EVENT_MODEL.md` — append-only history and event schema
12. `12_STATE_AND_RECOVERY.md` — crash, restart, and resume behavior
13. `13_FRONTEND_BACKEND_CONTRACT.md` — dashboard/API/service contract
14. `14_VERSIONING_AND_CHANGELOG_RULES.md` — change management rules

## Interpretation Rules

- If two documents appear to conflict, precedence is:
  1. `02_SYSTEM_INVARIANTS.md`
  2. `04_SINGLE_SOURCE_OF_TRUTH.md`
  3. `05_STATE_MACHINE.md`
  4. `10_CONCURRENCY_AND_LOCKING.md`
  5. the more specific operational document
- If a rule cannot be enforced in code, it must not appear as a mandatory rule in documentation.
- If the frontend desires a behavior that violates worker ownership, backend ownership wins.

## Coverage Map

| Concern | Primary Document |
|---|---|
| Overall purpose and scope | `01_SYSTEM_OVERVIEW.md` |
| Hard rules | `02_SYSTEM_INVARIANTS.md` |
| Canonical state | `04_SINGLE_SOURCE_OF_TRUTH.md` |
| Locking and duplicate prevention | `10_CONCURRENCY_AND_LOCKING.md` |
| Recovery | `12_STATE_AND_RECOVERY.md` |
| API and UI alignment | `13_FRONTEND_BACKEND_CONTRACT.md` |

## Change Control

- New documentation files must be added here before they become authoritative.
- Removing a file requires updating all references that point to it.
- Any backend implementation proposal that conflicts with this table of contents is invalid until documentation is updated first.

## Evidence Basis

Derived from the user's dashboard specification in this chat, including views A/B/C/D, the five-stage pipeline, playback emulation and real playback, screen on/off behavior, explicit history requirements, resume-after-power-loss expectations, and the need for a single source of truth plus shared frontend/backend service boundaries.

## Frontend View Documentation

The following frontend-facing documents are included and are valid as long as they do not contradict the numbered system documents above:

- `DASHBOARD_OVERVIEW.md`
- `VIEW_A_INIT.md`
- `VIEW_B_TEST.md`
- `VIEW_C_LAST_RUN_INFO.md`
- `VIEW_D_RUNNING_PROCESS.md`

These view documents describe the current UI surface. If a view document conflicts with a numbered system document, the numbered system document wins.

