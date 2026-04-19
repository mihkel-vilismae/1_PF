# Photo Frame Dashboard Frontend + System Docs

## Run locally

1. Install dependencies:
   `npm install`
2. Start the development server:
   `npm run dev`
3. Open the local URL printed by Vite.

## Project structure

- `dashboard/` — frontend app shell, styles, views, shared state, and services.
- `docs/` — combined frontend-view docs plus system architecture docs.
- `generated_test_data/` — mock media assets used by the test pipeline UI.
- `vite.config.js` — Vite root mapping so the frontend runs from `dashboard/`.

## Documentation order

1. `docs/00_TABLE_OF_CONTENTS.md`
2. system architecture docs `01` through `14`
3. `docs/issues_errors_discrepancies.md`
4. frontend view docs:
   - `docs/DASHBOARD_OVERVIEW.md`
   - `docs/VIEW_A_INIT.md`
   - `docs/VIEW_B_TEST.md`
   - `docs/VIEW_C_LAST_RUN_INFO.md`
   - `docs/VIEW_D_RUNNING_PROCESS.md`

## Current scope

This bundle contains an unwired frontend plus a stronger system documentation set that defines the future backend architecture, state ownership, locking rules, recovery expectations, and frontend/backend contract.
