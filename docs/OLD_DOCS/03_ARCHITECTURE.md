# Architecture

## Purpose

This document defines the logical architecture that future backend code must follow.

## Primary Components

### 1. Dashboard Frontend

Responsibilities:
- render views A/B/C/D
- invoke backend endpoints through shared frontend services
- display current runtime state, last-run info, logs, and worker status
- never directly mutate authoritative backend state except through documented API calls

### 2. Backend API Layer

Responsibilities:
- validate requests
- expose read/write endpoints to the dashboard
- enforce authorization and input schemas
- delegate execution to application services

### 3. Application Services

Backend services to define and later implement:
- `RuntimeStateService`
- `CronService`
- `ScreenService`
- `PlaybackService`
- `PipelineService`
- `RecoveryService`
- `EventLogService`
- `DatabaseService` (abstraction around durable storage)

### 4. Worker Layer

Workers:
- pipeline worker
- playback worker
- screen worker

Workers run under exclusive leases and update runtime state only within their ownership boundaries.

### 5. Persistence Layer

Durable tables / collections:
- runtime state
- run sessions
- worker leases
- stage runs
- playback queue
- event log
- checkpoints

## Data Flow

1. Frontend sends a command or reads state.
2. Backend API validates and calls an application service.
3. Service acquires required lease or transaction context.
4. Service updates canonical runtime state and event log.
5. Frontend reads projections or snapshots derived from durable state.

## Separation Rules

- Frontend services are transport wrappers, not execution authorities.
- Cron does not own business state; it schedules or nudges backend services.
- Workers do not bypass persistence.
- Logging is not an optional side channel; it is a required architectural layer.

## Deployment Assumption

The architecture assumes one logical system controlling one real runtime target. Horizontal scaling is only allowed if lease rules remain authoritative and duplicate execution remains impossible.

## Evidence Basis

Derived from the user's request for shared frontend/backend service layers for cron, screen, and database access, plus separate handling for the five-stage pipeline, playback worker, and screen on/off worker.
