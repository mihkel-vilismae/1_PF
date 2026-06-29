@echo off
setlocal

set "REPO_ROOT=%~dp0"
cd /d "%REPO_ROOT%"

echo [PhotoFrame Demo Terminal] Running operator rehearsal proof...
echo Repo: %CD%
echo Command: npm run proof:terminal-demo-operator-rehearsal
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [PhotoFrame Demo Terminal] Node.js was not found on PATH.
  echo Install Node.js and run this file again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [PhotoFrame Demo Terminal] npm was not found on PATH.
  echo Install Node.js/npm and run this file again.
  pause
  exit /b 1
)

call npm run proof:terminal-demo-operator-rehearsal
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo [PhotoFrame Demo Terminal] Operator rehearsal proof PASSED.
  echo Evidence was written under terminal\demo\runtime_logs\operator_rehearsal\
) else (
  echo [PhotoFrame Demo Terminal] Operator rehearsal proof BLOCKED with exit code %EXIT_CODE%.
  echo Check terminal\demo\runtime_logs\operator_rehearsal\ for terminal_demo_status.md/json and command logs.
)

echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%
