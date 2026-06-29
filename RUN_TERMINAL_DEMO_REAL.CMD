@echo off
setlocal
cd /d "%~dp0"
echo [PhotoFrame Demo Terminal] Starting REAL demo terminal...
echo Repo: %CD%
echo Command: terminal\demo\windows_runner_real.cmd
echo.
call "%~dp0terminal\demo\windows_runner_real.cmd"
exit /b %ERRORLEVEL%
