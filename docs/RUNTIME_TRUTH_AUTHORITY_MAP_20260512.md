# Runtime Truth Authority Map — 2026‑05‑12

## Purpose

This document codifies the final authority model for runtime state and truth in the 12_PF photo‑frame dashboard.  It is snapshot‑safe; it does **not** modify runtime behaviour, frontend UI, backend routes or tests.  It records confirmed decisions about where authoritative runtime state lives and how other sources should be treated.  It sets the stage for implementing consistent runtime projections and monitoring, but it does not implement those features.

## Baseline note

This map is compared against the immutable baseline zip: `12_PF_20260512_1416_documentation_reconciliation_full_git.zip`.

## Confirmed authority decisions

The following decisions were confirmed after cross‑referencing unresolved questions and repository evidence.  They define the canonical truth sources for runtime state:

1. **SQLite as durable truth** – The SQLite database is the authoritative store for persistent runtime state and orchestration snapshots.  Stage results, playback queues, screen state and other durable fields must ultimately be recorded in SQLite.

2. **Lock files for process coordination** – OS lock files are used only to coordinate concurrent processes.  They are not a source of truth for persistent state.  Locks indicate that a worker is active or a pipeline is busy but do not replace SQLite records.

3. **Logs for audit/debugging** – Application logs capture request/response events, worker output and error conditions.  They are not an authoritative state store.  Use logs for auditing and debugging, not for determining current truth.

4. **`conf/runtime‑truth.json` as projection** – The `conf/runtime‑truth.json` file is a transitional or dashboard/test projection of runtime state.  It may mirror parts of SQLite for UI convenience, but it is not authoritative.  It must not be used as the only source of truth, and its contents should be considered stale or partial unless refreshed from SQLite.

5. **Front‑end local state** – UI components maintain transient local state for user interactions.  This state is always subordinate to backend truth.  It must be reset whenever backend projections update.

6. **Backend computed projections** – Backend services may assemble combined runtime projections (e.g. live runtime monitor).  These projections are derived from SQLite, lock files, heartbeats, logs and computed values.  They must declare the source of each field and do not override the underlying authority model.

## Source ownership matrix

| Source | Role | Authority status | Notes |
|---|---|---|---|
| **SQLite database** | Durable persistence of pipeline stages, playback queues, screen state and orchestration snapshots | **Authoritative** | Final truth for persistent runtime state |
| **Lock files** | Indicate active processes and prevent concurrent access | **Coordination only** | Not a state source; do not persist truth here |
| **Application logs** | Record request/response events, worker messages and errors | **Audit/debug only** | Do not infer current truth from logs |
| **`conf/runtime‑truth.json`** | Transitional mirror or dashboard/test projection | **Non‑authoritative** | Useful for UI demo but not the source of truth |
| **Front‑end local state** | Transient UI state for buttons and view components | **Non‑authoritative** | Must refresh from backend projections |
| **Backend computed projections** | Combined view of runtime state assembled from authoritative sources | **Derived only** | Must declare field sources and not override durable truth |

## View‑specific guidance

- **View C (Last Run / Restore)** – The canonical endpoint for reading the last orchestration snapshot should be `/api/runtime/orchestration/last`.  This endpoint must serve a read‑only projection assembled from SQLite.  Restore operations must be implemented separately as controlled mutations after the truth authority model is in place.

- **View D (Live Monitor)** – The live runtime monitor should use a combined backend projection.  Each field in the projection must include a `source` label indicating whether it originates from the database (`db`), a lock file (`lock`), a heartbeat (`heartbeat`), an application log (`log`), a computed value (`computed`), another projection (`projection`) or is unknown (`unknown`).  The UI must display these origins clearly to avoid misleading users.

## Non‑goals

This document does **not**:

- Implement any new endpoints, UI wiring or backend logic.
- Change runtime behaviour, frontend UI or backend routes.
- Introduce restore semantics, namespace isolation or schema migration.
- Resolve all open questions; it simply codifies confirmed authority decisions.

## Recommended next slices

After documenting this authority map and defining runtime projection contracts, future slices should:

1. Add TypeScript contracts for runtime projections and field sources (see the `shared/runtimeProjectionContracts.ts` file).
2. Separate runtime data into distinct namespaces (e.g. `realRuntime`, `testRuntime`, `demoRuntime`) before enabling destructive tests or restore.
3. Add read‑only endpoints exposing last‑run snapshots (`/api/runtime/orchestration/last`) and live runtime projections.
4. Wire View A, C and D to consume these projections in a read‑only manner before adding restore or mutation flows.
