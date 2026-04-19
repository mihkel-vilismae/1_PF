# Cron and Watchdog

## Purpose

This document defines how time-based triggering and worker supervision operate.

## Model

Cron is a **triggering mechanism**, not the business authority.
Workers and services remain responsible for state validation, lease acquisition, and duplicate prevention.

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

A cron tick may fire multiple times or overlap, but only the request that successfully acquires the relevant lease may proceed. Others must exit without side effects beyond duplicate-rejected observability.

## Evidence Basis

Derived from the user's requirement that playback and screen workers be checked repeatedly (for example every five seconds) and that cron-related backend/frontend services exist without allowing duplicate active processes.
