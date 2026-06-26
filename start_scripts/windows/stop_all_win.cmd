@echo off
REM Stops the Windows processes launched by start_win.cmd or full_windows_runner_status.cmd.
REM This wrapper delegates to STOP_ALL_WIN.PS1 so the process matching logic stays testable.
setlocal
cd /d "%~dp0"

where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Windows PowerShell was not found on PATH.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0STOP_ALL_WIN.PS1" %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo [ERROR] STOP_ALL_WIN.PS1 failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

pause
exit /b 0
