@echo off
setlocal
cd /d "%~dp0"
echo [PhotoFrame Demo Terminal] Verifying live DEMO DB image playback fixture...
echo Repo: %CD%
echo Command: npm run proof:terminal-demo-live-image-fixture
echo.
call npm run proof:terminal-demo-live-image-fixture
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if "%EXIT_CODE%"=="0" (
  echo [PhotoFrame Demo Terminal] Live image fixture proof PASSED.
) else (
  echo [PhotoFrame Demo Terminal] Live image fixture proof BLOCKED with exit code %EXIT_CODE%.
)
echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%
