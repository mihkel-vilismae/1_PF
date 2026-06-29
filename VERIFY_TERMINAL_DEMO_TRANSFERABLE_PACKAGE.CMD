@echo off
setlocal

set "REPO_ROOT=%~dp0"
cd /d "%REPO_ROOT%"

echo [PhotoFrame Demo Terminal] Running transferable RC package proof...
echo Repo: %CD%
echo Command: npm run proof:terminal-demo-transferable-package
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

call npm run proof:terminal-demo-transferable-package
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo [PhotoFrame Demo Terminal] Transferable RC package proof PASSED.
  echo Evidence was written under terminal\demo\runtime_logs\transferable_package\
) else (
  echo [PhotoFrame Demo Terminal] Transferable RC package proof BLOCKED with exit code %EXIT_CODE%.
  echo Check terminal\demo\runtime_logs\transferable_package\ for terminal_demo_transferable_package.md/json.
)

echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%
