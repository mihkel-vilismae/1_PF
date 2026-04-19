# View A — Init

## Purpose
View A is the setup and preparation surface. It groups early lifecycle actions that the operator should perform before relying on the system for tests or real runs.

## Sections
### 1A — Verify .env
This section provides a Run button and a log area for configuration verification. In the current unwired frontend it only updates placeholder status and logs.

### 2A — Database controls
This section provides separate action buttons for:
- Check DB
- Inspect DB
- Delete DB
- Recreate DB

The panel also includes a shared log area and a status badge.

### 3A — Cron controls
This section provides separate action buttons for:
- Install cron
- Check cron
- Print cron

The panel also includes a shared log area and a status badge.

## UI Behavior
- every subsection shows a visible status badge
- every subsection writes frontend-only log entries
- all actions are currently in-memory placeholder actions
- no backend call is made

## Future Backend Wiring Notes
- **1A** should later wire to configuration validation endpoints or local backend checks.
- **2A** should later wire to database lifecycle endpoints or controlled backend commands.
- **3A** should later wire to cron installation, inspection, and print actions.

## UI States
The view currently supports:
- idle
- running
- success
- error-ready pattern in the shared status system

## Evidence Basis
Derived from the user dashboard specification in this chat. The source basis includes the A view, 1A Verify .env, 2A database controls, and 3A cron controls, along with the requirement that each subsection expose actions, status, and logs in the unwired frontend.
