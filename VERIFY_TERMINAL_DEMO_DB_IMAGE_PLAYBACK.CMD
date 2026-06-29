@echo off
setlocal
cd /d "%~dp0"
echo [PhotoFrame Demo Terminal] Running DB image playback button proof...
echo Repo: %CD%
echo Command: npm run proof:terminal-demo-db-image-playback-button
echo.
npm run proof:terminal-demo-db-image-playback-button
if errorlevel 1 (
  echo.
  echo [PhotoFrame Demo Terminal] DB image playback button proof BLOCKED.
  pause
  exit /b 1
)
echo.
echo [PhotoFrame Demo Terminal] DB image playback button proof PASSED.
echo Decision: TERMINAL_DEMO_DB_IMAGE_PLAYBACK_BUTTON_READY
pause
