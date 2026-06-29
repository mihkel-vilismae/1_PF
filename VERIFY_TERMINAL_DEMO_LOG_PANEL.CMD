@echo off
setlocal
cd /d "%~dp0"
echo [PhotoFrame Demo Terminal] Verifying real-demo log panel layout...
echo Repo: %CD%
echo Command: npm run proof:terminal-demo-log-panel-layout
echo.
call npm run proof:terminal-demo-log-panel-layout
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if "%EXIT_CODE%"=="0" (
  echo [PhotoFrame Demo Terminal] Log panel layout proof PASSED.
  echo Decision: REAL_DEMO_LOG_PANEL_LAYOUT_READY
) else (
  echo [PhotoFrame Demo Terminal] Log panel layout proof BLOCKED with exit code %EXIT_CODE%.
)
echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%
