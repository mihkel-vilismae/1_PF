@echo off
REM Windows full startup wrapper for the PF_login photo-frame dashboard.
REM Delegates dependency install, test execution, dual-tab launch,
REM and browser opening to start_scripts\start_win_full.ps1.
setlocal
cd /d "%~dp0"

where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Windows PowerShell was not found on PATH.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_scripts\start_win_full.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo [ERROR] start_win_full.ps1 failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

exit /b 0
