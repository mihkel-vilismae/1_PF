@echo off
REM Windows live native video playback proof wrapper for PF_login.
REM Keeps the public entrypoint thin and delegates proof setup to PowerShell.
REM The delegated script starts a proof-only API with native playback enabled.
REM Normal start_win_full.cmd behavior remains unchanged and native playback stays opt-in.
REM The script returns the PowerShell proof runner exit code to the operator.
setlocal
cd /d "%~dp0"

where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Windows PowerShell was not found on PATH.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_scripts\run_live_windows_native_video_playback_proof.ps1" %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo [ERROR] run_live_windows_native_video_playback_proof.ps1 failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

exit /b 0
