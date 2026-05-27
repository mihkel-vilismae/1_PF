@echo off
setlocal EnableExtensions

REM Drag a repo ZIP onto this file.
REM This launcher intentionally keeps the terminal open after the script finishes.

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "ZIP_PATH=%~1"

title Repo ZIP Drop Installer

echo.
echo ============================================================
echo Repo ZIP Drop Installer
echo ============================================================
echo.
echo Script folder:
echo   %SCRIPT_DIR%
echo.

if "%ZIP_PATH%"=="" (
  echo No ZIP file was provided.
  echo.
  echo How to use:
  echo   1. Put this CMD file in your local repo folder.
  echo   2. Drag the updated repo ZIP onto this CMD file.
  echo.
  echo The terminal will stay open.
  echo.
  cmd /k
  exit /b 1
)

echo Dropped file:
echo   %ZIP_PATH%
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -NoExit -File "%SCRIPT_DIR%\tools\update-local-repo-from-zip.ps1" -ZipPath "%ZIP_PATH%" -RepoPath "%SCRIPT_DIR%"

exit /b %ERRORLEVEL%
