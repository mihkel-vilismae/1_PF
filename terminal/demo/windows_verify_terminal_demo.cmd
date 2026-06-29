@echo off
setlocal

set "TERMINAL_DIR=%~dp0"
for %%I in ("%TERMINAL_DIR%..\..") do set "REPO_ROOT=%%~fI"
set "ROOT_VERIFY=%REPO_ROOT%\VERIFY_TERMINAL_DEMO.CMD"

if not exist "%ROOT_VERIFY%" (
  echo [PhotoFrame Demo Terminal] Root verification launcher not found:
  echo   %ROOT_VERIFY%
  exit /b 1
)

call "%ROOT_VERIFY%"
exit /b %ERRORLEVEL%
