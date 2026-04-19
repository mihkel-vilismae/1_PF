# Current Implementation Status

## Purpose

This document describes what is actually implemented in the uploaded repository snapshot.
It is the primary implementation-truth document for this repo.

## Repository Reality Summary

The repository currently implements a **frontend-only dashboard prototype** built with Vite.
Its runtime behavior is driven by an **in-memory mock state service** rather than a real backend.

The repository also includes a substantial target-state documentation bundle for later backend implementation, but that backend is not present yet.

## Implemented Now

### Frontend shell and build

Implemented:

- Vite project setup via `package.json`
- development and production build scripts
- frontend app rooted in `dashboard/`
- built output in `dist/`

Evidence:

- `package.json`
- `vite.config.js`
- `dist/`

### Dashboard structure

Implemented:

- four views: A, B, C, D
- sidebar navigation
- current-truth side panel
- event history panel
- topbar action area
- shared rendering helpers

Evidence:

- `dashboard/app.js`
- `dashboard/shared/constants.js`
- `dashboard/services/renderers.js`
- `dashboard/views/`

### Mock runtime truth and simulation

Implemented:

- in-memory state object
- subscription-based rerendering
- per-card logs
- event history
- mock action dispatch
- frontend guards against overlapping simulated actions in key areas
- simulated pipeline sequencing
- simulated playback state
- simulated screen-state interaction with playback preview/status

Evidence:

- `dashboard/services/runtimeTruth.js`
- `docs/issues_errors_discrepancies.md`

### Generated test data

Implemented:

- generated image/video sample tree used by the mock/test UI documentation and intended simulation flows

Evidence:

- `generated_test_data/`
- `generated_test_data/manifest.json`
- `generated_test_data/README.md`

## Not Implemented Now

### Backend/API

Not present in this repository snapshot:

- backend server code
- HTTP API endpoints
- request validation layer
- backend services for cron, database, playback, screen, pipeline, or recovery

### Durable storage

Not present in this repository snapshot:

- database schema implementation
- migrations
- runtime-state persistence
- checkpoint persistence
- worker lease persistence
- event-log persistence

### Real worker/runtime system

Not present in this repository snapshot:

- real pipeline worker
- real playback worker
- real screen worker
- cron-installed execution loop
- watchdog process
- durable last-run restoration

### Real external integrations

Not present in this repository snapshot:

- real `.env` verification
- real database inspect/delete/recreate actions
- real cron install/check/print actions
- real login/download/test execution
- real playback control
- real screen hardware activity handling

## Status by View

### View A — Init

Current state:

- implemented as frontend cards, buttons, status labels, and logs
- actions are placeholders against in-memory state
- no real environment/database/cron operation exists

Primary files:

- `dashboard/views/initView.js`
- `dashboard/services/runtimeTruth.js`

### View B — Test

Current state:

- implemented as simulation UI
- mock download and staged pipeline behavior are frontend-driven
- playback emulation and screen simulation are mock behaviors only
- does not touch a real backend or durable runtime

Primary files:

- `dashboard/views/testView.js`
- `dashboard/services/runtimeTruth.js`
- `generated_test_data/`

### View C — Last Run Info

Current state:

- implemented as a frontend presentation of mock last-run states
- can show none / error / ready modes in-memory
- restore action is a placeholder
- no real durable state loading exists

Primary files:

- `dashboard/views/lastRunView.js`
- `dashboard/services/runtimeTruth.js`

### View D — Running Process

Current state:

- implemented as a frontend-only monitoring layout
- “real run” activation is simulated inside the frontend state service
- worker rows and heartbeats are mock projections, not live process telemetry

Primary files:

- `dashboard/views/runningProcessView.js`
- `dashboard/services/runtimeTruth.js`

## Interpretation Rules

- If a document describes API endpoints, worker leases, DB tables, cron behavior, or checkpoint recovery, that is target-state design unless matching implementation files are present.
- The in-memory runtime-truth service is useful for UI behavior and simulation, but it is not equivalent to a backend source of truth.
- `dist/` reflects a built version of the current frontend implementation, not proof of backend existence.

## Recommended Use

Use this document when the question is:

- What does the repo actually do today?
- Which parts are real code versus design docs?
- What can be safely wired next without inventing implementation status?

## Evidence Basis

Derived from direct inspection of:

- `package.json`
- `vite.config.js`
- `dashboard/app.js`
- `dashboard/services/runtimeTruth.js`
- `dashboard/services/renderers.js`
- `dashboard/views/initView.js`
- `dashboard/views/testView.js`
- `dashboard/views/lastRunView.js`
- `dashboard/views/runningProcessView.js`
- `dashboard/shared/constants.js`
- `generated_test_data/`
- `dist/`
