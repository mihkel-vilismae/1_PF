@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "RUNNER_PS1=%SCRIPT_DIR%scripts\windows\run_terminal_demo.ps1"

if not exist "%RUNNER_PS1%" (
  echo [PhotoFrame Demo Terminal] Missing helper script:
  echo   %RUNNER_PS1%
  exit /b 1
)

echo [PhotoFrame Demo Terminal] Starting Windows runner...

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%RUNNER_PS1%"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [PhotoFrame Demo Terminal] Runner failed with exit code %EXIT_CODE%.
  echo Press any key to close this window.
  pause >nul
  exit /b %EXIT_CODE%
)

echo.
echo [PhotoFrame Demo Terminal] Runner exited successfully.
exit /b 0
