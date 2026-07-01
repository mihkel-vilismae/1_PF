@echo off
setlocal
cd /d "%~dp0"
echo [PhotoFrame Demo Terminal] Starting REAL demo terminal...
echo Repo: %CD%
echo Command: terminal\demo\windows_runner_real.cmd
echo Operator: press S to open start_stage_modal.
echo Stages: 1 Download disabled; 2 Index; 3 GPS Parser; 4 Geocode; 5 Enqueue for Playback.
echo.
call "%~dp0terminal\demo\windows_runner_real.cmd"
exit /b %ERRORLEVEL%
