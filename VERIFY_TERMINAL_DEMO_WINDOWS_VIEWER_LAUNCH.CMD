@echo off
setlocal
cd /d "%~dp0"
echo [PhotoFrame Demo Terminal] Verifying Windows viewer launch contract...
echo Repo: %CD%
echo Command: npm run proof:terminal-demo-windows-viewer-launch
echo.
call npm run proof:terminal-demo-windows-viewer-launch
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if "%EXIT_CODE%"=="0" (
  echo [PhotoFrame Demo Terminal] Windows viewer launch proof PASSED.
  echo Decision: TERMINAL_DEMO_WINDOWS_VIEWER_LAUNCH_READY
) else (
  echo [PhotoFrame Demo Terminal] Windows viewer launch proof BLOCKED with exit code %EXIT_CODE%.
)
echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%
