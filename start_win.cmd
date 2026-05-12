@echo off
REM Starts the 12_PF dashboard on Windows from the repository root.
REM Checks Node/npm availability, installs dependencies when missing,
REM then opens separate terminals for the API server and Vite frontend.
setlocal
cd /d "%~dp0"

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

echo [INFO] Starting 12_PF API server in a new terminal...
start "12_PF API" cmd /k "cd /d ""%~dp0"" && npm run api"

echo [INFO] Starting 12_PF frontend in a new terminal...
start "12_PF Frontend" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo [INFO] Startup commands launched.
echo [INFO] API: usually http://127.0.0.1:4301
echo [INFO] Frontend: usually http://localhost:5173
pause
