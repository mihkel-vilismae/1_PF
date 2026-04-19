# System Overview

## Purpose

The system manages a media-processing and playback workflow with four user-facing dashboard areas:

- **A = Init** — environment, database, and cron preparation
- **B = Test** — simulation and controlled test execution
- **C = Last Run Info** — inspection and resume context for the latest known run
- **D = Running Process** — live view of the real runtime

The backend does not exist yet in this package. These documents define it before implementation.

## Core System Goals

1. Process media through a strict five-stage pipeline.
2. Maintain one real playback worker and one real screen worker.
3. Persist enough information to survive crash or power loss.
4. Provide an append-only history of important events.
5. Allow the dashboard to read current state and latest run information from a single authoritative source.

## Scope

### In scope

- Canonical runtime state ownership
- Sequential stage execution model
- Worker lifecycle and leases
- Cron triggering and watchdog supervision
- Logging and event schema
- Recovery and resume rules
- Frontend/backend interaction contract

### Out of scope

- Concrete backend framework choice
- Exact database vendor selection
- UI styling decisions
- Authentication implementation details
- Media decoder implementation details

## Terms

- **Run**: one active real runtime session tracked by a `run_session` record.
- **Test run**: frontend-driven or backend-supported simulation activity under view B; never treated as the authoritative real run displayed in view D.
- **Runtime state**: current canonical state of the real system.
- **Checkpoint**: durable save of resumable operational state.
- **Event**: append-only historical record.
- **Lease**: time-bound exclusive claim for a worker role.

## High-Level Operating Model

1. A user initializes prerequisites in view A.
2. A real run is started by backend control logic.
3. The pipeline worker repeatedly performs the five stages in order.
4. Playback and screen workers run concurrently under separate exclusive leases.
5. Runtime state and event history are updated durably.
6. If the system crashes, the backend restores from the last valid checkpoint.
7. The dashboard shows the current or last known truth through views C and D.

## Non-Goals

- Supporting multiple independent real runs at the same time
- Allowing multiple playback workers for the same device or target
- Allowing unordered or parallel execution of the five pipeline stages

## Evidence Basis

Derived from the user's dashboard specification in this chat, especially the distinction between test/simulation and real runtime, the five-stage loop, the separate playback and screen workers, and the requirement to inspect the last run and recover after interruption.
