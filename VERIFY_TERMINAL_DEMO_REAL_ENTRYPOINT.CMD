@echo off
setlocal
cd /d "%~dp0"
echo [PhotoFrame Demo Terminal] Running real-demo entrypoint proof...
echo Repo: %CD%
echo Command: npm run proof:terminal-demo-real-entrypoint
echo.
npm run proof:terminal-demo-real-entrypoint
if errorlevel 1 (
  echo.
  echo [PhotoFrame Demo Terminal] Real-demo entrypoint proof BLOCKED.
  pause
  exit /b 1
)
echo.
echo [PhotoFrame Demo Terminal] Real-demo entrypoint proof PASSED.
echo Decision: REAL_DEMO_ENTRYPOINT_READY
pause
