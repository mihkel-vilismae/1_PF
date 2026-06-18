# Scheduler host boundary OpenSpec

Version introduced: 0.8.158

## Purpose

Define the boundary for a future scheduler host that coordinates pipeline, playback, screen on/off, and recovery workers without blocking existing proof lanes.

## Components

- `scheduler-host`: future coordinator process/API boundary.
- `regular-stage-worker`: existing staged pipeline worker lane.
- `playback-worker`: existing playback lane.
- `screen-on-off-worker`: existing screen power/activity lane.
- `recovery-state`: future controlled restore input.

## Required boundaries

1. Scheduler host status may be mocked locally before any real process exists.
2. Mock status must never imply a real worker process was spawned.
3. Screen worker non-blocking proof must show scheduler status can be read without blocking regular/playback lanes.
4. Real scheduler host implementation requires a later proof command and target/platform distinction.

## Non-claims

This document does not implement the scheduler host, does not mutate crontab, does not run real workers, and does not prove Raspberry behavior.
