@echo off
setlocal

set "REPO_ROOT=%~dp0"
cd /d "%REPO_ROOT%"

echo [PhotoFrame Demo Terminal] Running v1.0 RC readiness audit...
echo Repo: %CD%
echo Command: npm run proof:terminal-demo-rc-readiness
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

call npm run proof:terminal-demo-rc-readiness
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo [PhotoFrame Demo Terminal] RC readiness audit PASSED.
  echo Evidence was written under terminal\demo\runtime_logs\rc_readiness\
  echo This package is ready to treat as Terminal Demo Mode RC1 unless live operator evidence says otherwise.
) else (
  echo [PhotoFrame Demo Terminal] RC readiness audit BLOCKED with exit code %EXIT_CODE%.
  echo Check terminal\demo\runtime_logs\rc_readiness\ for terminal_demo_rc_readiness.md/json and command logs.
  echo Then run ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD if the blocker comes from operator rehearsal evidence.
)

echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%
