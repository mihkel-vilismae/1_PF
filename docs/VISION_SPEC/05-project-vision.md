# Project Vision

Status: Slice 2 current vision draft.
Created: 2026-04-26 19:59 EEST.
Source basis: Slice 1 authority map, root README, authoritative voice/spec documentation, implementation audit, button/view evidence, and selected code verification.

## One-sentence vision

The project is a dashboard-observable photo-frame system that turns a staged media pipeline into an eventually autonomous slideshow runtime, while keeping test flows, real runtime flows, logs, locks, and implementation truth visible enough for safe development and recovery.

## Product intent

The intended product is not only a visual slideshow. It is a controlled photo-frame operating system for downloading media, indexing it, extracting GPS data, resolving addresses, preparing a slideshow queue, selecting playback media, and monitoring whether the runtime can continue after restarts or power loss.

The dashboard exists because the runtime is being built in a staged, evidence-driven way. It must expose what is real, what is simulated, what is placeholder-backed, and what still needs user or implementation decisions.

## Primary user outcomes

| Outcome | Status | Meaning |
|---|---|---|
| Run and inspect setup checks | IMPLEMENTED | View A calls backend init endpoints for environment and database checks. |
| See whether auth/provider readiness is safe to proceed | PARTIAL | View A has backend-owned auth controls and safe state projection, but real-world iCloud validation remains manually verified. |
| Test the staged media pipeline | PARTIAL | View B calls real backend routes for several stages, but the download stage is mock-copy based and geocoding is deterministic placeholder-backed. |
| Understand real vs mock behavior | PARTIAL | Inspect metadata and badges exist, but some section-level and action-level truth can still differ. |
| Resume or inspect the last real run after outage | PLANNED | View C is still a frontend-only recovery preview. |
| Monitor live workers | PLANNED | View D is still a frontend-only runtime preview. |
| Run autonomous workers indefinitely | DOCUMENTED_INTENT | Worker, lock, cron, and recovery behavior are described as target behavior; Slice 3 must specify it more tightly. |

## Product shape

The project should be understood as three connected layers:

1. **Development and verification dashboard** — browser UI for setup, test execution, inspection, and recovery visibility.
2. **Backend pipeline and state services** — Node server plus SQLite helper code that owns real stage operations where implemented.
3. **Target autonomous runtime** — future worker and scheduler model intended to run on deployment platforms, especially Raspberry Pi OS, with Windows and Fedora used for development or intermediate scheduler work.

## Vision principles

| Principle | Status | Explanation |
|---|---|---|
| Evidence over labels | IMPLEMENTED / DOCUMENTED_INTENT | UI wording must not override backend/code evidence or inspect metadata. |
| Test and real environments remain separated | DOCUMENTED_INTENT / PARTIAL | The authoritative spec requires separation; implementation has environment validation support but must continue hardening. |
| One stage at a time | DOCUMENTED_INTENT / PARTIAL | View B and orchestration work point toward sequential execution; full worker lock semantics are Slice 3 territory. |
| No fake provider success | IMPLEMENTED / PARTIAL | Auth routes are backend-owned and conservative; real provider behavior still needs manual validation. |
| Runtime recovery must be inspectable | PLANNED | View C and View D show intended surfaces but are not real recovery/runtime monitors yet. |
| Deprecated docs must be harvested before relocation | IMPLEMENTED FOR DOC WORKFLOW | Slice 1 created a deprecated/superseded docs log; Slice 2 starts harvesting into current specs without moving files. |

## What the project is not yet

- It is not yet a fully autonomous Raspberry Pi photo-frame runtime.
- It is not yet a fully live worker dashboard.
- It is not yet a production iCloud integration proven through automated tests.
- It is not yet a fully reconciled documentation set; Slice 3 still needs to finish architecture, worker, auth, scheduler, runtime recovery, and final reconciliation docs.

## Target reader

These vision/specification docs are intended for:

- the user making product and architecture decisions;
- another AI agent continuing implementation;
- a developer verifying current behavior before refactoring;
- a documentation curator deciding which older docs can become parsed references or deletion candidates.
