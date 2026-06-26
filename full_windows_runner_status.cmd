@echo off
REM Opens the PF_login / PhotoFrame full Windows runner and status terminal UI.
setlocal
cd /d "%~dp0"

where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Windows PowerShell was not found on PATH.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_scripts\windows\FULL_WINDOWS_RUNNER_STATUS.PS1" %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo [ERROR] start_scripts\windows\FULL_WINDOWS_RUNNER_STATUS.PS1 failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

exit /b 0
