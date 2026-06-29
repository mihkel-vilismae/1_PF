@echo off
setlocal

set "REPO_ROOT=%~dp0"
cd /d "%REPO_ROOT%"

echo [PhotoFrame Demo Terminal] Analyzing operator rehearsal evidence...
echo Repo: %CD%
if "%~1"=="" (
  echo Evidence: latest terminal\demo\runtime_logs\operator_rehearsal\ folder
  set "EVIDENCE_ARG="
) else (
  echo Evidence: %*
  set "EVIDENCE_ARG=%*"
)
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [PhotoFrame Demo Terminal] Node.js was not found on PATH.
  echo Install Node.js and run this file again.
  pause
  exit /b 1
)

if "%~1"=="" (
  node tools\run-terminal-demo-evidence-diagnosis.mjs
) else (
  node tools\run-terminal-demo-evidence-diagnosis.mjs %*
)
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo [PhotoFrame Demo Terminal] Evidence diagnosis completed without BLOCKED issues.
) else (
  echo [PhotoFrame Demo Terminal] Evidence diagnosis found BLOCKED issues.
)
echo Reports were written under terminal\demo\runtime_logs\evidence_diagnosis\
echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%
