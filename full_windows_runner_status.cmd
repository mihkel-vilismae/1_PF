@echo off
REM Opens the PF_login / PhotoFrame full Windows runner and status terminal UI.
REM Current repo version is read from VERSION by the delegated status UI.
setlocal
cd /d "%~dp0"

set "PS_EXE="
where pwsh >nul 2>nul
if not errorlevel 1 set "PS_EXE=pwsh"
if "%PS_EXE%"=="" (
  where powershell >nul 2>nul
  if not errorlevel 1 set "PS_EXE=powershell"
)
if "%PS_EXE%"=="" (
  echo [ERROR] Neither PowerShell 7 ^(pwsh^) nor Windows PowerShell ^(powershell^) was found on PATH.
  pause
  exit /b 1
)

"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_scripts\windows\FULL_WINDOWS_RUNNER_STATUS.PS1" %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo [ERROR] start_scripts\windows\FULL_WINDOWS_RUNNER_STATUS.PS1 failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

exit /b 0
