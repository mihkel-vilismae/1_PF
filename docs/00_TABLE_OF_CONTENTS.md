# Table of Contents (Master Control Document)

## Purpose

This document controls the documentation set for this repository.
It distinguishes between:

1. **current implementation documentation** for what exists in the uploaded repository now, and
2. **target architecture documentation** for future backend implementation.

It does not replace runtime state. It organizes documentation authority and reading order.

## Most Important Interpretation Rule

The documentation set has two different truth modes:

- **Current implementation truth** = what is inspectable in this repository right now.
- **Target architecture truth** = design constraints for backend work that does not yet exist in this repository.

A reader must not confuse target-state rules with already-implemented behavior.

## Reading Order

### A. Current implementation documents

Read these first when the question is: **what is implemented now?**

1. `15_CURRENT_IMPLEMENTATION_STATUS.md` — repository reality, implemented vs missing
2. `16_DOCUMENTATION_RECONCILIATION_REPORT.md` — repo-to-doc reconciliation and doc update report
3. `DASHBOARD_OVERVIEW.md` — current frontend scope and wiring status
4. `VIEW_A_INIT.md` — current state of view A
5. `VIEW_B_TEST.md` — current state of view B
6. `VIEW_C_LAST_RUN_INFO.md` — current state of view C
7. `VIEW_D_RUNNING_PROCESS.md` — current state of view D
8. `issues_errors_discrepancies.md` — issue registry and implementation-level corrections

### B. Target architecture documents

Read these second when the question is: **what should the later backend implementation follow?**

9. `01_SYSTEM_OVERVIEW.md` — scope, goals, boundaries, terminology
10. `02_SYSTEM_INVARIANTS.md` — non-negotiable target rules
11. `03_ARCHITECTURE.md` — component and deployment shape
12. `04_SINGLE_SOURCE_OF_TRUTH.md` — canonical runtime state ownership
13. `05_STATE_MACHINE.md` — allowed states and transitions
14. `06_DATABASE_SCHEMA.md` — durable storage design
15. `07_PIPELINE_STAGES.md` — five-stage processing loop
16. `08_WORKERS_AND_OWNERSHIP.md` — worker roles and write authority
17. `09_CRON_AND_WATCHDOG.md` — scheduling and supervision
18. `10_CONCURRENCY_AND_LOCKING.md` — duplicate prevention and lock recovery
19. `11_LOGGING_AND_EVENT_MODEL.md` — append-only history and event schema
20. `12_STATE_AND_RECOVERY.md` — crash, restart, and resume behavior
21. `13_FRONTEND_BACKEND_CONTRACT.md` — dashboard/API/service contract for future wiring
22. `14_VERSIONING_AND_CHANGELOG_RULES.md` — change-management rules

## Authority Rules

### For questions about current code

The following documents take precedence:

1. `15_CURRENT_IMPLEMENTATION_STATUS.md`
2. `16_DOCUMENTATION_RECONCILIATION_REPORT.md`
3. the inspected repository files themselves
4. the view docs and dashboard overview
5. `issues_errors_discrepancies.md`

### For questions about future backend implementation

The following documents take precedence:

1. `02_SYSTEM_INVARIANTS.md`
2. `04_SINGLE_SOURCE_OF_TRUTH.md`
3. `05_STATE_MACHINE.md`
4. `10_CONCURRENCY_AND_LOCKING.md`
5. the more specific target-state operational document

## Additional Interpretation Rules

- If a behavior is described in a target architecture doc but no supporting code exists in the repository, it is **planned**, not implemented.
- If a frontend mock simulates a backend concept, the mock remains non-authoritative.
- If a rule cannot yet be enforced in code, it must be treated as a target implementation requirement unless explicitly documented as currently enforced.
- If the frontend desires a behavior that violates future worker ownership, the target ownership rule still governs backend implementation.

## Coverage Map

| Concern | Current Implementation Document | Target Architecture Document |
|---|---|---|
| Repo reality | `15_CURRENT_IMPLEMENTATION_STATUS.md` | `01_SYSTEM_OVERVIEW.md` |
| Dashboard scope | `DASHBOARD_OVERVIEW.md` | `13_FRONTEND_BACKEND_CONTRACT.md` |
| Current view behavior | `VIEW_A_INIT.md` etc. | `13_FRONTEND_BACKEND_CONTRACT.md` |
| Canonical state target | — | `04_SINGLE_SOURCE_OF_TRUTH.md` |
| Locking target | issue registry + frontend guards | `10_CONCURRENCY_AND_LOCKING.md` |
| Recovery target | view C current placeholder behavior | `12_STATE_AND_RECOVERY.md` |

## Change Control

- New implementation-truth docs must be added here before they become authoritative.
- New target-architecture docs must also be added here before they become authoritative.
- Removing a file requires updating all references that point to it.
- Backend implementation proposals must preserve the distinction between current reality and target architecture unless the repo is actually updated to close that gap.

## Operational Registry

- `issues_errors_discrepancies.md` is the append-only operational issue registry.
- It records open, in-progress, resolved, and verified issues without deleting history.

## Evidence Basis

Derived from direct inspection of the uploaded repository, especially the split between the implemented Vite frontend in `dashboard/` and the forward-looking backend architecture documents in `docs/01` through `docs/14`.
