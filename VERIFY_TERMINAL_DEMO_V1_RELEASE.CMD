@echo off
setlocal

set "REPO_ROOT=%~dp0"
cd /d "%REPO_ROOT%"

echo [PhotoFrame Demo Terminal] Running v1.0 final release proof...
echo Repo: %CD%
echo Command: npm run proof:terminal-demo-v1-release
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

call npm run proof:terminal-demo-v1-release
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo [PhotoFrame Demo Terminal] v1.0 final release proof PASSED.
  echo Evidence was written under terminal\demo\runtime_logs\v1_release\
  echo Decision: TERMINAL_DEMO_MODE_V1_RELEASED.
) else (
  echo [PhotoFrame Demo Terminal] v1.0 final release proof BLOCKED with exit code %EXIT_CODE%.
  echo Check terminal\demo\runtime_logs\v1_release\ for terminal_demo_v1_release.md/json and command logs.
)

echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%
