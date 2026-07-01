@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "RUNNER_PS1=%SCRIPT_DIR%scripts\windows\run_terminal_demo.ps1"

if not exist "%RUNNER_PS1%" (
  echo [PhotoFrame Demo Terminal] Missing helper script:
  echo   %RUNNER_PS1%
  exit /b 1
)

echo [PhotoFrame Demo Terminal] Starting Windows REAL demo runner...
echo [PhotoFrame Demo Terminal] Operator key S opens start_stage_modal.
echo [PhotoFrame Demo Terminal] start_stage_modal keys: 1 Download disabled; 2 Index; 3 GPS Parser; 4 Geocode; 5 Enqueue for Playback.
echo [PhotoFrame Demo Terminal] Modal batch_size default is 1; allowed modal values are 1 and 3.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%RUNNER_PS1%" -Adapter real-demo
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [PhotoFrame Demo Terminal] REAL runner failed with exit code %EXIT_CODE%.
  echo Press any key to close this window.
  pause >nul
  exit /b %EXIT_CODE%
)

echo.
echo [PhotoFrame Demo Terminal] REAL runner exited successfully.
exit /b 0
