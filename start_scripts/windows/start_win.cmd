@echo off
REM Starts PF_login / PhotoFrame on Windows from the repository root.
REM Delegates environment preparation, dependency install, build, DB initialization,
REM and tabbed service launch to start_scripts\windows\START_WIN.PS1.
setlocal
for %%I in ("%~dp0..\..") do set "REPO_ROOT=%%~fI"
cd /d "%REPO_ROOT%"

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

"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%REPO_ROOT%\start_scripts\windows\START_WIN.PS1" %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo [ERROR] START_WIN.PS1 failed with exit code %EXIT_CODE%.
  pause
  exit /b %EXIT_CODE%
)

exit /b 0
