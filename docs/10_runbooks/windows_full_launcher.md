# Windows Full Launcher Runbook

Use `start_win_full.cmd` from the repository root when you want a full local Windows startup pass.

The launcher performs these steps:

1. Checks that Node.js and npm are available.
2. Copies parent `..\.env` into the repo only when repo `.env` is missing.
3. Runs `npm install --verbose`.
4. Runs `npm test`.
5. Runs `npm run build`.
6. Opens the API, frontend, and component-status monitor in Windows Terminal tabs when `wt.exe` is available.
7. Falls back to separate `cmd.exe` windows when Windows Terminal is unavailable.
8. Opens the frontend at `http://localhost:5173` in the default browser.

Expected long-running tabs/windows:

| Tab/window | Command | URL / purpose |
|---|---|---|
| PF API | `npm run api` | `http://127.0.0.1:4301` |
| PF Frontend | `npm run dev` | `http://localhost:5173` |
| PF Status | `start_scripts/start_component_status.ps1` | Shows API/dashboard running state and versions. |

Keep the API/frontend tabs/windows open while using the dashboard. The status monitor can be closed independently when you no longer need live component visibility.
