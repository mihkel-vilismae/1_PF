# View C — Last Run Info

## Purpose
View C exposes the last known run information from the future source of truth. It exists to support recovery, crash inspection, and restore-oriented operator workflows.
In the current repo, the view is still frontend-only and uses explicit demo-state controls to preview the intended layouts.

## Required Display States
### 1. No run yet
The view can open, but it should clearly show:
- `Demo state: no saved run is available`
- run-dependent controls remain disabled

### 2. Error state
If the source of truth cannot be read, the real implementation must display a visible error state instead of silently falling back to empty UI.
The current repo exposes this as a manual demo state.

### 3. Existing previous run
If a prior run exists, the view should show:
- last shown media
- playback state
- stage state
- screen state
- last error or interruption summary
- restore/resume placeholder button

## UI Behavior
The current unwired frontend includes quick controls labeled `Show no-run demo`, `Show error demo`, and `Show ready demo` so the layout can be reviewed before backend wiring begins.

## Future Data Source Expectations
This view should later read from a persisted source of truth that captures:
- last known playback item
- last checkpoint or resume marker
- last active or completed stage
- screen state and inactivity information
- crash or interruption details

## Restore / Resume Placeholder Notes
The current frontend exposes `Resume from saved state (placeholder)` but does not implement any actual restore logic. Its purpose is to reserve the correct operator control for later backend integration.

## Evidence Basis
Derived from the user dashboard specification in this chat. The source basis includes the C view called Last Run Info, the no-run disabled state, the explicit error display requirement, and the requirement to show last file shown, crash/interruption details, and restore-oriented information when a previous run exists.
