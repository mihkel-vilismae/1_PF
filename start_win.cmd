@echo off
REM Starts the 12_PF dashboard on Windows from the repository root.
REM Checks Node/npm availability, installs dependencies when missing,
REM then opens separate terminals for the API server and Vite frontend.
setlocal
cd /d "%~dp0"

REM If the repo-local .env is missing, seed it from the parent folder.
REM This supports setups where the private .env is kept outside the Git repo.
if not exist ".env" (
  if exist "..\.env" (
    echo [INFO] .env not found in repo root. Copying parent ..\.env into this repo...
    copy /Y "..\.env" ".env" >nul
    if errorlevel 1 (
      echo [ERROR] Failed to copy ..\.env into the repo root.
      pause
      exit /b 1
    )
  ) else (
    echo [WARN] .env not found in repo root, and parent ..\.env does not exist.
    echo [WARN] Continuing startup; backend checks may fail until .env is created.
  )
)

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found on PATH.
  echo Install Node.js, reopen this terminal, and run start_win.cmd again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found on PATH.
  echo Install Node.js/npm, reopen this terminal, and run start_win.cmd again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] node_modules not found. Installing dependencies...
  call npm install --verbose
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

REM Enable local-only raw iCloudPD stdout/stderr capture for login debugging.
REM The raw log is private runtime evidence and must not be exposed through API/UI.
if not defined ICLOUDPD_RAW_STDIO_LOG (
  set "ICLOUDPD_RAW_STDIO_LOG=1"
)
if not defined ICLOUDPD_RAW_STDIO_LOG_PATH (
  set "ICLOUDPD_RAW_STDIO_LOG_PATH=runtime_data\private_logs\icloudpd_raw_stdio.log"
)
echo [INFO] Raw iCloudPD stdout/stderr capture: ICLOUDPD_RAW_STDIO_LOG=%ICLOUDPD_RAW_STDIO_LOG%
echo [INFO] Raw iCloudPD stdout/stderr log: %ICLOUDPD_RAW_STDIO_LOG_PATH%

echo [INFO] Building 12_PF dashboard before starting the API server...
call npm run build
if errorlevel 1 (
  echo [ERROR] npm run build failed. API server was not started.
  pause
  exit /b 1
)

echo [INFO] Starting 12_PF API server in a new terminal...
start "12_PF API" cmd /k "cd /d ""%~dp0"" && npm run api"

echo [INFO] Starting 12_PF frontend in a new terminal...
start "12_PF Frontend" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo [INFO] Starting component status monitor in a new terminal...
start "12_PF Status" cmd /k "cd /d ""%~dp0"" && powershell -NoProfile -ExecutionPolicy Bypass -File ""%~dp0start_scripts\start_component_status.ps1"""

echo [INFO] Startup commands launched.
echo [INFO] API: usually http://127.0.0.1:4301
echo [INFO] Frontend: usually http://localhost:5173
pause
