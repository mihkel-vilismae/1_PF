@echo off
REM Windows live native playback proof wrapper for PF_login.
REM Keeps the public entrypoint thin and delegates proof setup to PowerShell.
REM The delegated script starts a proof-only API with native playback enabled.
REM Normal start_win_full.cmd behavior remains unchanged and native playback stays opt-in.
REM The script returns the PowerShell proof runner exit code to the operator.
setlocal
for %%I in ("%~dp0..\..\..") do set "REPO_ROOT=%%~fI"
cd /d "%REPO_ROOT%"

where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Windows PowerShell was not found on PATH.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%REPO_ROOT%\start_scripts\run_live_windows_native_playback_proof.ps1" %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo [ERROR] run_live_windows_native_playback_proof.ps1 failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

exit /b 0
