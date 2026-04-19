# Cron and Watchdog

## Purpose

This document defines how time-based triggering and worker supervision operate.

## Model

Cron or scheduler bootstrap is a **triggering mechanism**, not the business authority.
Workers and services remain responsible for state validation, lease acquisition, and duplicate prevention.

## Current Windows Implementation Note

- the current repo-local 3A implementation keeps the legacy `/api/init/cron/*` route names for compatibility
- on Windows, those routes install and inspect an `AtLogOn` Task Scheduler task that launches a repo-local scheduler host
- the scheduler host, not Task Scheduler itself, owns the 5-second and 15-second timers because Task Scheduler repetition intervals have a documented 1-minute minimum
- the current host only reports heartbeat and tick state; it does not yet invoke real pipeline, playback, screen, or recovery services

## Scheduled Jobs

Recommended default schedule for the real runtime:

- pipeline tick: every 5 seconds
- playback watchdog tick: every 5 seconds
- screen watchdog tick: every 5 seconds
- recovery reconciliation tick: every 15 seconds while recovering

These values may later become configuration entries but must remain explicit in implementation.

## Tick Behavior

### Pipeline tick
- asks `PipelineService` to reconcile whether the next stage should run
- does nothing if pipeline lease cannot be acquired
- does not force parallel stage execution

### Playback watchdog tick
- verifies the playback worker lease and heartbeat
- restarts or recreates the playback worker only if lease recovery rules permit
- writes a watchdog event for restart attempts

### Screen watchdog tick
- verifies the screen worker lease and heartbeat
- restarts or recreates the screen worker only if lease recovery rules permit

## Restart Policy

- first transient failure: retry on next scheduled tick
- repeated failures within a short window: back off and mark component degraded
- non-recoverable configuration/storage failure: move system to `failed`

## Duplicate Trigger Rule

A scheduler tick may fire multiple times or overlap, but only the request that successfully acquires the relevant lease may proceed. Others must exit without side effects beyond duplicate-rejected observability.

## Evidence Basis

Derived from the user's requirement that playback and screen workers be checked repeatedly (for example every five seconds) and that scheduler-related backend/frontend services exist without allowing duplicate active processes.
